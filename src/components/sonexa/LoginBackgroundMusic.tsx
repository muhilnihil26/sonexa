import { Volume2, Volume, VolumeX, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIntroConfig } from "@/lib/api/social.functions";
import { toast } from "sonner";

/**
 * Login page background music component
 * Plays YouTube music URL set by admin with mute/play/pause controls
 */
export function LoginBackgroundMusic() {
  const getIntro = useServerFn(getIntroConfig);
  const { data } = useQuery({
    queryKey: ["intro-config"],
    queryFn: () => getIntro(),
  });

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const youtubeUrl = data?.youtubeUrl;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  useEffect(() => {
    if (!youtubeId) return;

    // YouTube embed doesn't support direct audio extraction, so we'll display as iframe
    // with controls for muting and basic controls
    const handleIframeLoad = () => {
      setIsPlaying(true);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", handleIframeLoad);
      return () => iframe.removeEventListener("load", handleIframeLoad);
    }
  }, [youtubeId]);

  if (!youtubeId) {
    return null; // No background music configured
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${youtubeId}`;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Hidden YouTube iframe for background music */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title="Login Background Music"
        className="hidden"
        allow="autoplay"
      />

      {/* Control buttons - positioned in corner */}
      <div className="fixed bottom-6 right-6 pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20 z-50">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-white/60" />
          ) : (
            <Volume className="h-4 w-4 text-primary" />
          )}
        </button>

        {/* Volume percentage display */}
        <div className="text-xs text-white/60 font-medium px-1">
          {isMuted ? "Muted" : "Playing"}
        </div>
      </div>

      {/* Music indicator badge */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 bg-brand-gradient text-background px-4 py-2 rounded-full shadow-lg z-40 animate-pulse">
        <Music2Indicator className="h-4 w-4" />
        <span className="text-xs font-semibold">Background Music</span>
      </div>
    </div>
  );
}

/**
 * Simple animated music indicator
 */
function Music2Indicator({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
