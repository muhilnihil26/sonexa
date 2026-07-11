import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Maximize2, ListMusic, Plus, Heart, Minimize2, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { usePlayer } from "@/lib/player-store";
import { FullScreenPlayer } from "./FullScreenPlayer";
import { LyricsTicker } from "./LyricsTicker";
import { recordSongView } from "@/lib/api/social.functions";
import { MusicClock } from "./MusicClock";
import { useSession } from "@/lib/auth";
import { recordListeningTaste } from "@/lib/listening-taste";
import { useLocalLibrary } from "@/lib/local-library";
import { MiniPlayer } from "./MiniPlayer";
import { notifyDataSavingMode, requestNotificationPermission } from "@/lib/notifications";
import { toast } from "sonner";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlayerBar({ onMiniPlayer }: { onMiniPlayer?: () => void }) {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    progress,
    duration,
    seek,
    volume,
    setVolume,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
    queue,
    addToQueue,
    pairedTvCode,
  } = usePlayer();
  const { user } = useSession();
  const qc = useQueryClient();
  const { isLiked, toggleLike } = useLocalLibrary();
  const recordView = useServerFn(recordSongView);
  const [full, setFull] = useState(false);
  const [mini, setMini] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [dataSavingMode, setDataSavingMode] = useState(false);
  const [lastCounted, setLastCounted] = useState("");
  const [lastTasteCounted, setLastTasteCounted] = useState("");

  // Load data saving mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sonexa.dataSavingMode");
    if (saved === "true") {
      setDataSavingMode(true);
    }
    // Request notification permission on mount
    requestNotificationPermission();
  }, []);

  // Save data saving mode to localStorage
  useEffect(() => {
    localStorage.setItem("sonexa.dataSavingMode", String(dataSavingMode));
  }, [dataSavingMode]);

  // Notify when data saving mode changes
  useEffect(() => {
    // Only notify on user interaction, not on initial load
    const hasInteracted = localStorage.getItem("sonexa.hasInteracted");
    if (hasInteracted === "true") {
      notifyDataSavingMode(dataSavingMode);
    }
  }, [dataSavingMode]);

  // Mark user interaction
  useEffect(() => {
    const handleInteraction = () => {
      localStorage.setItem("sonexa.hasInteracted", "true");
    };
    document.addEventListener("click", handleInteraction, { once: true });
    return () => document.removeEventListener("click", handleInteraction);
  }, []);

  const isTvPlatform = typeof window !== "undefined" && 
    (document.querySelector(".platform-tv") !== null || 
     /\b(tv|smart-tv|smarttv|googletv|appletv|hbbtv|netcast|tizen|webos)\b/.test(navigator.userAgent.toLowerCase()));

  useEffect(() => {
    if (isTvPlatform && current && isPlaying) {
      setFull(true);
    }
  }, [current?.id, isPlaying, isTvPlatform]);

  useEffect(() => {
    if (!current || !isPlaying || lastCounted === current.id) return;
    const timer = window.setTimeout(() => {
      setLastCounted(current.id);
      recordView({ data: { trackId: current.id } })
        .then(() => qc.invalidateQueries({ queryKey: ["song-social", current.id] }))
        .catch(() => undefined);
    }, 8_000);
    return () => window.clearTimeout(timer);
  }, [current, isPlaying, lastCounted, qc, recordView]);
  useEffect(() => {
    if (!current || !isPlaying || lastTasteCounted === current.id) return;
    const timer = window.setTimeout(() => {
      recordListeningTaste(current, user?.email ?? user?.id);
      setLastTasteCounted(current.id);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [current, isPlaying, lastTasteCounted, user?.email, user?.id]);
  if (!current) return null;
  const pct = duration ? (progress / duration) * 100 : 0;
  const queued = queue.some((track) => track.id === current.id);
  const liked = isLiked(current.id);

  // Mini player mode
  if (mini) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 w-64 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-glow overflow-hidden animate-fade-up"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            <img
              src={current.cover}
              alt={current.title}
              className={`h-12 w-12 rounded-lg object-cover ${isPlaying ? "animate-cover-pulse" : ""}`}
            />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{current.title}</div>
              <div className="truncate text-xs text-muted-foreground">{current.artist}</div>
            </div>
            <button
              onClick={() => setMini(false)}
              className="p-1.5 rounded-lg hover:bg-background/80 transition"
              title="Expand"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <button onClick={prev} className="text-muted-foreground hover:text-foreground transition">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={toggle}
              className={`h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shadow-glow ${isPlaying ? "animate-play-pulse" : ""}`}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black ml-0.5" />}
            </button>
            <button onClick={next} className="text-muted-foreground hover:text-foreground transition">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3">
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full bg-brand-gradient transition-all duration-200 ${isPlaying ? "animate-progress-shine" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>{fmt(progress)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating, sticky mini-player. Bottom on mobile (above safe area), bottom-centered pill on desktop. */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-40 animate-fade-up
                 bottom-20 md:bottom-5
                 w-[calc(100%-1.25rem)] md:w-[min(880px,calc(100%-2rem))]
                 rounded-2xl border border-border/50
                 bg-card/90 backdrop-blur-2xl
                 shadow-glow
                 ring-1 ring-white/10
                 overflow-hidden ${isPlaying ? "animate-player-breathe" : ""}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* progress bar across the top edge */}
        <div className="absolute left-0 right-0 top-0 h-0.5 bg-border">
          <div
            className={`h-full bg-brand-gradient transition-[width] duration-200 ${isPlaying ? "animate-progress-shine" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-3">
          <button
            onClick={() => setFull(true)}
            className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:w-56 text-left hover:bg-background/40 rounded-xl p-1 -m-1 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0">
              <img
                src={current.cover}
                alt={current.title}
                className={`h-full w-full rounded-xl object-cover shadow-card ${isPlaying ? "animate-cover-pulse animate-spin-slow" : ""}`}
                style={{ animationDuration: "12s" }}
              />
              {isPlaying && (
                <span className="absolute -bottom-1 -right-1 flex items-end gap-[2px] h-4 px-1 rounded-lg bg-background/90 backdrop-blur-md shadow-lg">
                  <span className="eq-bar w-[2px] h-3 bg-primary rounded-full" />
                  <span
                    className="eq-bar w-[2px] h-3 bg-primary rounded-full"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="eq-bar w-[2px] h-3 bg-primary rounded-full"
                    style={{ animationDelay: "0.4s" }}
                  />
                </span>
              )}
            </div>
            <div className="min-w-0">
               <div className="max-w-36 overflow-hidden font-semibold text-sm sm:max-w-40">
                 <span className={current.title.length > 18 ? "song-title-marquee" : ""}>
                   <span>{current.title}</span>
                   {current.title.length > 18 && <span aria-hidden="true">{current.title}</span>}
                 </span>
               </div>
               <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                 <span>{current.artist}</span>
                 {pairedTvCode && pairedTvCode.length === 6 && (
                   <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                     TV
                   </span>
                 )}
               </div>
             </div>
          </button>

          <div className="flex-1 hidden sm:flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={toggleShuffle}
                className={`transition-all duration-200 hover:scale-110 ${shuffle ? "text-primary" : "text-white/70 hover:text-white"}`}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                onClick={prev}
                className="text-white/70 hover:text-white transition-all duration-200 hover:scale-110 hover:text-white"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={toggle}
                className={`h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-glow ${isPlaying ? "animate-play-pulse" : ""}`}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-black text-black" />
                ) : (
                  <Play className="h-4 w-4 fill-black text-black ml-0.5" />
                )}
              </button>
              <button
                onClick={next}
                className="text-white/70 hover:text-white transition-all duration-200 hover:scale-110 hover:text-white"
              >
                <SkipForward className="h-5 w-5" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`transition hover:scale-110 ${repeat ? "text-primary" : "text-white/70 hover:text-white"}`}
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>
            <LyricsTicker />
            <div className="w-full flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="tabular-nums w-8 text-right">{fmt(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                className="flex-1 accent-[var(--color-primary)] h-1"
              />
              <span className="tabular-nums w-8">{fmt(duration)}</span>
            </div>
          </div>

          {/* mobile compact controls */}
          <div className="flex sm:hidden items-center gap-1">
            <button onClick={prev} className="text-white/70 p-2 hover:text-white">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={toggle}
              className={`h-10 w-10 rounded-full bg-white text-black flex items-center justify-center shadow-glow hover:scale-110 transition ${isPlaying ? "animate-play-pulse" : ""}`}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-black text-black" />
              ) : (
                <Play className="h-4 w-4 fill-black text-black ml-0.5" />
              )}
            </button>
            <button onClick={next} className="text-white/70 p-2 hover:text-white">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <MusicClock compact />
            <button
              onClick={() => {
                toggleLike(current);
                toast.success(liked ? "Removed from Liked" : "Added to Liked");
              }}
              className={`transition hover:text-foreground ${
                liked ? "text-primary" : "text-muted-foreground"
              }`}
              title={liked ? "Unlike" : "Like"}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => setFull(true)}
              className="text-muted-foreground hover:text-foreground transition"
              title="Queue"
            >
              <ListMusic className="h-4 w-4" />
            </button>
            <button
              onClick={() => addToQueue(current)}
              disabled={queued}
              className="text-muted-foreground transition hover:text-foreground disabled:opacity-45"
              title={queued ? "Already in queue" : "Add current song to queue"}
            >
              <Plus className="h-4 w-4" />
            </button>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={3}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 accent-[var(--color-primary)] h-1"
            />
            <span className="w-9 text-[10px] text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
            <button
              onClick={() => {
                setMini(true);
                setShowMiniPlayer(true);
                onMiniPlayer?.();
              }}
              className="text-muted-foreground hover:text-foreground transition"
              title="Mini player"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDataSavingMode(!dataSavingMode)}
              className={`transition ${dataSavingMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Data saving mode"
            >
              <Wifi className="h-4 w-4" />
            </button>
            {dataSavingMode && (
              <span className="text-[9px] text-primary font-semibold uppercase tracking-wider">Data Saver</span>
            )}
            <button
              onClick={() => setFull(true)}
              className="text-muted-foreground hover:text-foreground transition"
              title="Full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center lg:hidden">
            <button
              onClick={() => {
                toggleLike(current);
                toast.success(liked ? "Removed from Liked" : "Added to Liked");
              }}
              className={`p-2 ${liked ? "text-primary" : "text-muted-foreground"}`}
              title={liked ? "Unlike" : "Like"}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => {
                setMini(true);
                setShowMiniPlayer(true);
                onMiniPlayer?.();
              }}
              className="p-2 text-muted-foreground hover:text-foreground"
              title="Mini player"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDataSavingMode(!dataSavingMode)}
              className={`p-2 ${dataSavingMode ? "text-primary" : "text-muted-foreground"}`}
              title="Data saving mode"
            >
              <Wifi className="h-4 w-4" />
            </button>
            <button
              onClick={() => setFull(true)}
              className="p-2 text-muted-foreground hover:text-foreground"
              title="Open player"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <FullScreenPlayer open={full} onClose={() => setFull(false)} />
      <MiniPlayer 
        onExpand={() => setFull(true)} 
        onMinimize={() => setShowMiniPlayer(false)}
      />
    </>
  );
}
