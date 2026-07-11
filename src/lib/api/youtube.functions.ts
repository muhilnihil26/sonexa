import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachFirebaseAuth } from "@/integrations/firebase/auth-attacher";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import {
  deleteFirestoreDoc,
  getFirestoreDoc,
  listFirestoreDocs,
  setFirestoreDoc,
} from "@/integrations/firebase/firestore-rest";

export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  } catch {
    /* not a URL */
  }
  const m = s.match(/[a-zA-Z0-9_-]{11}/);
  return m ? m[0] : null;
}

function isYouTubeShortsUrl(input: string) {
  try {
    const url = new URL(input.trim());
    return url.pathname.includes("/shorts/");
  } catch {
    return /\bshorts\b/i.test(input);
  }
}

type YouTubeMeta = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  sourceUrl: string;
  approved?: boolean;
};

type YouTubeTrackRow = {
  id: string;
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

type YouTubeRequestRow = YouTubeTrackRow & {
  requested_by: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

type YouTubePlaylistRow = {
  id: string;
  playlist_id: string;
  title: string;
  language: string | null;
  track_ids: string;
  source_url: string;
  added_by?: string | null;
  created_at: string;
  updated_at: string;
};

type FirebaseServerContext = {
  firebaseToken?: string;
  userId: string;
  isAdmin?: boolean;
};

async function assertAdmin(ctx: FirebaseServerContext) {
  if (!ctx.isAdmin) throw new Error("Admin only");
}

function nowIso() {
  return new Date().toISOString();
}

function rowToMeta(row: Omit<YouTubeTrackRow, "id">): YouTubeMeta {
  return {
    videoId: row.video_id,
    title: row.title,
    channel: row.channel,
    thumbnail: row.thumbnail,
    sourceUrl: row.source_url,
    approved: true,
  };
}

function toTrackRow(meta: YouTubeMeta, language: string, userId: string, createdAt?: string) {
  const now = nowIso();
  return {
    video_id: meta.videoId,
    title: meta.title,
    channel: meta.channel,
    thumbnail: meta.thumbnail,
    language,
    source_url: meta.sourceUrl,
    added_by: userId,
    created_at: createdAt ?? now,
    updated_at: now,
  };
}

export async function lookupVideo(url: string): Promise<YouTubeMeta> {
  if (isYouTubeShortsUrl(url)) throw new Error("YouTube Shorts are not supported in Sonexa");
  const videoId = parseYouTubeId(url);
  if (!videoId) throw new Error("Could not extract a YouTube video id from that URL");

  const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok)
    throw new Error(
      `Video unavailable (HTTP ${res.status}) - likely removed, private, or embed disabled.`,
    );
  const json = (await res.json()) as { title: string; author_name: string };
  return {
    videoId,
    title: json.title,
    channel: json.author_name,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    sourceUrl,
  };
}

function decodeXml(input: string) {
  return input
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function resolveChannelId(input: string): Promise<string> {
  const direct = input.match(/UC[a-zA-Z0-9_-]{22}/)?.[0];
  if (direct) return direct;

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Paste a valid YouTube channel link");
  }

  const res = await fetch(url.toString(), { headers: { "User-Agent": "Mozilla/5.0 Sonexa" } });
  if (!res.ok) throw new Error(`Could not open channel page (HTTP ${res.status})`);
  const html = await res.text();
  const channelId =
    html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/)?.[1] ??
    html.match(
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})"/,
    )?.[1] ??
    html.match(/channel_id=(UC[a-zA-Z0-9_-]{22})/)?.[1];
  if (!channelId) throw new Error("Could not extract a channel id from that link");
  return channelId;
}

export async function lookupChannelVideos(channelUrl: string, limit: number): Promise<YouTubeMeta[]> {
  const channelId = await resolveChannelId(channelUrl);
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  if (!res.ok) throw new Error(`Could not read channel feed (HTTP ${res.status})`);
  const xml = await res.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .slice(0, limit)
    .map((entry) => {
      const block = entry[1];
      const videoId = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? "";
      const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "YouTube song");
      const channel = decodeXml(
        block.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/)?.[1] ?? "YouTube",
      );
      return {
        videoId,
        title,
        channel,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter((track) => track.videoId);
}

function parseYouTubePlaylistId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    return url.searchParams.get("list");
  } catch {
    const match = input.match(/[?&]list=([a-zA-Z0-9_-]+)/) ?? input.match(/^PL[a-zA-Z0-9_-]+$/);
    return match?.[1] ?? match?.[0] ?? null;
  }
}

