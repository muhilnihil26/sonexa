import { Play, Pause, Heart, Plus, Check, Download, Share2, ListPlus } from "lucide-react";
import { useState } from "react";
import { usePlayer, type Track } from "@/lib/player-store";
import { useLocalLibrary } from "@/lib/local-library";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { saveOfflineTrack } from "@/lib/offline-library";

export function SongCard({
  track,
  queue,
  playAsQueue = false,
}: {
  track: Track;
  queue?: Track[];
  playAsQueue?: boolean;
}) {
  const { current, isPlaying, play, toggle, queue: playQueue, addToQueue } = usePlayer();
  const { isLiked, toggleLike, playlists, createPlaylist, addToPlaylist } = useLocalLibrary();
  const { user } = useSession();
  const [menu, setMenu] = useState(false);
  const active = current?.id === track.id;
  const liked = isLiked(track.id);
  const canDownload = track.kind !== "youtube" && !!track.audio;
  const queued = playQueue.some((item) => item.id === track.id);

  function downloadTrack(e: React.MouseEvent) {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = track.audio;
    a.download = `${track.artist ? `${track.artist} - ` : ""}${track.title}`.replace(
      /[\\/:*?"<>|]+/g,
      "-",
    );
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    saveOfflineTrack(track, user?.email);
    toast.success("Download started");
  }

  async function shareTrack(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/song/${encodeURIComponent(track.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: track.title,
          text: `${track.title} - ${track.artist}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Song link copied");
      }
    } catch {
      /* user cancelled native share */
    }
  }

  return (
    <div className="group relative p-3 rounded-xl bg-card/40 hover:bg-card transition-all shadow-card hover:shadow-glow hover:-translate-y-1 duration-300">
      <button
        onClick={() =>
          active ? toggle() : play(track, playAsQueue ? (queue ?? [track]) : [track])
        }
        className="block w-full text-left"
      >
        <div className="relative aspect-square overflow-hidden rounded-lg mb-3 bg-secondary">
          <img
            src={track.cover}
            alt={track.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 animate-img-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition" />
          <div
            className={`absolute bottom-2 right-2 h-11 w-11 rounded-full bg-brand-gradient shadow-glow flex items-center justify-center transition-all duration-300 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"}`}
          >
            {active && isPlaying ? (
              <Pause className="h-5 w-5 fill-background text-background" />
            ) : (
              <Play className="h-5 w-5 fill-background text-background ml-0.5" />
            )}
          </div>
          {active && isPlaying && (
            <span className="absolute top-2 left-2 flex items-end gap-[2px] h-4 px-1.5 rounded bg-background/80 backdrop-blur">
              <span className="eq-bar w-[2px] h-3 bg-primary" />
              <span className="eq-bar w-[2px] h-3 bg-primary" style={{ animationDelay: "0.2s" }} />
              <span className="eq-bar w-[2px] h-3 bg-accent" style={{ animationDelay: "0.4s" }} />
            </span>
          )}
        </div>
        <div className="truncate font-semibold text-sm">{track.title}</div>
        <div className="truncate text-xs text-muted-foreground mt-0.5">{track.artist}</div>
      </button>

      {/* Like + Add-to-playlist quick actions */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(track);
            toast.success(queued ? "Already in queue" : "Added to queue");
          }}
          className={`h-8 w-8 rounded-full grid place-items-center backdrop-blur-md transition ${
            queued
              ? "bg-primary/90 text-background"
              : "bg-background/70 hover:bg-background text-foreground/80"
          }`}
          title={queued ? "Already in queue" : "Add to queue"}
        >
          <ListPlus className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
            toast.success(liked ? "Removed from Liked" : "Added to Liked");
          }}
          className={`h-8 w-8 rounded-full grid place-items-center backdrop-blur-md transition ${liked ? "bg-primary text-background" : "bg-background/70 hover:bg-background text-foreground/80"}`}
          title={liked ? "Unlike" : "Like"}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-background" : ""}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenu((m) => !m);
          }}
          className="h-8 w-8 rounded-full grid place-items-center bg-background/70 hover:bg-background backdrop-blur-md text-foreground/80"
          title="Add to playlist"
        >
          <Plus className="h-4 w-4" />
        </button>
        {canDownload && (
          <button
            onClick={downloadTrack}
            className="h-8 w-8 rounded-full grid place-items-center bg-background/70 hover:bg-background backdrop-blur-md text-foreground/80"
            title="Download for offline backup"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={shareTrack}
          className="h-8 w-8 rounded-full grid place-items-center bg-background/70 hover:bg-background backdrop-blur-md text-foreground/80"
          title="Share song link"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
      {liked && (
        <span className="absolute top-4 left-4 h-7 w-7 rounded-full bg-primary text-background grid place-items-center shadow-glow">
          <Heart className="h-3.5 w-3.5 fill-background" />
        </span>
      )}

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
          <div className="absolute z-50 top-12 right-4 w-56 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-glow p-2 animate-fade-up">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Add to playlist
            </div>
            <button
              onClick={() => {
                const name = prompt("New playlist name");
                if (!name) return;
                const pl = createPlaylist(name);
                addToPlaylist(pl.id, track);
                setMenu(false);
                toast.success(`Added to "${pl.name}"`);
              }}
              className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-background/60"
            >
              <Plus className="h-4 w-4" /> New playlist…
            </button>
            {playlists.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground">No playlists yet.</div>
            )}
            {playlists.map((pl) => {
              const inIt = pl.tracks.some((t) => t.id === track.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => {
                    addToPlaylist(pl.id, track);
                    setMenu(false);
                    toast.success(`Added to "${pl.name}"`);
                  }}
                  className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-background/60"
                >
                  {inIt ? <Check className="h-4 w-4 text-primary" /> : <span className="h-4 w-4" />}
                  <span className="truncate">{pl.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {pl.tracks.length}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
