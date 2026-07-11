import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  deleteFirestoreDoc,
  getFirestoreDoc,
  listFirestoreDocs,
  setFirestoreDoc,
} from "@/integrations/firebase/firestore-rest";

const id = z.object({ id: z.string().uuid() });

function createPublicSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}`);
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// PUBLIC reads via admin client (RLS bypass with safe projection)
export const listSongs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicSupabaseClient();
  const [{ data, error }, firebaseSongs] = await Promise.all([
    supabase
      .from("songs")
      .select(
        "id,title,cover_url,audio_url,genre,mood,tags,play_count,artist_id,album_id,artists(id,name,slug),albums(id,title)",
      )
      .order("created_at", { ascending: false })
      .limit(60),
    listFirestoreDocs("sonexa_songs").catch(() => []),
  ]);
  if (error) throw error;
  const mappedFirebaseSongs = firebaseSongs.map((song) => ({
    id: `firebase_${song.id}`,
    title: String(song.title ?? "Untitled"),
    cover_url: String(song.cover_url ?? ""),
    audio_url: String(song.audio_url ?? ""),
    genre: typeof song.genre === "string" ? song.genre : null,
    mood: typeof song.mood === "string" ? song.mood : null,
    tags: null,
    play_count: 0,
    artist_id: null,
    album_id: null,
    artists: { id: null, name: String(song.artist ?? "Unknown"), slug: null },
    albums: null,
  }));
  return { songs: [...mappedFirebaseSongs, ...(data ?? [])] };
});

export const getArtist = createServerFn({ method: "POST" })
  .inputValidator(id)
  .handler(async ({ data }) => {
    const supabase = createPublicSupabaseClient();
    const [artist, songs, albums] = await Promise.all([
      supabase.from("artists").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("songs")
        .select("id,title,cover_url,audio_url,play_count,artist_id,artists(name)")
        .eq("artist_id", data.id)
        .order("play_count", { ascending: false })
        .limit(50),
      supabase
        .from("albums")
        .select("id,title,cover_url,release_date")
        .eq("artist_id", data.id)
        .order("release_date", { ascending: false }),
    ]);
    if (artist.error) throw artist.error;
    return { artist: artist.data, songs: songs.data ?? [], albums: albums.data ?? [] };
  });

export const getAlbum = createServerFn({ method: "POST" })
  .inputValidator(id)
  .handler(async ({ data }) => {
    const supabase = createPublicSupabaseClient();
    const [album, songs] = await Promise.all([
      supabase.from("albums").select("*,artists(id,name,slug)").eq("id", data.id).maybeSingle(),
      supabase
        .from("songs")
        .select("id,title,cover_url,audio_url,duration_seconds,artist_id,artists(name)")
        .eq("album_id", data.id)
        .order("created_at"),
    ]);
    if (album.error) throw album.error;
    return { album: album.data, songs: songs.data ?? [] };
  });

export const getPlaylist = createServerFn({ method: "POST" })
  .inputValidator(id)
  .handler(async ({ data }) => {
    const supabase = createPublicSupabaseClient();
    const { data: pl, error } = await supabase
      .from("playlists")
      .select(
        "*,playlist_songs(position,songs(id,title,cover_url,audio_url,artist_id,artists(name)))",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return { playlist: pl };
  });

// AUTH'D writes
export const createPlaylist = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({ title: z.string().min(1).max(80), description: z.string().max(280).optional() }),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pl, error } = await supabaseAdmin
      .from("playlists")
      .insert({
        title: data.title,
        description: data.description ?? null,
        owner_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: pl.id };
  });

export const myPlaylists = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("playlists")
      .select("id,title,cover_url,description,updated_at")
      .eq("owner_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return { playlists: data ?? [] };
  });

export const myLikes = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("likes")
      .select("song_id,songs(id,title,cover_url,audio_url,artist_id,artists(name))")
      .eq("user_id", context.userId);
    if (error) throw error;
    return { likes: data ?? [] };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ songId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin
      .from("likes")
      .select("song_id")
      .eq("song_id", data.songId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing.data) {
      await supabaseAdmin
        .from("likes")
        .delete()
        .eq("song_id", data.songId)
        .eq("user_id", context.userId);
      return { liked: false };
    }
    await supabaseAdmin.from("likes").insert({ song_id: data.songId, user_id: context.userId });
    return { liked: true };
  });

// ============ Admin song management ============
async function assertAdmin(ctx: { userId: string; isAdmin?: boolean }) {
  if (!ctx.isAdmin) throw new Error("Admin only");
}

export const adminListSongs = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data, error }, firebaseSongs] = await Promise.all([
      supabaseAdmin
        .from("songs")
        .select("id,title,cover_url,audio_url,language,genre,artist_id,artists(name)")
        .order("created_at", { ascending: false })
        .limit(500),
      listFirestoreDocs("sonexa_songs", context.firebaseToken).catch(() => []),
    ]);
    if (error) throw error;
    const mappedFirebaseSongs = firebaseSongs.map((song) => ({
      id: `firebase_${song.id}`,
      title: String(song.title ?? "Untitled"),
      cover_url: String(song.cover_url ?? ""),
      audio_url: String(song.audio_url ?? ""),
      language: typeof song.language === "string" ? song.language : null,
      genre: typeof song.genre === "string" ? song.genre : null,
      artist_id: null,
      artists: { name: String(song.artist ?? "Unknown") },
    }));
    return { songs: [...mappedFirebaseSongs, ...(data ?? [])] };
  });

export const adminUpdateSong = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      songId: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      language: z.string().max(40).optional(),
      genre: z.string().max(40).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.songId.startsWith("firebase_")) {
      const docId = data.songId.replace(/^firebase_/, "");
      const existing = await getFirestoreDoc(`sonexa_songs/${docId}`, context.firebaseToken);
      if (!existing) throw new Error("Song not found");
      await setFirestoreDoc(
        `sonexa_songs/${docId}`,
        {
          ...existing,
          title: data.title,
          language: data.language,
          genre: data.genre,
          updated_at: new Date().toISOString(),
        },
        context.firebaseToken,
      );
      return { ok: true };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { title?: string; language?: string; genre?: string } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.language !== undefined) patch.language = data.language;
    if (data.genre !== undefined) patch.genre = data.genre;
    const { error } = await supabaseAdmin.from("songs").update(patch).eq("id", data.songId);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteSong = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ songId: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.songId.startsWith("firebase_")) {
      await deleteFirestoreDoc(
        `sonexa_songs/${data.songId.replace(/^firebase_/, "")}`,
        context.firebaseToken,
      );
      return { ok: true };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Best-effort cleanup of dependents
    await supabaseAdmin.from("likes").delete().eq("song_id", data.songId);
    await supabaseAdmin.from("playlist_songs").delete().eq("song_id", data.songId);
    await supabaseAdmin.from("listening_history").delete().eq("song_id", data.songId);
    const { error } = await supabaseAdmin.from("songs").delete().eq("id", data.songId);
    if (error) throw error;
    return { ok: true };
  });

export const adminCreateFirebaseSong = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      artist: z.string().min(1).max(200),
      audioUrl: z.string().url(),
      coverUrl: z.string().url(),
      language: z.string().max(40).default("Tamil"),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await setFirestoreDoc(
      `sonexa_songs/${id}`,
      {
        title: data.title,
        artist: data.artist,
        audio_url: data.audioUrl,
        cover_url: data.coverUrl,
        language: data.language,
        genre: null,
        mood: null,
        uploaded_by: context.userId,
        created_at: now,
        updated_at: now,
      },
      context.firebaseToken,
    );
    return { id: `firebase_${id}` };
  });

export const adminCreateUploadUrls = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({ audioName: z.string().min(1).max(200), coverName: z.string().min(1).max(200) }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const clean = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
    const audioPath = `${crypto.randomUUID()}-${clean(data.audioName)}`;
    const coverPath = `${crypto.randomUUID()}-${clean(data.coverName)}`;
    const [audio, cover] = await Promise.all([
      supabaseAdmin.storage.from("audio").createSignedUploadUrl(audioPath),
      supabaseAdmin.storage.from("covers").createSignedUploadUrl(coverPath),
    ]);
    if (audio.error) throw audio.error;
    if (cover.error) throw cover.error;
    return {
      audio: { path: audioPath, token: audio.data.token },
      cover: { path: coverPath, token: cover.data.token },
    };
  });

export const adminCreateSongFromUpload = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      artist: z.string().min(1).max(200),
      audioPath: z.string().min(1).max(500),
      coverPath: z.string().min(1).max(500),
      language: z.string().max(40).default("Tamil"),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [audioUrl, coverUrl] = await Promise.all([
      supabaseAdmin.storage.from("audio").createSignedUrl(data.audioPath, 60 * 60 * 24 * 365),
      supabaseAdmin.storage.from("covers").createSignedUrl(data.coverPath, 60 * 60 * 24 * 365),
    ]);
    if (audioUrl.error) throw audioUrl.error;
    if (coverUrl.error) throw coverUrl.error;

    let { data: artistRow } = await supabaseAdmin
      .from("artists")
      .select("id")
      .eq("name", data.artist)
      .maybeSingle();
    if (!artistRow) {
      const slug = data.artist.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const created = await supabaseAdmin
        .from("artists")
        .insert({ name: data.artist, slug })
        .select("id")
        .single();
      if (created.error) throw created.error;
      artistRow = created.data;
    }

    const song = await supabaseAdmin
      .from("songs")
      .insert({
        title: data.title,
        artist_id: artistRow.id,
        audio_url: audioUrl.data.signedUrl,
        cover_url: coverUrl.data.signedUrl,
        language: data.language,
      })
      .select("id")
      .single();
    if (song.error) throw song.error;
    return { id: song.data.id };
  });

// AI enrichment - admin-only, calls Lovable AI Gateway
export const enrichSong = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ songId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: song } = await supabaseAdmin
      .from("songs")
      .select("id,title,artists(name)")
      .eq("id", data.songId)
      .maybeSingle();
    if (!song) throw new Error("Song not found");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const artistName = (song as { artists?: { name?: string } | null }).artists?.name ?? "Unknown";
    const prompt = `You are a Tamil music metadata expert. Given the song "${song.title}" by "${artistName}", produce concise JSON with fields: genre (single word like Folk/Pop/Indie/Hiphop/Carnatic/Filmi/Devotional), mood (single word like Energetic/Romantic/Melancholy/Devotional/Uplifting), tags (array of 3-6 short lowercase keywords), description (1-2 sentences, English, evocative). Respond with raw JSON only.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { genre?: string; mood?: string; tags?: string[]; description?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      /* keep empty */
    }

    await supabaseAdmin
      .from("songs")
      .update({
        genre: parsed.genre ?? null,
        mood: parsed.mood ?? null,
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
        description: parsed.description ?? null,
      })
      .eq("id", song.id);

    return { ok: true, enriched: parsed };
  });