function pageTitle(html: string, fallback: string) {
  const raw =
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ??
    html.match(/<title>(.*?)<\/title>/)?.[1] ??
    fallback;
  return decodeXml(raw.replace(/ - YouTube$/, "").trim()) || fallback;
}

export async function lookupPlaylistVideos(playlistUrl: string, limit: number) {
  const playlistId = parseYouTubePlaylistId(playlistUrl);
  if (!playlistId) throw new Error("Paste a valid YouTube playlist link");
  const sourceUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0 Sonexa" } });
  if (!res.ok) throw new Error(`Could not open playlist page (HTTP ${res.status})`);
  const html = await res.text();
  const videoIds = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)]
    .map((match) => match[1])
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, limit);
  if (!videoIds.length) throw new Error("Could not extract videos from that playlist");
  const tracks = await Promise.all(
    videoIds.map((id) => lookupVideo(`https://www.youtube.com/watch?v=${id}`)),
  );
  return {
    playlistId,
    title: pageTitle(html, "YouTube playlist"),
    sourceUrl,
    tracks,
  };
}

export async function searchYouTubeVideos(query: string, limit: number): Promise<YouTubeMeta[]> {
  const term = query.trim();
  if (!term) return [];
  const approvedRows = await listFirestoreDocs<Omit<YouTubeTrackRow, "id">>(
    "sonexa_youtube_tracks",
  ).catch(() => []);
  const needle = term.toLowerCase();
  const approvedMatches = approvedRows
    .filter((track) =>
      `${track.title} ${track.channel} ${track.language ?? ""}`.toLowerCase().includes(needle),
    )
    .map((track) => ({ ...rowToMeta(track), approved: true }));
  
  // Search for both songs and videos
  const searchQuery = `${term}`;
  const res = await fetch(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 Sonexa" },
    },
  ).catch(() => null);
  if (!res) return approvedMatches.slice(0, limit);
  if (!res.ok) return approvedMatches.slice(0, limit);
  const html = await res.text();
  const videoIds = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)]
    .map((match) => match[1])
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, limit * 3);
  
  // Less restrictive filtering - allow videos, not just songs
  const blocked =
    /\b(news|shorts|short|live news|breaking|trailer|review|interview|vlog|podcast|episode|serial|movie scene|teaser|gaming|tutorial)\b/i;
  const musicWords =
    /\b(song|music|audio|lyric|lyrics|official|video|theme|bgm|ost|soundtrack|remix|cover|single|cinematic|visual|scene)\b/i;
  
  const settled = await Promise.allSettled(
    videoIds.map((id) => lookupVideo(`https://www.youtube.com/watch?v=${id}`)),
  );
  const tracks = settled
    .filter(
      (result): result is PromiseFulfilledResult<YouTubeMeta> => result.status === "fulfilled",
    )
    .map((result) => result.value)
    .filter((track) => {
      const haystack = `${track.title} ${track.channel}`;
      // Allow if it's music-related OR if it's a video content (not blocked)
      return !blocked.test(haystack) && (musicWords.test(haystack) || !/\b(news|gaming|tutorial)\b/i.test(haystack));
    })
    .slice(0, limit);
  const approvedIds = new Set(approvedRows.map((track) => track.video_id));
  return [
    ...approvedMatches,
    ...tracks.map((track) => ({ ...track, approved: approvedIds.has(track.videoId) })),
  ]
    .filter(
      (track, index, all) => all.findIndex((item) => item.videoId === track.videoId) === index,
    )
    .slice(0, limit);
}

const language = z.string().min(2).max(40).default("tamil");

export const lookupYouTube = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(z.object({ url: z.string().min(1).max(500) }))
  .handler(async ({ data }) => lookupVideo(data.url));

