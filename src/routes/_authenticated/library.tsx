import { createFileRoute, Link } from "@tanstack/react-router";
import { generateSmartPlaylists } from "@/lib/auto-playlists";
import { Download, Globe2, Heart, ListMusic, Plus, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocalLibrary } from "@/lib/local-library";
import { usePlayer, type Track } from "@/lib/player-store";
import { useSession } from "@/lib/auth";
import { readOfflineTracks, saveOfflinePlaylist } from "@/lib/offline-library";
import { useProfilePrefs } from "@/lib/profile-prefs";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listAdminYouTubeTracks } from "@/lib/api/youtube.functions";
import { isYtBroken } from "@/lib/player-store";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Your Library - Sonexa" }] }),
  component: Library,
});

function Library() {
  const { likes, playlists, createPlaylist, deletePlaylist } = useLocalLibrary();
  const { play } = usePlayer();
  const { user } = useSession();
  const { gridClass } = useProfilePrefs();
  const [title, setTitle] = useState("");
  const listYouTube = useServerFn(listAdminYouTubeTracks);

  const { data } = useQuery({
    queryKey: ["admin-youtube-tracks"],
    queryFn: () => listYouTube(),
    refetchOnWindowFocus: false,
  });

  function create() {
    if (!title.trim()) return;
    createPlaylist(title.trim());
    setTitle("");
    toast.success("Playlist created");
  }

  const likedTracks = Object.values(likes);
  const offlineTracks = readOfflineTracks(user?.email);

  // Map admin DB rows to standard Tracks
  const allTracks: Track[] = (data?.tracks ?? [])
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

  return (
    <div className="p-6 md:p-10 animate-page-in">
      <h1 className="text-3xl font-bold">Your Library</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Playlists and liked songs are saved on this device.
      </p>

      <div
        id="create-playlist"
        className="mt-8 flex scroll-mt-24 flex-col sm:flex-row gap-3 max-w-xl"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New playlist name"
          className="flex-1 px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 ring-primary"
        />
        <button
          onClick={create}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand-gradient text-background font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" /> Create
        </button>
      </div>

      <section id="liked-songs" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" /> Liked Songs
        </h2>
        <div className={gridClass}>
          {likedTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => play(track, likedTracks)}
              className="group text-left p-3 rounded-xl bg-card/40 hover:bg-card transition shadow-card hover:shadow-glow hover:-translate-y-1 duration-300"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-secondary relative">
                {track.cover && (
                  <img src={track.cover} alt={track.title} className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-background/80 backdrop-blur grid place-items-center opacity-0 group-hover:opacity-100 transition">
                  <Play className="h-4 w-4 fill-foreground ml-0.5" />
                </span>
              </div>
              <div className="text-sm font-semibold truncate">{track.title}</div>
              <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
            </button>
          ))}
          {likedTracks.length === 0 && (
            <p className="text-sm text-muted-foreground">No liked songs yet.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" /> Offline Backups
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Saved locally on this device for {user?.email ?? "this listener"}.
        </p>
        <div className={gridClass}>
          {offlineTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => play(track, offlineTracks)}
              className="group text-left p-3 rounded-xl bg-card/40 hover:bg-card transition shadow-card hover:shadow-glow hover:-translate-y-1 duration-300"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-secondary relative">
                {track.cover && (
                  <img src={track.cover} alt={track.title} className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-background/80 backdrop-blur grid place-items-center opacity-0 group-hover:opacity-100 transition">
                  <Play className="h-4 w-4 fill-foreground ml-0.5" />
                </span>
              </div>
              <div className="text-sm font-semibold truncate">{track.title}</div>
              <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
            </button>
          ))}
          {offlineTracks.length === 0 && (
            <p className="text-sm text-muted-foreground">Downloaded songs will appear here.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ListMusic className="h-5 w-5 text-primary" /> Playlists
        </h2>
        <div className={gridClass}>
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group p-3 rounded-xl bg-card/40 hover:bg-card transition shadow-card hover:shadow-glow hover:-translate-y-1 duration-300"
            >
              <button
                onClick={() => playlist.tracks[0] && play(playlist.tracks[0], playlist.tracks)}
                className="w-full text-left animate-fade-up"
              >
                <div className="aspect-square rounded-lg mb-3 bg-brand-gradient flex items-center justify-center relative overflow-hidden">
                  {playlist.tracks[0]?.cover ? (
                    <img
                      src={playlist.tracks[0].cover}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-70"
                    />
                  ) : null}
                  <ListMusic className="relative h-10 w-10 text-background/70" />
                </div>
                <div className="font-semibold text-sm truncate">{playlist.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{playlist.tracks.length} tracks</span>
                  <span className="inline-flex items-center gap-1">
                    <Globe2 className="h-3 w-3" />
                    Public
                  </span>
                </div>
              </button>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  to="/playlist/$id"
                  params={{ id: playlist.id }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ListMusic className="h-3 w-3" /> Details
                </Link>
                <button
                  onClick={() => {
                    const added = saveOfflinePlaylist(playlist.tracks, user?.email);
                    toast.success(
                      added
                        ? `Backed up ${added} playlist songs`
                        : "Playable playlist songs are already backed up",
                    );
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-3 w-3" /> Backup
                </button>
                <button
                  onClick={() => deletePlaylist(playlist.id)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
          {playlists.length === 0 && (
            <p className="text-sm text-muted-foreground">Create your first playlist above.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-primary" /> Auto-Generated Playlists
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Dynamic playlists generated automatically based on release years, genres, and popular hits.
        </p>
        <div className={gridClass}>
          {generateSmartPlaylists(allTracks).map((playlist) => (
            <div
              key={playlist.id}
              className="group p-3 rounded-xl bg-card/40 hover:bg-card transition shadow-card hover:shadow-glow hover:-translate-y-1 duration-300"
            >
              <Link
                to="/playlist/$id"
                params={{ id: playlist.id }}
                className="w-full text-left block"
              >
                <div className="aspect-square rounded-lg mb-3 bg-brand-gradient flex items-center justify-center relative overflow-hidden shadow-md">
                  {playlist.cover ? (
                    <img
                      src={playlist.cover}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:scale-105 transition duration-500"
                    />
                  ) : null}
                  <ListMusic className="relative h-10 w-10 text-background/70" />
                  <div className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-full bg-primary text-background grid place-items-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 shadow-glow z-10">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>
                <div className="font-semibold text-sm truncate">{playlist.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{playlist.tracks.length} tracks</div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
