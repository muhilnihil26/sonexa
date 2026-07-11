/**
 * MiniPlayer — a compact, click-activated floating player that persists
 * across tab navigation and browser sessions. It appears when the user 
 * activates it and stays on screen even when navigating back to the app.
 * Uses localStorage to remember visibility state across page exits/returns.
 */
import { Play, Pause, SkipForward, X, ChevronUp, Heart, Music2, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePlayer } from "@/lib/player-store";
import { useLocalLibrary } from "@/lib/local-library";
import { toast } from "sonner";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MiniPlayer({ onExpand, onMinimize }: { onExpand: () => void; onMinimize?: () => void }) {
  const { current, isPlaying, toggle, next, progress, duration } = usePlayer();
  const { isLiked, toggleLike } = useLocalLibrary();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activated, setActivated] = useState(false);

  // Load visibility state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sonexa.miniPlayer.dismissed");
    const savedActivated = localStorage.getItem("sonexa.miniPlayer.activated");
    if (savedState === "true") {
      setDismissed(true);
    }
    if (savedActivated === "true") {
      setActivated(true);
    }
    setMounted(true);
  }, []);

  // Save visibility state to localStorage when it changes
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sonexa.miniPlayer.dismissed", String(dismissed));
  }, [dismissed, mounted]);

  // Save activation state to localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sonexa.miniPlayer.activated", String(activated));
  }, [activated, mounted]);

  // Auto-activate when music starts playing if not dismissed
  useEffect(() => {
    if (current && isPlaying && !dismissed && !activated) {
      setActivated(true);
    }
  }, [current, isPlaying, dismissed, activated]);

  if (!current || dismissed || !activated) return null;

  const pct = duration ? (progress / duration) * 100 : 0;
  const liked = isLiked(current.id);

  return (
    <div
      className="fixed bottom-20 right-3 z-50 w-72 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-2xl shadow-glow overflow-hidden animate-fade-up md:bottom-24 md:right-5"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Progress stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-border/50">
        <div
          className="h-full bg-brand-gradient transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="p-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Music2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Now Playing
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onExpand}
              className="p-1 rounded-lg hover:bg-background/60 transition text-muted-foreground hover:text-foreground"
              title="Expand player"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setActivated(false);
                onMinimize?.();
              }}
              className="p-1 rounded-lg hover:bg-background/60 transition text-muted-foreground hover:text-foreground"
              title="Minimize player"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg hover:bg-background/60 transition text-muted-foreground hover:text-foreground"
              title="Close mini player"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Track row */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={current.cover}
              alt={current.title}
              className={`h-12 w-12 rounded-xl object-cover shadow-md ${isPlaying ? "animate-cover-pulse" : ""}`}
            />
            {/* Sonexa watermark */}
            <div className="absolute bottom-1 right-1">
              <img src="/logo-icon.png" alt="Sonexa" className="h-3 w-3 rounded opacity-80" />
            </div>
            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 flex items-end gap-[2px] h-3.5 px-1 rounded-md bg-background/90 backdrop-blur shadow">
                <span className="eq-bar w-[2px] h-2.5 bg-primary rounded-full" />
                <span className="eq-bar w-[2px] h-2.5 bg-primary rounded-full" style={{ animationDelay: "0.2s" }} />
                <span className="eq-bar w-[2px] h-2.5 bg-primary rounded-full" style={{ animationDelay: "0.4s" }} />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-bold text-foreground">{current.title}</div>
            <div className="truncate text-xs text-muted-foreground">{current.artist}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => {
              toggleLike(current);
              toast.success(liked ? "Removed from Liked" : "Added to Liked Songs");
            }}
            className={`p-1.5 rounded-lg transition ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className={`h-10 w-10 rounded-full bg-white text-black flex items-center justify-center shadow-glow hover:scale-105 transition ${isPlaying ? "animate-play-pulse" : ""}`}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-black" />
              ) : (
                <Play className="h-4 w-4 fill-black ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="text-[10px] text-muted-foreground tabular-nums">
            {fmt(progress)} / {fmt(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