export const searchYouTube = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(
    z.object({
      query: z.string().min(2).max(120),
      limit: z.number().int().min(1).max(80).default(24),
    }),
  )
  .handler(async ({ data }) => ({ results: await searchYouTubeVideos(data.query, data.limit) }));

export const listAdminYouTubeTracks = createServerFn({ method: "GET" }).handler(async () => {
  const tracks = await listFirestoreDocs<Omit<YouTubeTrackRow, "id">>(
    "sonexa_youtube_tracks",
  ).catch(() => []);
  return {
    tracks: tracks
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 500),
  };
});

export const listAdminYouTubePlaylists = createServerFn({ method: "GET" }).handler(async () => {
  const [playlists, tracks] = await Promise.all([
    listFirestoreDocs<Omit<YouTubePlaylistRow, "id">>("sonexa_youtube_playlists").catch(() => []),
    listFirestoreDocs<Omit<YouTubeTrackRow, "id">>("sonexa_youtube_tracks").catch(() => []),
  ]);
  const trackMap = new Map(tracks.map((track) => [track.video_id, track]));
  return {
    playlists: playlists
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 200)
      .map((playlist) => ({
        ...playlist,
        tracks: String(playlist.track_ids ?? "")
          .split(",")
          .map((id) => trackMap.get(id))
          .filter(Boolean),
      })),
  };
});

export const adminAddYouTubeTrack = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ url: z.string().min(1).max(500), language }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const meta = await lookupVideo(data.url);
    const existing = await getFirestoreDoc<Omit<YouTubeTrackRow, "id">>(
      `sonexa_youtube_tracks/${meta.videoId}`,
      context.firebaseToken,
    );
    await setFirestoreDoc(
      `sonexa_youtube_tracks/${meta.videoId}`,
      toTrackRow(meta, data.language, context.userId, existing?.created_at as string | undefined),
      context.firebaseToken,
    );
    return { track: meta };
  });

export const adminAddYouTubeChannel = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      url: z.string().min(1).max(500),
      language,
      limit: z.number().int().min(1).max(25).default(12),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const tracks = await lookupChannelVideos(data.url, data.limit);
    await Promise.all(
      tracks.map(async (track) => {
        const existing = await getFirestoreDoc<Omit<YouTubeTrackRow, "id">>(
          `sonexa_youtube_tracks/${track.videoId}`,
          context.firebaseToken,
        );
        return setFirestoreDoc(
          `sonexa_youtube_tracks/${track.videoId}`,
          toTrackRow(
            track,
            data.language,
            context.userId,
            existing?.created_at as string | undefined,
          ),
          context.firebaseToken,
        );
      }),
    );
    return { inserted: tracks.length, tracks };
  });

export const adminAddYouTubePlaylist = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      url: z.string().min(1).max(500),
      language,
      limit: z.number().int().min(1).max(200).default(100),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const playlist = await lookupPlaylistVideos(data.url, data.limit);
    const existingTracks = await listFirestoreDocs<Omit<YouTubeTrackRow, "id">>(
      "sonexa_youtube_tracks",
      context.firebaseToken,
    ).catch(() => []);
    const existingIds = new Set(existingTracks.map((track) => track.video_id));
    const newTracks = playlist.tracks.filter((track) => !existingIds.has(track.videoId));
    const skippedTracks = playlist.tracks.filter((track) => existingIds.has(track.videoId));
    await Promise.all(
      newTracks.map((track) =>
        setFirestoreDoc(
          `sonexa_youtube_tracks/${track.videoId}`,
          toTrackRow(track, data.language, context.userId),
          context.firebaseToken,
        ),
      ),
    );
    const now = nowIso();
    const existingPlaylist = await getFirestoreDoc<Omit<YouTubePlaylistRow, "id">>(
      `sonexa_youtube_playlists/${playlist.playlistId}`,
      context.firebaseToken,
    );
    await setFirestoreDoc(
      `sonexa_youtube_playlists/${playlist.playlistId}`,
      {
        playlist_id: playlist.playlistId,
        title: playlist.title,
        language: data.language,
        track_ids: playlist.tracks.map((track) => track.videoId).join(","),
        source_url: playlist.sourceUrl,
        added_by: context.userId,
        created_at: (existingPlaylist?.created_at as string | undefined) ?? now,
        updated_at: now,
      },
      context.firebaseToken,
    );
    return {
      inserted: newTracks.length,
      skipped: skippedTracks.length,
      skippedTitles: skippedTracks.map((track) => track.title),
      playlist: { ...playlist, tracks: newTracks },
    };
  });

