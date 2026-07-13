import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachFirebaseAuth } from "@/integrations/firebase/auth-attacher";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import {
  getFirestoreDoc,
  listFirestoreDocs,
  setFirestoreDoc,
} from "@/integrations/firebase/firestore-rest";
import { listSongs } from "./catalog.functions";

type FirebaseServerContext = {
  firebaseToken?: string;
  userId: string;
  isAdmin?: boolean;
};

type SongStats = {
  view_count?: string | null;
  like_count?: string | null;
  updated_at?: string | null;
};

type SongComment = {
  id: string;
  track_id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
};

type IntroConfig = {
  youtube_url?: string | null;
  title?: string | null;
  updated_at?: string | null;
};

type FeatureConfig = {
  itunes_enabled?: boolean | null;
  radio_enabled?: boolean | null;
  player_transparency?: number | null;
  updated_at?: string | null;
};

type LocalLibraryBackup = {
  playlists?: string | null;
  likes?: string | null;
  taste?: string | null;
  languages?: string | null;
  updated_at?: string | null;
};

function safeDocId(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 160);
}

function nowIso() {
  return new Date().toISOString();
}

async function assertAdmin(ctx: FirebaseServerContext) {
  if (!ctx.isAdmin) throw new Error("Admin only");
}

async function findPublicSong(trackId: string) {
  const catalog = await listSongs();
  const song = catalog.songs.find((item) => item.id === trackId);
  if (song) {
    return {
      id: song.id,
      title: String(song.title ?? "Untitled"),
      artist: (song as { artists?: { name?: string } | null }).artists?.name ?? "Unknown",
      artistId: song.artist_id ?? undefined,
      cover: String(song.cover_url ?? ""),
      audio: String(song.audio_url ?? ""),
      album: (song as { albums?: { title?: string } | null }).albums?.title ?? undefined,
      kind: "audio" as const,
    };
  }

  const youtube = await listFirestoreDocs<{
    video_id: string;
    title: string;
    channel: string;
    thumbnail: string;
    language: string | null;
    source_url: string;
    backup_url?: string | null;
  }>("sonexa_youtube_tracks").catch(() => []);
  const yt = youtube.find((item) => `yt_${item.video_id}` === trackId || item.video_id === trackId);
  if (!yt) return null;
  return {
    id: `yt_${yt.video_id}`,
    title: yt.title,
    artist: yt.channel,
    cover: yt.thumbnail,
    audio: yt.backup_url ?? "",
    language: yt.language ?? undefined,
    kind: yt.backup_url ? ("audio" as const) : ("youtube" as const),
    ytId: yt.video_id,
  };
}

export const getPublicSong = createServerFn({ method: "POST" })
  .inputValidator(z.object({ trackId: z.string().min(1).max(180) }))
  .handler(async ({ data }) => ({ track: await findPublicSong(data.trackId) }));

export const getSongSocial = createServerFn({ method: "POST" })
  .inputValidator(z.object({ trackId: z.string().min(1).max(180) }))
  .handler(async ({ data }) => {
    const trackId = safeDocId(data.trackId);
    const [stats, comments] = await Promise.all([
      getFirestoreDoc<SongStats>(`sonexa_song_stats/${trackId}`).catch(() => null),
      listFirestoreDocs<Omit<SongComment, "id">>("sonexa_song_comments").catch(() => []),
    ]);
    return {
      stats: {
        viewCount: Number(stats?.view_count ?? 0),
        likeCount: Number(stats?.like_count ?? 0),
      },
      comments: comments
        .filter((comment) => comment.track_id === data.trackId)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 20),
    };
  });

export const recordSongView = createServerFn({ method: "POST" })
  .inputValidator(z.object({ trackId: z.string().min(1).max(180) }))
  .handler(async ({ data }) => {
    const trackId = safeDocId(data.trackId);
    const existing = await getFirestoreDoc<SongStats>(`sonexa_song_stats/${trackId}`).catch(
      () => null,
    );
    const viewCount = Number(existing?.view_count ?? 0) + 1;
    await setFirestoreDoc(`sonexa_song_stats/${trackId}`, {
      view_count: String(viewCount),
      like_count: String(existing?.like_count ?? 0),
      updated_at: nowIso(),
    });
    return { viewCount };
  });

