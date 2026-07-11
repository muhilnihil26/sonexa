import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPlaylist } from "@/lib/api/catalog.functions";
import { listAdminYouTubePlaylists, listAdminYouTubeTracks } from "@/lib/api/youtube.functions";
import { usePlayer, type Track, isYtBroken } from "@/lib/player-store";
import { useLocalLibrary } from "@/lib/local-library";
import { generateSmartPlaylists } from "@/lib/auto-playlists";
import { ListMusic, ListPlus, Pause, Play, Users, FolderPlus, Share2, Lock, Globe, MoreVertical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/playlist/$id")({
  head: () => ({ meta: [{ title: "Playlist — Sonexa" }] }),
  component: PlaylistPage,
});

type PSRow = {
  position: number;
  songs: {
    id: string;
    title: string;
    cover_url: string | null;
    audio_url: string;
    artists: { name: string } | null;
  } | null;
};

function PlaylistPage() {
  const { id } = Route.useParams();
  const { playlists: localPlaylists } = useLocalLibrary();
  const { current, isPlaying, play, toggle, queue, addToQueue } = usePlayer();
  const fn = useServerFn(getPlaylist);
  const listYouTube = useServerFn(listAdminYouTubeTracks);
  const listPlaylists = useServerFn(listAdminYouTubePlaylists);

  const isSmart = id.startsWith("smart_");
  const isLocal = id.startsWith("pl_");

  const { data, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => fn({ data: { id } }),
    enabled: !isSmart && !isLocal,
  });

  const { data: dbTracksData, isLoading: isSmartLoading } = useQuery({
    queryKey: ["admin-youtube-tracks"],
    queryFn: () => listYouTube(),
    refetchOnWindowFocus: false,
  });

  const { data: ytPlaylistsData, isLoading: isYtPlaylistsLoading } = useQuery({
    queryKey: ["youtube-playlists"],
    queryFn: () => listPlaylists(),
    refetchOnWindowFocus: false,
  });

  // Calculate playlist variables for smart, local, or server playlists
  let title = "";
  let description = "";
  let tracks: Track[] = [];

  const isYtPlaylist = ytPlaylistsData?.playlists?.some((p) => p.playlist_id === id);

  if (isSmart) {
    if (isSmartLoading) return <div className="p-10 text-muted-foreground">Loading smart playlist…</div>;
    
    const allTracks: Track[] = (dbTracksData?.tracks ?? [])
      .map((track: any) => ({
        id: `yt_${track.video_id}`,
        title: track.title,
        artist: track.channel,
        cover: track.thumbnail,
        audio: track.backup_url ?? "",
        language: track.language ?? undefined,
        kind: (track.backup_url ? "audio" : "youtube") as "audio" | "youtube",
        ytId: track.video_id,
      }))
      .filter((track: Track) => track.kind === "audio" || (!!track.ytId && !isYtBroken(track.ytId)));

    const smartPlaylists = generateSmartPlaylists(allTracks);
    const found = smartPlaylists.find((p) => p.id === id);
    if (found) {
      title = found.name;
      description = found.description;
      tracks = found.tracks;
    }
  } else if (isLocal) {
    const found = localPlaylists.find((p) => p.id === id);
    if (found) {
      title = found.name;
      description = "Custom User Playlist · Saved locally & synced to cloud";
      tracks = found.tracks;
    }
  } else if (isYtPlaylist) {
    const pl = ytPlaylistsData?.playlists?.find((p) => p.playlist_id === id);
    if (pl) {
      title = pl.title;
      description = "YouTube Playlist · Imported by Admin";
      const trackIds = new Set((pl.track_ids ?? "").split(",").filter(Boolean));
      
      const allYtTracks: Track[] = (dbTracksData?.tracks ?? [])
        .map((track: any) => ({
          id: `yt_${track.video_id}`,
          title: track.title,
          artist: track.channel,
          cover: track.thumbnail,
          audio: track.backup_url ?? "",
          language: track.language ?? undefined,
          kind: (track.backup_url ? "audio" : "youtube") as "audio" | "youtube",
          ytId: track.video_id,
        }))
        .filter((track: Track) => track.kind === "audio" || (!!track.ytId && !isYtBroken(track.ytId)));

      tracks = allYtTracks.filter(t => trackIds.has(t.ytId ?? ""));
    }
  } else {
    if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
    if (!data?.playlist) return <div className="p-10">Playlist not found.</div>;

    title = data.playlist.title;
    description = data.playlist.description ?? "";
    const rows = ((data.playlist as { playlist_songs?: PSRow[] }).playlist_songs ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .filter((r) => r.songs);
    tracks = rows.map((r) => ({
      id: r.songs!.id,
      title: r.songs!.title,
      artist: r.songs!.artists?.name ?? "",
      cover: r.songs!.cover_url ?? "",
      audio: r.songs!.audio_url,
    }));
  }

  if (!title && !(isLoading || isYtPlaylistsLoading)) {
    return <div className="p-10">Playlist not found.</div>;
  }

  return (
    <div className="p-6 md:p-10 animate-page-in pb-36">
      <div className="flex flex-col items-start gap-6 rounded-3xl border border-border bg-card/35 p-5 sm:p-7 md:flex-row md:items-end">
        <div className="grid h-48 w-48 shrink-0 grid-cols-2 overflow-hidden rounded-2xl bg-brand-gradient shadow-glow md:h-60 md:w-60">
          {tracks.slice(0, 4).map((track) => (
            <img key={track.id} src={track.cover} alt="" className="h-full w-full object-cover" />
          ))}
          {tracks.length === 0 && (
            <div className="col-span-2 grid h-full place-items-center">
              <ListMusic className="h-20 w-20 text-background/70" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Playlist</p>
            {isLocal && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <Lock className="h-3 w-3" />
                Private
              </div>
            )}
            {!isLocal && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                Public
              </div>
            )}
          </div>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{tracks.length} songs</span>
            {isLocal && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Collaborative
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => tracks[0] && play(tracks[0], tracks)}
            disabled={!tracks.length}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient shadow-glow disabled:opacity-50 hover:scale-105 transition"
            title="Play playlist"
          >
            <Play className="h-6 w-6 fill-background text-background ml-1" />
          </button>
          <button
            className="h-12 w-12 rounded-full border border-border bg-card/40 hover:bg-card transition flex items-center justify-center"
            title="Share playlist"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            className="h-12 w-12 rounded-full border border-border bg-card/40 hover:bg-card transition flex items-center justify-center"
            title="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Collaborative Features */}
      {isLocal && (
        <section className="mt-6 p-4 rounded-xl bg-card/40 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">Collaborative Playlist</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition">
                <Users className="h-4 w-4" />
                Invite Collaborators
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/60 text-sm hover:bg-card transition">
                <FolderPlus className="h-4 w-4" />
                Move to Folder
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-brand-gradient border-2 border-background flex items-center justify-center text-xs font-bold text-background"
                >
                  {i}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">3 collaborators</span>
          </div>
        </section>
      )}

      <ol className="mt-8 overflow-hidden rounded-2xl border border-border bg-card/40">
        {tracks.map((t, i) => {
          const active = current?.id === t.id;
          const queued = queue.some((item) => item.id === t.id);
          return (
            <li
              key={t.id}
              className="group flex items-center gap-3 border-b border-border px-3 py-3 transition last:border-b-0 hover:bg-card sm:gap-4 sm:px-4"
            >
              <button
                onClick={() => (active ? toggle() : play(t, tracks))}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground group-hover:bg-background/60 group-hover:text-foreground"
              >
                {active && isPlaying ? <Pause className="h-4 w-4" /> : <span>{i + 1}</span>}
              </button>
              {t.cover && <img src={t.cover} alt="" className="h-11 w-11 rounded object-cover" />}
              <div className="flex-1 min-w-0">
                <div className={`truncate font-medium ${active ? "text-primary" : ""}`}>
                  {t.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">{t.artist}</div>
              </div>
              <button
                onClick={() => addToQueue(t)}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                  queued
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
                title={queued ? "Already in queue" : "Add to queue"}
              >
                <ListPlus className="h-4 w-4" />
              </button>
            </li>
          );
        })}
        {!tracks.length && (
          <li className="p-6 text-sm text-muted-foreground">This playlist is empty.</li>
        )}
      </ol>
    </div>
  );
}