export const adminRemoveYouTubeTrack = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ videoId: z.string().min(11).max(20) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await deleteFirestoreDoc(`sonexa_youtube_tracks/${data.videoId}`, context.firebaseToken);
    return { ok: true };
  });

export const adminCreateYouTubeBackupUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      videoId: z.string().min(11).max(20),
      fileName: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const track = await getFirestoreDoc<Omit<YouTubeTrackRow, "id">>(
      `sonexa_youtube_tracks/${data.videoId}`,
      context.firebaseToken,
    );
    if (!track) throw new Error("YouTube song not found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const clean = data.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
    const path = `youtube-backups/${data.videoId}/${crypto.randomUUID()}-${clean}`;
    const upload = await supabaseAdmin.storage.from("audio").createSignedUploadUrl(path);
    if (upload.error) throw upload.error;
    return { path, token: upload.data.token };
  });

export const adminAttachYouTubeBackup = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      videoId: z.string().min(11).max(20),
      path: z.string().min(1).max(500),
      kind: z.enum(["audio", "video"]).default("audio"),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const track = await getFirestoreDoc<Omit<YouTubeTrackRow, "id">>(
      `sonexa_youtube_tracks/${data.videoId}`,
      context.firebaseToken,
    );
    if (!track) throw new Error("YouTube song not found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const signed = await supabaseAdmin.storage
      .from("audio")
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);
    if (signed.error) throw signed.error;
    await setFirestoreDoc(
      `sonexa_youtube_tracks/${data.videoId}`,
      {
        ...track,
        backup_url: signed.data.signedUrl,
        backup_path: data.path,
        backup_kind: data.kind,
        backup_uploaded_at: nowIso(),
        updated_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { url: signed.data.signedUrl };
  });

export const submitYouTubeRequest = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(z.object({ url: z.string().min(1).max(500), language }))
  .handler(async ({ data, context }) => {
    const meta = await lookupVideo(data.url);
    const exists = await getFirestoreDoc<Omit<YouTubeTrackRow, "id">>(
      `sonexa_youtube_tracks/${meta.videoId}`,
      context.firebaseToken,
    );
    if (exists) return { status: "already_approved" as const, request: meta };

    const now = nowIso();
    const requestId = `${context.userId}_${meta.videoId}`;
    await setFirestoreDoc(
      `sonexa_youtube_requests/${requestId}`,
      {
        requested_by: context.userId,
        video_id: meta.videoId,
        title: meta.title,
        channel: meta.channel,
        thumbnail: meta.thumbnail,
        language: data.language,
        source_url: meta.sourceUrl,
        status: "pending",
        created_at: now,
        updated_at: now,
        reviewed_by: null,
        reviewed_at: null,
      },
      context.firebaseToken,
    );
    return { status: "pending" as const, request: meta };
  });

export const adminListYouTubeRequests = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const requests = await listFirestoreDocs<Omit<YouTubeRequestRow, "id">>(
      "sonexa_youtube_requests",
      context.firebaseToken,
    );
    return {
      requests: requests
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 100),
    };
  });

export const adminReviewYouTubeRequest = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ requestId: z.string().min(12).max(200), approve: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const req = await getFirestoreDoc<Omit<YouTubeRequestRow, "id">>(
      `sonexa_youtube_requests/${data.requestId}`,
      context.firebaseToken,
    );
    if (!req) throw new Error("Request not found");

    if (data.approve) {
      await setFirestoreDoc(
        `sonexa_youtube_tracks/${req.video_id}`,
        toTrackRow(
          {
            videoId: String(req.video_id),
            title: String(req.title),
            channel: String(req.channel),
            thumbnail: String(req.thumbnail),
            sourceUrl: String(req.source_url),
          },
          String(req.language ?? "tamil"),
          context.userId,
        ),
        context.firebaseToken,
      );
    }

    await setFirestoreDoc(
      `sonexa_youtube_requests/${data.requestId}`,
      {
        ...req,
        status: data.approve ? "approved" : "rejected",
        reviewed_by: context.userId,
        reviewed_at: nowIso(),
        updated_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { ok: true };
  });

