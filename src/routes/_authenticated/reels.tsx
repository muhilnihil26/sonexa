import { useState, useRef, useEffect } from "react";
import { Play, Pause, Music2, Flame, X, Heart, MessageCircle, Share2, ChevronLeft, Plus, Code } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAdminYouTubeTracks } from "@/lib/api/youtube.functions";
import { useSession } from "@/lib/auth";
import { usePlayer, type Track } from "@/lib/player-store";
import { useServerFn } from "@tanstack/react-start";
import { lookupYouTube, adminAddYouTubeTrack } from "@/lib/api/youtube.functions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocalLibrary } from "@/lib/local-library";

const SNIPPET_OFFSET = 40;
const SNIPPET_DURATION = 15;

export function MusicReels({ tracks }: { tracks: Track[] }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialReelIndex, setInitialReelIndex] = useState(0);
  const [inlinePlayingIndex, setInlinePlayingIndex] = useState<number | null>(null);
  const { user } = useSession();
  const lookupFn = useServerFn(lookupYouTube);
  const addFn = useServerFn(adminAddYouTubeTrack);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [addUrl, setAddUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const reelTracks = tracks
    .filter((t) => (t.kind === "youtube" ? !!t.ytId : !!t.audio))
    .slice(0, 30);

  const addCustomReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUrl.trim()) return;
    setBusy(true);
    try {
      const preview = await lookupFn({ data: { url: addUrl } });
      await addFn({ data: { url: preview.sourceUrl ?? addUrl, language: "tamil" } });
      toast.success("Added to Reels!");
      setAddUrl("");
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add URL");
    } finally {
      setBusy(false);
    }
  };

  if (reelTracks.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-2 sm:px-0">
        <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse" />
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Trending Reels</h2>
        <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange-500 uppercase tracking-wider">
          Watch
        </span>
      </div>

      {/* Add URL Form */}
      <form onSubmit={addCustomReel} className="flex gap-2 items-center px-2 sm:px-0">
        <input
          value={addUrl}
          onChange={(e) => setAddUrl(e.target.value)}
          placeholder="Paste YouTube URL to add to Reels"
          className="flex-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 px-4 py-2 text-sm text-white placeholder:text-white/60 focus:border-orange-500 outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center disabled:opacity-50"
        >
          {busy ? <X className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
        </button>
      </form>

      <div className="flex w-full gap-5 overflow-x-auto pb-4 pt-1 px-2 sm:px-0 no-scrollbar scroll-smooth">
        {reelTracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => {
              if (inlinePlayingIndex === index) {
                setInlinePlayingIndex(null);
              } else {
                setInlinePlayingIndex(index);
              }
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setInlinePlayingIndex(null);
              navigate({ to: "/reels", search: { videoId: track.ytId } });
            }}
            className="relative h-[280px] w-[160px] sm:h-[380px] sm:w-[220px] shrink-0 overflow-hidden rounded-2xl border border-border bg-zinc-900 shadow-xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] group"
          >
            {inlinePlayingIndex === index && track.kind === "youtube" ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${track.ytId}?autoplay=1&controls=0&modestbranding=1&playsinline=1&start=40&fs=0&rel=0&disablekb=1&mute=0`}
                allow="autoplay"
                className="absolute inset-0 h-[150%] w-[150%] object-cover pointer-events-none"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />
            ) : inlinePlayingIndex === index && track.kind === "audio" ? (
              <audio autoPlay src={track.audio} className="hidden" />
            ) : null}

            {inlinePlayingIndex !== index && (
              <img
                src={track.cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
            <div className="absolute inset-0 flex flex-col justify-end p-4 z-10 text-white">
              <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 drop-shadow-md">
                {track.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-white/70 mt-1 truncate drop-shadow-sm">
                {track.artist}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 w-fit">
                {inlinePlayingIndex === index ? <Play className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-white" />}
                {inlinePlayingIndex === index ? "Playing" : "Watch"}
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
  const [iframeKey, setIframeKey] = useState(0);
  const { isLiked, toggleLike } = useLocalLibrary();

  const handleShare = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/reels?videoId=${track.ytId}`;
    try {
      toast.loading("Preparing branded reel...", { id: "share-toast" });
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = track.cover;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      ctx.globalAlpha = 0.8;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.globalAlpha = 1.0;
      
      const gradient = ctx.createLinearGradient(0, canvas.height - 600, 0, canvas.height);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 90px system-ui, -apple-system, sans-serif";
      ctx.fillText("SONEXA", 80, canvas.height - 220);
      
      ctx.font = "50px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#dddddd";
      ctx.fillText("▶ " + (track.title.substring(0, 35) + (track.title.length > 35 ? "..." : "")), 80, canvas.height - 120);
      
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Failed to generate blob");
        const file = new File([blob], "sonexa_reel.png", { type: "image/png" });
        const shareData: ShareData = {
          title: track.title,
          text: "Check out this reel on Sonexa!",
          url: url,
        };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
        
        toast.dismiss("share-toast");
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
        }
      }, "image/png", 0.9);
      
    } catch (error) {
      toast.dismiss("share-toast");
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

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

  const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
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
          // Loop instead of stopping
          setIframeKey((k) => k + 1);
          if (audioRef.current) {
            audioRef.current.currentTime = SNIPPET_OFFSET;
            audioRef.current.play().catch(() => setIsPlaying(false));
          }
          return 0; // Restart progress
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

      <div 
        className="relative h-full w-full max-w-md sm:max-w-xl lg:max-w-2xl bg-black mx-auto cursor-pointer" 
        onClick={togglePlay}
        onTouchEnd={togglePlay}
      >
        {/* Media Player: YouTube Iframe or Audio Tag */}
        {isActive && isPlaying && track.kind === "youtube" ? (
          <div className="absolute inset-0 h-[100dvh] w-full flex items-center justify-center bg-black overflow-hidden pointer-events-none">
            <iframe
              key={iframeKey}
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
                  // Loop instead of stopping
                  audioRef.current.currentTime = SNIPPET_OFFSET;
                  setProgress(0);
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
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              toggleLike(track);
            }}
            className="flex flex-col items-center gap-1 hover:scale-110 transition group"
          >
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Heart className={`h-6 w-6 transition ${isLiked(track.id) ? "fill-primary text-primary" : "text-white group-hover:text-primary"}`} />
            </div>
            <span className="text-xs font-bold drop-shadow-md">Like</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toast.info("Comments opening...", { description: "Comments are disabled for this reel." }); }}
            className="flex flex-col items-center gap-1 hover:scale-110 transition group"
          >
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white group-hover:text-primary" />
            </div>
            <span className="text-xs font-bold drop-shadow-md">Comment</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex flex-col items-center gap-1 hover:scale-110 transition group"
          >
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white group-hover:text-primary" />
            </div>
            <span className="text-xs font-bold drop-shadow-md">Share</span>
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              const embedCode = `<iframe src="${window.location.origin}/reels?videoId=${track.ytId}&embed=true" width="360" height="640" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
              navigator.clipboard.writeText(embedCode);
              toast.success("Embed code copied to clipboard!");
            }}
            className="flex flex-col items-center gap-1 hover:scale-110 transition group"
          >
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Code className="h-6 w-6 text-white group-hover:text-primary" />
            </div>
            <span className="text-xs font-bold drop-shadow-md">Embed</span>
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

import { z } from "zod";

function adminToTrack(track: any): Track {
  return {
    id: `yt_${track.video_id || track.id}`,
    title: track.title || "Untitled",
    artist: track.channel || "Unknown",
    cover: track.thumbnail || "",
    audio: track.backup_url ?? "",
    language: track.language ?? undefined,
    kind: track.backup_url ? "audio" : "youtube",
    ytId: track.video_id || track.id,
  };
}

const reelsSearchSchema = z.object({
  videoId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/reels")({
  validateSearch: (search) => reelsSearchSchema.parse(search),
  component: ReelsPage,
});

function ReelsPage() {
  const listYouTube = useServerFn(listAdminYouTubeTracks);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-youtube-tracks"],
    queryFn: () => listYouTube(),
    refetchOnWindowFocus: false,
  });
  const { videoId } = Route.useSearch();
  const navigate = Route.useNavigate();

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Reels...</p>
        </div>
      </div>
    );
  }

  const tracks = (data?.tracks ?? []).map(adminToTrack);

  if (tracks.length === 0) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-muted-foreground mb-4">No reels found in the catalog.</p>
        <button onClick={() => navigate({ to: "/home" })} className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold">
          Go Home
        </button>
      </div>
    );
  }

  const initialIndex = videoId ? tracks.findIndex((t) => t.ytId === videoId) : 0;
  const startIndex = initialIndex >= 0 ? initialIndex : 0;

  return (
    <div className="h-[100dvh] w-full bg-black">
      <ReelsViewer
        tracks={tracks}
        initialIndex={startIndex}
        onClose={() => navigate({ to: "/home" })}
      />
    </div>
  );
}

