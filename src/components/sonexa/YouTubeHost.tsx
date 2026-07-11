import { useEffect, useRef } from "react";
import { setYTBridge, emitYTEvent, usePlayer } from "@/lib/player-store";

// Loads the YouTube IFrame API once and exposes an off-screen player
// the global player store can drive (load / play / pause / seek / volume).
// The iframe is positioned off-screen so only audio is perceptible.

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
    __ytReadyPromise?: Promise<void>;
  }
}

type YouTubePlayer = {
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      height: string;
      width: string;
      videoId: string;
      host: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onError: (event: { data: number }) => void;
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
};

function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__ytReadyPromise) return window.__ytReadyPromise;
  window.__ytReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return window.__ytReadyPromise;
}

// Seed video so the YT.Player constructs immediately. Some browsers refuse to
// initialize without a real videoId and never fire onReady.
const SEED_VIDEO_ID = "Way2GholgkU";

export function YouTubeHost() {
  const { current, ytVideoVisible } = usePlayer();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const readyRef = useRef(false);
  const pendingLoadRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadYTApi().then(() => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new window.YT!.Player(mountRef.current, {
        height: "180",
        width: "320",
        videoId: SEED_VIDEO_ID,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            try {
              playerRef.current?.stopVideo();
            } catch {
              /* */
            }
            // If a load was requested before the player was ready, run it now.
            if (pendingLoadRef.current) {
              const id = pendingLoadRef.current;
              pendingLoadRef.current = null;
              try {
                playerRef.current?.loadVideoById(id);
              } catch {
                /* */
              }
            }
            setYTBridge({
              load: (id) => {
                if (!readyRef.current) {
                  pendingLoadRef.current = id;
                  return;
                }
                try {
                  playerRef.current?.loadVideoById(id);
                  playerRef.current?.playVideo();
                } catch {
                  /* */
                }
              },
              play: () => {
                try {
                  playerRef.current?.playVideo();
                } catch {
                  /* */
                }
              },
              pause: () => {
                try {
                  playerRef.current?.pauseVideo();
                } catch {
                  /* */
                }
              },
              seek: (s) => {
                try {
                  playerRef.current?.seekTo(s, true);
                } catch {
                  /* */
                }
              },
              setVolume: (v) => {
                try {
                  playerRef.current?.setVolume(Math.round(v * 100));
                } catch {
                  /* */
                }
              },
              destroy: () => {
                try {
                  playerRef.current?.destroy();
                } catch {
                  /* */
                }
              },
              getCurrentTime: () => {
                try {
                  return playerRef.current?.getCurrentTime?.() ?? 0;
                } catch {
                  return 0;
                }
              },
              getDuration: () => {
                try {
                  return playerRef.current?.getDuration?.() ?? 0;
                } catch {
                  return 0;
                }
              },
            });
            intervalRef.current = window.setInterval(() => {
              try {
                const t = playerRef.current?.getCurrentTime?.() ?? 0;
                const d = playerRef.current?.getDuration?.() ?? 0;
                if (d > 0) emitYTEvent({ kind: "time", time: t, duration: d });
              } catch {
                /* */
              }
            }, 500);
          },
          onError: (e: { data: number }) => {
            // 2: invalid id, 5: HTML5 player error, 100: removed, 101/150: embed disabled
            console.warn("[YT] error", e?.data);
            emitYTEvent({ kind: "error" });
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 0) emitYTEvent({ kind: "ended" });
            else if (e.data === 1) emitYTEvent({ kind: "play" });
            else if (e.data === 2) emitYTEvent({ kind: "pause" });
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setYTBridge(null);
      try {
        playerRef.current?.destroy();
      } catch {
        /* */
      }
    };
  }, []);

  const visible = current?.kind === "youtube" && ytVideoVisible;

  // Keep the iframe mounted at all times. A display:none iframe can pause
  // YouTube playback, so background mode makes it tiny and transparent.
  return (
    <div
      aria-hidden={!visible}
      className={
        visible
          ? "fixed inset-0 z-[60] overflow-hidden bg-black opacity-100 transition pointer-events-none"
          : "fixed left-0 top-0 h-px w-px overflow-hidden opacity-0 pointer-events-none"
      }
    >
      <div
        ref={mountRef}
        className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:scale-105"
      />
    </div>
  );
}