type DownloadJob = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  startedAt: string;
  completedAt?: string;
  currentVideoId?: string;
  error?: string;
};

type DownloadStatus = {
  job: DownloadJob | null;
  recentJobs: DownloadJob[];
};

// In-memory storage for download jobs (in production, use Redis or database)
const downloadJobs = new Map<string, DownloadJob>();

async function startBulkDownloadJob(
  tracks: Omit<YouTubeTrackRow, "id">[],
  firebaseToken: string,
): Promise<DownloadJob> {
  const jobId = crypto.randomUUID();
  const job: DownloadJob = {
    id: jobId,
    status: "pending",
    total: tracks.length,
    completed: 0,
    failed: 0,
    skipped: 0,
    startedAt: nowIso(),
  };
  downloadJobs.set(jobId, job);

  // Start processing in background
  processDownloadJob(jobId, tracks, firebaseToken).catch((error) => {
    console.error(`Download job ${jobId} failed:`, error);
    const currentJob = downloadJobs.get(jobId);
    if (currentJob) {
      currentJob.status = "failed";
      currentJob.error = error instanceof Error ? error.message : "Unknown error";
      currentJob.completedAt = nowIso();
    }
  });

  return job;
}

async function processDownloadJob(
  jobId: string,
  tracks: Omit<YouTubeTrackRow, "id">[],
  firebaseToken: string,
) {
  const job = downloadJobs.get(jobId);
  if (!job) return;

  job.status = "running";

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // RapidAPI configuration
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = "free-mp3-mp4-youtube.p.rapidapi.com";

  for (const track of tracks) {
    const currentJob = downloadJobs.get(jobId);
    if (!currentJob || currentJob.status === "failed") break;

    // Skip if backup already exists
    if (track.backup_url && track.backup_uploaded_at) {
      currentJob.skipped++;
      currentJob.completed++;
      continue;
    }

    currentJob.currentVideoId = track.video_id;

    try {
      let downloadUrl: string | null = null;

      // Try RapidAPI first if key is available
      if (rapidApiKey) {
        try {
          const rapidApiUrl = `https://${rapidApiHost}/med${track.video_id}/MP3/spinner/2196f3/100/box-button/2196f3/tiny-button/Download/FFFFFF/yes/FFFFFF/none`;
          
          const response = await fetch(rapidApiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-rapidapi-host': rapidApiHost,
              'x-rapidapi-key': rapidApiKey,
            },
          });

          if (response.ok) {
            // The API returns a download URL or redirects to the MP3
            downloadUrl = response.url;
            console.log(`RapidAPI download successful for ${track.video_id}`);
          } else {
            console.warn(`RapidAPI failed for ${track.video_id}: ${response.status}`);
          }
        } catch (rapidApiError) {
          console.warn(`RapidAPI error for ${track.video_id}:`, rapidApiError);
        }
      }

      // Fallback to backend service if RapidAPI fails
      if (!downloadUrl) {
        const backendServiceUrl = process.env.DOWNLOAD_SERVICE_URL || "http://localhost:3001";

        // Add to backend download queue
        const queueResponse = await fetch(`${backendServiceUrl}/queue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: track.video_id,
            title: track.title,
            channel: track.channel,
          }),
        });

        if (!queueResponse.ok) {
          throw new Error(`Failed to queue download: ${queueResponse.statusText}`);
        }

        const { jobId: backendJobId } = await queueResponse.json();

        // Process the download
        const processResponse = await fetch(`${backendServiceUrl}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: backendJobId }),
        });

        if (!processResponse.ok) {
          throw new Error(`Failed to process download: ${processResponse.statusText}`);
        }

        // Wait for download to complete (poll for status)
        let downloadComplete = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes with 5 second intervals

        while (!downloadComplete && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

          const statusResponse = await fetch(`${backendServiceUrl}/queue`);
          if (statusResponse.ok) {
            const queueData = await statusResponse.json();
            const jobStatus = queueData.queue.find((j: any) => j.jobId === backendJobId);

            if (jobStatus) {
              if (jobStatus.status === 'completed') {
                downloadComplete = true;
                downloadUrl = jobStatus.backupUrl;
              } else if (jobStatus.status === 'failed') {
                throw new Error(jobStatus.error || 'Download failed');
              }
            }
          }

          attempts++;
        }

        if (!downloadComplete) {
          throw new Error('Download timeout');
        }
      }

      // If we have a download URL, upload to Supabase and update Firestore
      if (downloadUrl) {
        // Download the MP3 file
        const mp3Response = await fetch(downloadUrl);
        if (!mp3Response.ok) {
          throw new Error(`Failed to download MP3: ${mp3Response.statusText}`);
        }

        const mp3Buffer = await mp3Response.arrayBuffer();
        const mp3Blob = new Blob([mp3Buffer], { type: 'audio/mpeg' });

        // Upload to Supabase
        const cleanTitle = track.title.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-100);
        const path = `youtube-backups/${track.video_id}/${crypto.randomUUID()}-${cleanTitle}.mp3`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('audio')
          .upload(path, mp3Blob, {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
        }

        // Create signed URL
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
          .from('audio')
          .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedError || !signedData?.signedUrl) {
          throw new Error(`Failed to create signed URL: ${signedError?.message}`);
        }

        // Update Firestore with backup URL
        const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
        const { firebaseDb } = await import("@/integrations/firebase/client");

        await updateDoc(doc(firebaseDb, "sonexa_youtube_tracks", track.video_id), {
          backup_url: signedData.signedUrl,
          backup_path: path,
          backup_kind: "audio",
          backup_uploaded_at: nowIso(),
          updated_at: nowIso(),
        });

        console.log(`Successfully processed ${track.video_id}`);
      }

      currentJob.completed++;
    } catch (error) {
      console.error(`Failed to process ${track.video_id}:`, error);
      currentJob.failed++;
      currentJob.completed++;
    }
  }

  const finalJob = downloadJobs.get(jobId);
  if (finalJob) {
    finalJob.status = finalJob.failed > 0 ? "completed" : "completed";
    finalJob.completedAt = nowIso();
    finalJob.currentVideoId = undefined;
  }
}

