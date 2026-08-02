import { Play, Pause, SkipBack, SkipForward, X, Volume2, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { usePlayerStore } from "@/lib/player-store";
import type { Track } from "@/lib/player-store";

/**
 * Persistent mini player that survives navigation
 * Works like Spotify's mini player - always visible, can be minimized/expanded
 */
export function PersistentMiniPlayer() {
  const { current, isPlaying, play, pause, next, prev } = usePlayerStore();
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!current) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 360, e.clientX - dragStart.x)),
      y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragStart.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  // Sync with main player audio
  useEffect(() => {
    const mainAudio = document.querySelector("audio[data-main-player]") as HTMLAudioElement;
    if (mainAudio) {
      audioRef.current = mainAudio;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-gradient-to-br from-card/95 to-background/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl transition-all duration-300"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? "360px" : "420px",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Now Playing
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            ) : (
              <Minimize2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
          <button
            onClick={() => {
              // Optionally close or hide the mini player
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition"
            title="Close"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 space-y-3 ${isMinimized ? "hidden" : "block"}`}>
        {/* Cover Art */}
        <div className="aspect-square rounded-lg overflow-hidden border border-border/50 bg-background/60">
          {current.cover ? (
            <img
              src={current.cover}
              alt={current.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Music2Icon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1">{current.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{current.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-1 bg-background/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gradient transition-all duration-100"
              style={{
                width: audioRef.current
                  ? `${(audioRef.current.currentTime / audioRef.current.duration) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
            <span>{formatTime(audioRef.current?.duration || 0)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => prev()}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title="Previous"
          >
            <SkipBack className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
          <button
            onClick={() => (isPlaying ? pause() : play())}
            className="p-3 rounded-full bg-brand-gradient text-background hover:scale-110 transition-transform"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current" />
            )}
          </button>
          <button
            onClick={() => next()}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title="Next"
          >
            <SkipForward className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* Minimized View */}
      {isMinimized && (
        <div className="p-3 flex items-center gap-3">
          {/* Mini Cover */}
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
            {current.cover ? (
              <img src={current.cover} alt={current.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Music2Icon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Title + Controls */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs line-clamp-1">{current.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{current.artist}</p>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={() => (isPlaying ? pause() : play())}
            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-primary fill-primary" />
            ) : (
              <Play className="h-4 w-4 text-primary fill-primary" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Music2Icon(props: any) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v9.28c-.47-.46-1.12-.75-1.84-.75-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5V7h4V3h-6z" />
    </svg>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