// ============ iTunes catalog seeder (admin-only) ============
// Pulls real Tamil song metadata + cover art + 30s preview MP3 from the
// public iTunes Search API. No API key required, fully legal.
const TAMIL_SEED_QUERIES = [
  "A.R. Rahman tamil",
  "Ilaiyaraaja tamil",
  "Anirudh Ravichander",
  "Yuvan Shankar Raja",
  "GV Prakash Kumar",
  "Santhosh Narayanan",
  "Harris Jayaraj",
  "Hiphop Tamizha",
  "Sid Sriram tamil",
  "Pradeep Kumar tamil",
  "Dhanush tamil",
  "Shankar Mahadevan tamil",
  "Spb tamil",
  "Chinmayi tamil",
  "Bombay Jayashri",
  "Master tamil",
  "Vikram tamil 2022",
  "Leo tamil",
  "Jailer tamil",
  "Ponniyin Selvan",
  "Vaathi tamil",
  "Maaveeran tamil",
  "Asuran tamil",
  "Karnan tamil",
  "Kaththi tamil",
  "Mersal tamil",
  "Bigil tamil",
  "96 tamil songs",
  "Vinnaithaandi Varuvaaya",
  "Kadhal Rojave",
  "Roja tamil",
];

type ITunesResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  primaryGenreName?: string;
};

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `id-${Date.now()}`
  );
}