export const adminStartBulkDownload = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      language: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const tracks = await listFirestoreDocs<Omit<YouTubeTrackRow, "id">>(
      "sonexa_youtube_tracks",
      context.firebaseToken,
    ).catch(() => []);

    // Filter by language if specified
    let filteredTracks = tracks;
    if (data.language) {
      filteredTracks = tracks.filter((track) => track.language === data.language);
    }

    // Filter out tracks that already have backups
    const tracksWithoutBackups = filteredTracks.filter(
      (track) => !track.backup_url || !track.backup_uploaded_at,
    );

    // Apply limit
    const tracksToDownload = tracksWithoutBackups.slice(0, data.limit);

    if (tracksToDownload.length === 0) {
      return {
        job: null,
        message: data.language
          ? `No tracks without backups found for language: ${data.language}`
          : "All tracks already have backups",
      };
    }

    const job = await startBulkDownloadJob(tracksToDownload, context.firebaseToken);
    
    return {
      job,
      message: `Started download job for ${tracksToDownload.length} tracks`,
    };
  });

export const adminGetDownloadStatus = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    
    const jobs = Array.from(downloadJobs.values())
      .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
      .slice(0, 10);

    const activeJob = jobs.find((job) => job.status === "running" || job.status === "pending");

    return {
      job: activeJob || null,
      recentJobs: jobs,
    };
  });

export const adminCancelDownload = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ jobId: z.string() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const job = downloadJobs.get(data.jobId);
    if (!job) throw new Error("Download job not found");
    
    job.status = "failed";
    job.error = "Cancelled by admin";
    job.completedAt = nowIso();
    
    return { ok: true };
  });

