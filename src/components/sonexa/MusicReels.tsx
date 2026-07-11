import { useState, useRef, useEffect } from "react";
import { Play, Pause, Music2, Flame, X, Heart, MessageCircle, Share2, ChevronLeft } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

const SNIPPET_OFFSET = 40;
const SNIPPET_DURATION = 15;

export function MusicReels({ tracks }: { tracks: Track[] }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialReelIndex, setInitialReelIndex] = useState(0);

  const reelTracks = tracks
    .filter((t) => (t.kind === "youtube" ? !!t.ytId : !!t.audio))
    .slice(0, 15);

  if (reelTracks.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2 sm:px-0">
        <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse" />
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Trending Reels</h2>
        <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange-500 uppercase tracking-wider">
          Watch
        </span>
      </div>

      <div className="flex w-full gap-5 overflow-x-auto pb-4 pt-1 px-2 sm:px-0 no-scrollbar scroll-smooth">
        {reelTracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => {
              setInitialReelIndex(index);
              setViewerOpen(true);
            }}
            className="relative h-[280px] w-[160px] sm:h-[380px] sm:w-[220px] shrink-0 overflow-hidden rounded-2xl border border-border bg-zinc-900 shadow-xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] group"
          >
            <img
              src={track.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
            <div className="absolute inset-0 flex flex-col justify-end p-4 z-10 text-white">
              <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 drop-shadow-md">
                {track.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-white/70 mt-1 truncate drop-shadow-sm">
                {track.artist}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 w-fit">
                <Play className="h-3 w-3 fill-white" /> Watch
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewerOpen && (
        <ReelsViewer
          tracks={reelTracks}
          initialIndex={initialReelIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

// Fullscreen vertical scrolling Reels Viewer
function ReelsViewer({
  tracks,
  initialIndex,
  onClose,
}: {
  tracks: Track[];
  initialIndex: number;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const { play: playFull, isPlaying: globalPlaying, toggle: toggleGlobal } = usePlayer();

  // Pause background music when reels viewer opens
  useEffect(() => {
    if (globalPlaying) {
      toggleGlobal();
    }
  }, [globalPlaying, toggleGlobal]);

  useEffect(() => {
    // Scroll to initial index instantly
    if (containerRef.current) {
      const height = window.innerHeight;
      containerRef.current.scrollTop = initialIndex * height;
    }
  }, [initialIndex]);

  // Handle scroll snapping detection
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    const height = window.innerHeight;
    const newIndex = Math.round(top / height);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tracks.length) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col sm:flex-row animate-in fade-in zoom-in-95 duration-200">
      {/* Back Button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-4 z-50 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Vertical Snap Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 h-[100dvh] overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {tracks.map((track, i) => (
          <ReelItem
            key={track.id}
            track={track}
            isActive={i === activeIndex}
            onPlayFull={() => {
              playFull(track, tracks);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ReelItem({
  track,
  isActive,
  onPlayFull,
}: {
  track: Track;
  isActive: boolean;
  onPlayFull: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play/pause logic when snapped into view
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      setProgress(0);
      if (audioRef.current) {
        audioRef.current.currentTime = SNIPPET_OFFSET;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      setIsPlaying(false);
      setProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isActive]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      setIsPlaying(true);
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }
  };

  // Simulate progress bar for YT IFrames or sync with audio element
  useEffect(() => {
    if (!isActive || !isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + (100 / (SNIPPET_DURATION * 10)); // 100ms interval
        if (next >= 100) {
          setIsPlaying(false);
          audioRef.current?.pause();
          return 100;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isActive, isPlaying]);

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black flex justify-center">
      {/* Background blur */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110"
        style={{ backgroundImage: `url(${track.cover})` }}
      />

      <div className="relative h-full w-full max-w-md bg-black" onClick={togglePlay}>
        {/* Media Player: YouTube Iframe or Audio Tag */}
        {isActive && isPlaying && track.kind === "youtube" ? (
          <div className="absolute inset-0 h-[100dvh] w-full flex items-center justify-center bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${track.ytId}?autoplay=1&controls=0&modestbranding=1&playsinline=1&start=${SNIPPET_OFFSET}&fs=0&rel=0&disablekb=1&mute=0`}
              allow="autoplay"
              className="absolute h-[150vh] w-[150vw] sm:h-[130vh] sm:w-[130vw] pointer-events-none object-cover"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />
          </div>
        ) : null}

        {/* Cover Art Image (Fallback if not playing video) */}
        {!(isActive && isPlaying && track.kind === "youtube") && (
          <img
            src={track.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        )}

        {/* Top Gradient for header visibility */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />

        {!track.kind || track.kind === "audio" ? (
          <audio
            ref={audioRef}
            src={track.audio}
            preload="none"
            onTimeUpdate={() => {
              if (audioRef.current) {
                const elapsed = audioRef.current.currentTime - SNIPPET_OFFSET;
                if (elapsed >= SNIPPET_DURATION) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                  setProgress(100);
                }
              }
            }}
          />
        ) : null}

        {/* Play/Pause Overlay Icon */}
        {!isPlaying && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
            <div className="h-20 w-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Play className="h-10 w-10 fill-white ml-2" />
            </div>
          </div>
        )}

        {/* Right Side Actions Panel */}
        <div className="absolute right-4 bottom-32 z-30 flex flex-col items-center gap-6">
          <button className="flex flex-col items-center gap-1 hover:scale-110 transition">
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold drop-shadow-md">Like</span>
          </button>
          <button className="flex flex-col items-center gap-1 hover:scale-110 transition">
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold drop-shadow-md">Comment</span>
          </button>
          <button className="flex flex-col items-center gap-1 hover:scale-110 transition">
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold drop-shadow-md">Share</span>
          </button>
        </div>

        {/* Bottom Track Info Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24 z-20">
          <div className="flex items-end justify-between">
            <div className="flex-1 pr-16" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-3">
                <Music2 className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded-full">
                  Trending Audio
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 drop-shadow-lg">{track.title}</h3>
              <p className="text-sm sm:text-base text-white/80 drop-shadow-md mb-4">{track.artist}</p>
              
              <button
                onClick={onPlayFull}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full transition-transform hover:scale-105 shadow-glow"
              >
                <Play className="h-4 w-4 fill-white" />
                Play Full Song
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-30">
          <div
            className="h-full bg-orange-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