export const seedFromITunes = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ extraQuery: z.string().max(100).optional() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const queries = data.extraQuery ? [...TAMIL_SEED_QUERIES, data.extraQuery] : TAMIL_SEED_QUERIES;

    let inserted = 0,
      skipped = 0,
      artistsCreated = 0,
      albumsCreated = 0;
    const seenTrackIds = new Set<string>();
    const seenArtists = new Set<string>();
    const seenAlbums = new Set<string>();

    for (const q of queries) {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=25&country=IN`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as { results: ITunesResult[] };
      for (const r of json.results ?? []) {
        if (!r.previewUrl || !r.trackName || !r.artistName) {
          skipped++;
          continue;
        }
        const extId = `itunes-${r.trackId}`;
        if (seenTrackIds.has(extId)) continue;
        seenTrackIds.add(extId);

        const exists = await getFirestoreDoc(`sonexa_songs/${extId}`, context.firebaseToken);
        if (exists) {
          skipped++;
          continue;
        }

        const artistSlug = slugify(r.artistName);
        if (!seenArtists.has(artistSlug)) {
          seenArtists.add(artistSlug);
          artistsCreated++;
        }

        const cover = r.artworkUrl100 ? r.artworkUrl100.replace("100x100bb", "600x600bb") : null;
        if (r.collectionName) {
          const albumKey = `${artistSlug}-${slugify(r.collectionName)}`;
          if (!seenAlbums.has(albumKey)) {
            seenAlbums.add(albumKey);
            albumsCreated++;
          }
        }

        const now = new Date().toISOString();
        await setFirestoreDoc(
          `sonexa_songs/${extId}`,
          {
            title: r.trackName,
            artist: r.artistName,
            album: r.collectionName ?? null,
            audio_url: r.previewUrl,
            cover_url: cover,
            duration_seconds: String(r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : 30),
            genre: r.primaryGenreName ?? "Filmi",
            language: "Tamil",
            release_date: r.releaseDate?.slice(0, 10) ?? null,
            source: "itunes",
            uploaded_by: context.userId,
            created_at: now,
            updated_at: now,
          },
          context.firebaseToken,
        );
        inserted++;
      }
    }

    return { inserted, skipped, artistsCreated, albumsCreated, queriesRun: queries.length };
  });