// AI YouTube Discovery System
export const adminDiscoverYouTubeContent = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      query: z.string().min(2).max(100),
      language: z.string().default("tamil"),
      limit: z.number().int().min(1).max(50).default(10),
      autoApprove: z.boolean().default(false),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    // Search YouTube for Tamil content
    const results = await searchYouTubeVideos(data.query, data.limit);
    
    let added = 0;
    let skipped = 0;
    
    for (const track of results) {
      try {
        const existing = await getFirestoreDoc<Omit<YouTubeTrackRow, "id">>(
          `sonexa_youtube_tracks/${track.videoId}`,
          context.firebaseToken,
        );
        
        if (existing) {
          skipped++;
          continue;
        }
        
        if (data.autoApprove) {
          await setFirestoreDoc(
            `sonexa_youtube_tracks/${track.videoId}`,
            toTrackRow(track, data.language, context.userId),
            context.firebaseToken,
          );
          added++;
        } else {
          // Create as pending request
          const requestId = `${context.userId}_${track.videoId}`;
          await setFirestoreDoc(
            `sonexa_youtube_requests/${requestId}`,
            {
              requested_by: context.userId,
              video_id: track.videoId,
              title: track.title,
              channel: track.channel,
              thumbnail: track.thumbnail,
              language: data.language,
              source_url: track.sourceUrl,
              status: "pending",
              created_at: nowIso(),
              updated_at: nowIso(),
              reviewed_by: null,
              reviewed_at: null,
            },
            context.firebaseToken,
          );
          added++;
        }
      } catch (error) {
        console.error(`Failed to process ${track.videoId}:`, error);
      }
    }
    
    return {
      discovered: results.length,
      added,
      skipped,
      message: `Discovered ${results.length} tracks, added ${added}, skipped ${skipped}`,
    };
  });

// Predefined Tamil discovery queries - Enhanced for daily addition
export const TAMIL_DISCOVERY_QUERIES = [
  // Latest releases
  "Tamil songs 2024 latest",
  "Tamil new releases this week",
  "Tamil trending songs 2024",
  "Tamil viral songs",
  
  // Cinema/Movie music
  "Tamil cinema music hits",
  "Tamil movie songs 2024",
  "Tamil film songs latest",
  "Tamil bgm instrumental",
  
  // Genre-specific
  "Tamil indie folk songs",
  "Tamil devotional songs",
  "Tamil romantic songs",
  "Tamil beat songs",
  "Tamil melody songs",
  "Tamil rap hip hop",
  "Tamil classical music",
  "Tamil pop songs",
  
  // Mood-based
  "Tamil sad songs",
  "Tamil party songs",
  "Tamil workout songs",
  "Tamil chill songs",
  "Tamil motivational songs",
  
  // Artist-specific (popular)
  "Anirudh Ravichander latest",
  "A R Rahman Tamil songs",
  "Yuvan Shankar Raja latest",
  "D Imman Tamil songs",
  "G V Prakash Kumar latest",
  
  // Video content
  "Tamil music videos 2024",
  "Tamil lyrical videos",
  "Tamil video songs HD",
];

