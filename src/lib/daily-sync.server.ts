import { getAdminDb } from "@/lib/firebase-admin.server";
import {
  lookupPlaylistVideos,
  searchYouTubeVideos,
  TAMIL_DISCOVERY_QUERIES,
} from "@/lib/api/youtube.functions";

type DailySyncResult = {
  songsDiscovered: number;
  songsAdded: number;
  songsUpdated: number;
  playlistsDiscovered: number;
  playlistsAdded: number;
  playlistsUpdated: number;
  backupsQueued: number;
  queriesRun: string[];
  playlistSources: string[];
};

type YouTubeTrackRow = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  language: string | null;
  source_url: string;
  backup_url?: string | null;
  backup_path?: string | null;
  backup_kind?: "audio" | "video" | null;
  backup_uploaded_at?: string | null;
  added_by?: string | null;
  created_at: string;
  updated_at: string;
};

type YouTubePlaylistRow = {
  playlist_id: string;
  title: string;
  language: string | null;
  track_ids: string;
  source_url: string;
  added_by?: string | null;
  created_at: string;
  updated_at: string;
};

function csvEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseIntegerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function upsertTrack(
  db: ReturnType<typeof getAdminDb>,
  track: Awaited<ReturnType<typeof searchYouTubeVideos>>[number],
  language: string,
  source: string,
) {
  const ref = db.collection("sonexa_youtube_tracks").doc(track.videoId);
  const snapshot = await ref.get();
  const now = new Date().toISOString();
  const existing = snapshot.exists ? (snapshot.data() as Partial<YouTubeTrackRow>) : null;

  const payload: YouTubeTrackRow = {
    video_id: track.videoId,
    title: track.title,
    channel: track.channel,
    thumbnail: track.thumbnail,
    language,
    source_url: track.sourceUrl,
    backup_url: existing?.backup_url ?? null,
    backup_path: existing?.backup_path ?? null,
    backup_kind: existing?.backup_kind ?? null,
    backup_uploaded_at: existing?.backup_uploaded_at ?? null,
    added_by: existing?.added_by ?? source,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  await ref.set(payload, { merge: true });
  return snapshot.exists ? "updated" : "added";
}

async function upsertPlaylist(
  db: ReturnType<typeof getAdminDb>,
  playlist: Awaited<ReturnType<typeof lookupPlaylistVideos>>,
  language: string,
  source: string,
) {
  const ref = db.collection("sonexa_youtube_playlists").doc(playlist.playlistId);
  const snapshot = await ref.get();
  const now = new Date().toISOString();
  const existing = snapshot.exists ? (snapshot.data() as Partial<YouTubePlaylistRow>) : null;

  const payload: YouTubePlaylistRow = {
    playlist_id: playlist.playlistId,
    title: playlist.title,
    language,
    track_ids: playlist.tracks.map((track) => track.videoId).join(","),
    source_url: playlist.sourceUrl,
    added_by: existing?.added_by ?? source,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  await ref.set(payload, { merge: true });
  return snapshot.exists ? "updated" : "added";
}

async function queueBackupJob(track: YouTubeTrackRow) {
  const backendUrl = (process.env.DOWNLOAD_SERVICE_URL ?? "").trim();
  if (!backendUrl) return false;

  const queueResponse = await fetch(`${backendUrl.replace(/\/$/, "")}/queue`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      videoId: track.video_id,
      title: track.title,
      channel: track.channel,
    }),
  });
  if (!queueResponse.ok) return false;

  const queued = (await queueResponse.json()) as { jobId?: string };
  if (!queued.jobId) return false;

  const processResponse = await fetch(`${backendUrl.replace(/\/$/, "")}/process`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: queued.jobId }),
  });

  return processResponse.ok;
}

export async function runDailyYouTubeSync(): Promise<DailySyncResult> {
  const db = getAdminDb();
  const language = (process.env.DAILY_YOUTUBE_LANGUAGE ?? "tamil").trim() || "tamil";
  const queryCount = parseIntegerEnv("DAILY_QUERY_COUNT", 4);
  const discoveryLimit = parseIntegerEnv("DAILY_DISCOVERY_LIMIT", 8);
  const playlistLimit = parseIntegerEnv("DAILY_PLAYLIST_LIMIT", 40);
  const backupLimit = parseIntegerEnv("DAILY_BACKUP_LIMIT", 12);

  const queriesRun =
    csvEnv("DAILY_YOUTUBE_QUERIES").slice(0, queryCount).length > 0
      ? csvEnv("DAILY_YOUTUBE_QUERIES").slice(0, queryCount)
      : TAMIL_DISCOVERY_QUERIES.slice(0, queryCount);
  const playlistSources = csvEnv("DAILY_YOUTUBE_PLAYLISTS");

  let songsDiscovered = 0;
  let songsAdded = 0;
  let songsUpdated = 0;
  let playlistsDiscovered = 0;
  let playlistsAdded = 0;
  let playlistsUpdated = 0;
  let backupsQueued = 0;

  for (const query of queriesRun) {
    const tracks = await searchYouTubeVideos(query, discoveryLimit);
    songsDiscovered += tracks.length;
    for (const track of tracks) {
      const result = await upsertTrack(db, track, language, "daily-discovery");
      if (result === "added") songsAdded++;
      else songsUpdated++;
    }
  }

  for (const playlistUrl of playlistSources) {
    const playlist = await lookupPlaylistVideos(playlistUrl, playlistLimit);
    playlistsDiscovered += playlist.tracks.length;
    const playlistResult = await upsertPlaylist(db, playlist, language, "daily-playlist");
    if (playlistResult === "added") playlistsAdded++;
    else playlistsUpdated++;

    for (const track of playlist.tracks) {
      const result = await upsertTrack(db, track, language, "daily-playlist");
      if (result === "added") songsAdded++;
      else songsUpdated++;
    }
  }

  const allTracks = await db.collection("sonexa_youtube_tracks").get();
  const missingBackups = allTracks.docs
    .map((docSnap) => docSnap.data() as Partial<YouTubeTrackRow>)
    .filter((track) => !track.backup_uploaded_at && !track.backup_url)
    .slice(0, backupLimit);

  for (const track of missingBackups) {
    if (!track.video_id || !track.title || !track.channel) continue;
    const queued = await queueBackupJob(track as YouTubeTrackRow);
    if (queued) backupsQueued++;
  }

  return {
    songsDiscovered,
    songsAdded,
    songsUpdated,
    playlistsDiscovered,
    playlistsAdded,
    playlistsUpdated,
    backupsQueued,
    queriesRun,
    playlistSources,
  };
}