export const toggleSongLike = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(z.object({ trackId: z.string().min(1).max(180) }))
  .handler(async ({ data, context }) => {
    const trackId = safeDocId(data.trackId);
    const likeId = safeDocId(`${data.trackId}_${context.userId}`);
    const existingLike = await getFirestoreDoc(
      `sonexa_song_likes/${likeId}`,
      context.firebaseToken,
    );
    const wasLiked = existingLike?.active !== false && !!existingLike;
    const stats = await getFirestoreDoc<SongStats>(
      `sonexa_song_stats/${trackId}`,
      context.firebaseToken,
    ).catch(() => null);
    const nextCount = Math.max(0, Number(stats?.like_count ?? 0) + (wasLiked ? -1 : 1));
    await setFirestoreDoc(
      `sonexa_song_likes/${likeId}`,
      {
        track_id: data.trackId,
        user_id: context.userId,
        active: !wasLiked,
        updated_at: nowIso(),
      },
      context.firebaseToken,
    );
    await setFirestoreDoc(
      `sonexa_song_stats/${trackId}`,
      {
        view_count: String(stats?.view_count ?? 0),
        like_count: String(nextCount),
        updated_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { liked: !wasLiked, likeCount: nextCount };
  });

export const addSongComment = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(
    z.object({
      trackId: z.string().min(1).max(180),
      body: z.string().min(1).max(500),
      userName: z.string().min(1).max(120).default("Listener"),
    }),
  )
  .handler(async ({ data, context }) => {
    const id = safeDocId(`${data.trackId}_${context.userId}_${Date.now()}`);
    await setFirestoreDoc(
      `sonexa_song_comments/${id}`,
      {
        track_id: data.trackId,
        user_id: context.userId,
        user_name: data.userName,
        body: data.body.trim(),
        created_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { ok: true };
  });

export const getIntroConfig = createServerFn({ method: "GET" }).handler(async () => {
  const config = await getFirestoreDoc<IntroConfig>("sonexa_settings/intro").catch(() => null);
  return {
    youtubeUrl: config?.youtube_url ?? "",
    title: config?.title ?? "Listen Beyond Limits",
  };
});

export const adminSetIntroConfig = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(
    z.object({
      youtubeUrl: z.string().url().or(z.literal("")),
      title: z.string().min(1).max(120).default("Listen Beyond Limits"),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await setFirestoreDoc(
      "sonexa_settings/intro",
      {
        youtube_url: data.youtubeUrl,
        title: data.title,
        updated_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { ok: true };
  });

export const getFeatureConfig = createServerFn({ method: "GET" }).handler(async () => {
  const config = await getFirestoreDoc<FeatureConfig>("sonexa_settings/features").catch(() => null);
  return { 
    itunesEnabled: config?.itunes_enabled === true, 
    radioEnabled: config?.radio_enabled === true,
    playerTransparency: config?.player_transparency ?? 0.9
  };
});

export const adminSetFeatureConfig = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(z.object({ itunesEnabled: z.boolean(), radioEnabled: z.boolean(), playerTransparency: z.number().optional() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await setFirestoreDoc(
      "sonexa_settings/features",
      {
        itunes_enabled: data.itunesEnabled,
        radio_enabled: data.radioEnabled,
        player_transparency: data.playerTransparency ?? 0.9,
        updated_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { ok: true };
  });

export const getHomeConfig = createServerFn({ method: "GET" }).handler(async () => {
  const config = await getFirestoreDoc<{ background_image_url?: string; overlay_opacity?: string; }>("sonexa_settings/home").catch(() => null);
  return { backgroundImageUrl: config?.background_image_url ?? "", overlayOpacity: config?.overlay_opacity ? parseFloat(config.overlay_opacity) : 0.2 };
});

export const adminSetHomeConfig = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(
    z.object({
      backgroundImageUrl: z.string().url().or(z.literal("")),
      overlayOpacity: z.number().min(0).max(1),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await setFirestoreDoc(
      "sonexa_settings/home",
      {
        background_image_url: data.backgroundImageUrl,
        overlay_opacity: String(data.overlayOpacity),
        updated_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { ok: true };
  });

export const adminBackupLocalLibrary = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(z.object({ playlists: z.any(), likes: z.any(), taste: z.any().optional(), languages: z.any().optional() }))
  .handler(async ({ data, context }) => {
    await setFirestoreDoc(`sonexa_user_backups/${context.userId}`, {
      playlists: JSON.stringify(data.playlists),
      likes: JSON.stringify(data.likes),
      taste: data.taste ? JSON.stringify(data.taste) : null,
      languages: data.languages ? JSON.stringify(data.languages) : null,
      updated_at: nowIso(),
    }, context.firebaseToken);
    return { ok: true };
  });

export const restoreLocalLibrary = createServerFn({ method: "GET" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .handler(async ({ context }) => {
    const backup = await getFirestoreDoc<LocalLibraryBackup>(
      `sonexa_user_backups/${context.userId}`,
      context.firebaseToken,
    ).catch(() => null);
    if (!backup) return { playlists: null, likes: null, taste: null, languages: null };
    return {
      playlists: backup.playlists ? JSON.parse(backup.playlists) : null,
      likes: backup.likes ? JSON.parse(backup.likes) : null,
      taste: backup.taste ? JSON.parse(backup.taste) : null,
      languages: backup.languages ? JSON.parse(backup.languages) : null,
    };
  });

export const createProfilePhotoUpload = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(
    z.object({
      fileName: z.string().min(1).max(180),
      contentType: z.string().startsWith("image/").max(80),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext =
      data.fileName
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "") || "jpg";
    const path = `profile-photos/${safeDocId(context.userId)}/${crypto.randomUUID()}.${ext}`;
    const upload = await supabaseAdmin.storage.from("covers").createSignedUploadUrl(path);
    if (upload.error) throw upload.error;
    return { path, token: upload.data.token };
  });

export const getProfilePhotoUrl = createServerFn({ method: "POST" })
  .middleware([attachFirebaseAuth, requireFirebaseAuth])
  .inputValidator(z.object({ path: z.string().min(1).max(500) }))
  .handler(async ({ data, context }) => {
    const prefix = `profile-photos/${safeDocId(context.userId)}/`;
    if (!data.path.startsWith(prefix)) throw new Error("Invalid profile photo path");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const signed = await supabaseAdmin.storage
      .from("covers")
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);
    if (signed.error) throw signed.error;
    return { url: signed.data.signedUrl };
  });