export const adminAutoDiscoverTamilContent = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      autoApprove: z.boolean().default(false),
      queriesPerRun: z.number().int().min(1).max(5).default(3),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const queriesToRun = TAMIL_DISCOVERY_QUERIES.slice(0, data.queriesPerRun);
    let totalDiscovered = 0;
    let totalAdded = 0;
    let totalSkipped = 0;
    
    for (const query of queriesToRun) {
      // Call the discovery function directly with the search logic
      const results = await searchYouTubeVideos(query, 8);
      
      let added = 0;
      let skipped = 0;
      
      for (const track of results) {
        try {
          const existing = await getFirestoreDoc<Omit<YouTubeTrackRow, "id">>(
            `sonexa_youtube_tracks/${track.videoId}`,
            context.firebaseToken,
          );
          
          if (existing) {
            skipped++;
            continue;
          }
          
          if (data.autoApprove) {
            await setFirestoreDoc(
              `sonexa_youtube_tracks/${track.videoId}`,
              toTrackRow(track, "tamil", context.userId),
              context.firebaseToken,
            );
            added++;
          } else {
            const requestId = `${context.userId}_${track.videoId}`;
            await setFirestoreDoc(
              `sonexa_youtube_requests/${requestId}`,
              {
                requested_by: context.userId,
                video_id: track.videoId,
                title: track.title,
                channel: track.channel,
                thumbnail: track.thumbnail,
                language: "tamil",
                source_url: track.sourceUrl,
                status: "pending",
                created_at: nowIso(),
                updated_at: nowIso(),
                reviewed_by: null,
                reviewed_at: null,
              },
              context.firebaseToken,
            );
            added++;
          }
        } catch (error) {
          console.error(`Failed to process ${track.videoId}:`, error);
        }
      }
      
      totalDiscovered += results.length;
      totalAdded += added;
      totalSkipped += skipped;
    }
    
    return {
      queriesRun: queriesToRun.length,
      totalDiscovered,
      totalAdded,
      totalSkipped,
      message: `Auto-discovery complete: ${totalDiscovered} tracks found, ${totalAdded} added, ${totalSkipped} skipped`,
    };
  });

// Radio Station Management
type RadioStationRow = {
  id: string;
  name: string;
  description: string;
  youtube_url: string;
  youtube_video_id: string;
  icon: string;
  color: string;
  based_on: "song" | "artist" | "genre" | "custom";
  seed_track?: string;
  seed_artist?: string;
  seed_genre?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export const listRadioStations = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const stations = await listFirestoreDocs<RadioStationRow>("sonexa_radio_stations");
    return { stations };
  });

export const adminCreateRadioStation = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      youtubeUrl: z.string().url(),
      icon: z.string().default("Radio"),
      color: z.string().default("from-purple-500 to-pink-500"),
      basedOn: z.enum(["song", "artist", "genre", "custom"]).default("custom"),
      seedTrack: z.string().optional(),
      seedArtist: z.string().optional(),
      seedGenre: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.isAdmin) throw new Error("Admin only");

    const videoId = parseYouTubeId(data.youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL");

    const stationId = `radio_${crypto.randomUUID()}`;
    const now = nowIso();

    const station: RadioStationRow = {
      id: stationId,
      name: data.name,
      description: data.description,
      youtube_url: data.youtubeUrl,
      youtube_video_id: videoId,
      icon: data.icon,
      color: data.color,
      based_on: data.basedOn,
      seed_track: data.seedTrack,
      seed_artist: data.seedArtist,
      seed_genre: data.seedGenre,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
    };

    await setFirestoreDoc(`sonexa_radio_stations/${stationId}`, station, context.firebaseToken);
    return { station };
  });

export const adminUpdateRadioStation = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      stationId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().min(1),
      youtubeUrl: z.string().url(),
      icon: z.string(),
      color: z.string(),
      basedOn: z.enum(["song", "artist", "genre", "custom"]),
      seedTrack: z.string().optional(),
      seedArtist: z.string().optional(),
      seedGenre: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.isAdmin) throw new Error("Admin only");

    const videoId = parseYouTubeId(data.youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL");

    const existing = await getFirestoreDoc<RadioStationRow>(
      `sonexa_radio_stations/${data.stationId}`,
      context.firebaseToken,
    );
    if (!existing) throw new Error("Station not found");

    const updated: RadioStationRow = {
      ...existing,
      name: data.name,
      description: data.description,
      youtube_url: data.youtubeUrl,
      youtube_video_id: videoId,
      icon: data.icon,
      color: data.color,
      based_on: data.basedOn,
      seed_track: data.seedTrack,
      seed_artist: data.seedArtist,
      seed_genre: data.seedGenre,
      updated_at: nowIso(),
    };

    await setFirestoreDoc(
      `sonexa_radio_stations/${data.stationId}`,
      updated,
      context.firebaseToken,
    );
    return { station: updated };
  });

export const adminDeleteRadioStation = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      stationId: z.string().min(1),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.isAdmin) throw new Error("Admin only");

    await deleteFirestoreDoc(`sonexa_radio_stations/${data.stationId}`, context.firebaseToken);
    return { success: true };
  });
