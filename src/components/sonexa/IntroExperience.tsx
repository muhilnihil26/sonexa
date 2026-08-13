import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AudioWaveform,
  ChevronDown,
  CloudDownload,
  Disc3,
  Headphones,
  ListMusic,
  Mic2,
  MonitorSmartphone,
  Music,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { fetchLyrics, type LyricLine, type LyricsResult } from "@/lib/lyrics";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type OEmbedMeta = {
  title: string;
  author_name: string;
  thumbnail_url: string;
};

/** Deterministic pseudo-random in [0,1) — makes the visualizer feel alive. */
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Literal Tailwind classes so the compiler can pick them up. */
const NOTE_ICON_SIZES = ["h-4 w-4", "h-5 w-5", "h-6 w-6"];

/** Strip "(Official Video)", "| lyrics", etc. so lyric lookups succeed. */
function cleanTitle(raw: string) {
  return raw
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s*\[.*?\]\s*/g, " ")
    .replace(/\s*[|·•-].*$/i, " ")
    .replace(/\s*-.*?(official|audio|video|lyric).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchOEmbed(videoId: string): Promise<OEmbedMeta | null> {
  try {
    const cacheKey = `sonexa.intro.oembed.v1.${videoId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached) as OEmbedMeta;
    } catch {
      /* ignore */
    }
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
    );
    if (!res.ok) return null;
    const meta = (await res.json()) as OEmbedMeta;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(meta));
    } catch {
      /* ignore */
    }
    return meta;
  } catch {
    return null;
  }
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  destroy: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
};

type YTNamespaceLike = {
  Player: new (target: string | HTMLElement, opts: Record<string, unknown>) => YTPlayer;
};

/**
 * YouTubeHost.tsx already declares Window.YT globally — reach it via a cast
 * here so the two component files don't fight over the global declaration.
 */
function getYT(): YTNamespaceLike | undefined {
  return (window as unknown as { YT?: YTNamespaceLike }).YT;
}

/* ------------------------------------------------------------------ */
/* Word reveal — words pop in one-per-beat, synced to the song         */
/* ------------------------------------------------------------------ */

function RevealWords({
  text,
  beatIndex,
  wordsPerBeat = 1,
  className = "",
}: {
  text: string;
  beatIndex: number;
  wordsPerBeat?: number;
  className?: string;
}) {
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  // Start revealing a beat or two into the song, one word per beat.
  const startBeat = 2;
  const visible = Math.min(
    words.length,
    Math.max(0, Math.floor((beatIndex - startBeat) / wordsPerBeat) + 1),
  );
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`inline-block whitespace-pre ${i < visible ? "word-pop" : "opacity-0"}`}
          style={{ animationDelay: `${Math.max(0, i - (visible - 1)) * 0.02}s` }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Character reveal for the big title                                  */
/* ------------------------------------------------------------------ */

function CharReveal({ text, className = "", bassIntensity = 0.5 }: { text: string; className?: string; bassIntensity?: number }) {
  return (
    <span className={`inline-flex ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="char-reveal inline-block"
          style={{ 
            animationDelay: `${0.35 + i * 0.09}s`,
            textShadow: bassIntensity > 0.7 ? `0 0 ${15 * bassIntensity}px rgba(34,211,238,${bassIntensity * 0.4}), 0 0 ${30 * bassIntensity}px rgba(244,114,182,${bassIntensity * 0.3})` : 'none',
            filter: bassIntensity > 0.7 ? `brightness(${1 + bassIntensity * 0.1})` : 'brightness(1)',
            transition: 'filter 0.1s ease-out, text-shadow 0.1s ease-out'
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Grand reveal for creator name - cinematic text animation           */
/* ------------------------------------------------------------------ */

function GrandCreatorReveal({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8rem] sm:text-[12rem] font-black text-white/5 blur-3xl select-none">
          {text.toUpperCase()}
        </span>
      </div>
      <div className="relative flex flex-col items-center">
        {text.split(" ").map((word, wordIdx) => (
          <div key={wordIdx} className="flex overflow-hidden">
            {word.split("").map((ch, charIdx) => (
              <span
                key={`${wordIdx}-${charIdx}`}
                className="inline-block text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 grand-char-reveal"
                style={{
                  animationDelay: `${0.5 + wordIdx * 0.3 + charIdx * 0.05}s`,
                  textShadow: '0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1)'
                }}
              >
                {ch}
              </span>
            ))}
            <span className="inline-block w-8" /> {/* Spacer between words */}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Time-driven visualizer — deterministic bars that dance on the beat  */
/* ------------------------------------------------------------------ */

function BeatVisualizer({
  playing,
  currentTime,
  bpm,
  className = "",
  barCount = 36,
}: {
  playing: boolean;
  currentTime: number;
  bpm: number;
  className?: string;
  barCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(currentTime);
  const playingRef = useRef(playing);
  timeRef.current = currentTime;
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 90;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    const beatDur = 60 / bpm;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);
      const t = timeRef.current;
      const beat = t / beatDur;
      const beatIdx = Math.floor(beat);
      const phase = beat - beatIdx;

      for (let i = 0; i < barCount; i++) {
        const seedA = hash(beatIdx * 31 + i * 7.13);
        const seedB = hash((beatIdx + 1) * 31 + i * 7.13);
        // Envelope: gentle wave across the bar index + beat accent.
        const wave = 0.5 + 0.5 * Math.sin(i * 0.55 + beatIdx * 0.6);
        const accent = 0.55 + 0.45 * Math.sin(phase * Math.PI);
        const v = (seedA * (1 - phase) + seedB * phase) * wave * accent;
        const h = Math.max(0.08, Math.min(1, playingRef.current ? v : 0.06 + wave * 0.08));

        const barW = width / barCount;
        const x = i * barW;
        const barH = Math.max(2, h * (height - 8));
        const y = (height - barH) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, "rgba(34,211,238,0.85)");
        grad.addColorStop(0.5, "rgba(167,139,250,0.8)");
        grad.addColorStop(1, "rgba(244,114,182,0.85)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, Math.max(1.5, barW - 2), barH, Math.min(4, barW / 3));
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [bpm, barCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Karaoke lyrics — line-synced with word-level fill highlight         */
/* ------------------------------------------------------------------ */

function KaraokeLyrics({
  synced,
  currentTime,
}: {
  synced: LyricLine[];
  currentTime: number;
}) {
  let active = 0;
  for (let i = 0; i < synced.length; i++) {
    if (currentTime >= synced[i].time) active = i;
  }
  const LINE_H = 64;
  const VIEW_H = 256;
  const offset = -active * LINE_H + (VIEW_H - LINE_H) / 2;

  return (
    <div className="relative w-full" style={{ height: VIEW_H }}>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[#050508] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[#050508] to-transparent" />
      <div
        className="absolute top-0 left-0 w-full will-change-transform"
        style={{
          transform: `translate(-50%, ${offset}px)`,
          left: "50%",
          transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {synced.map((line, i) => {
          const isActive = i === active;
          const isPast = i < active;
          const next = synced[i + 1];
          const lineDur = next ? Math.max(0.8, next.time - line.time) : 3.5;
          const words = line.text.split(/\s+/).filter(Boolean);
          return (
            <div
              key={`${line.time}-${i}`}
              className="karaoke-line flex items-center justify-center px-4 text-center"
              style={{ height: LINE_H }}
            >
              {isActive ? (
                <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {words.map((w, wi) => {
                    const wStart = line.time + (wi / Math.max(1, words.length)) * lineDur;
                    const lit = currentTime >= wStart;
                    return (
                      <span
                        key={wi}
                        className={`karaoke-word mr-2 inline-block ${
                          lit ? "karaoke-lit" : "text-white/60"
                        }`}
                      >
                        {w}
                      </span>
                    );
                  })}
                </span>
              ) : (
                <span
                  className={`text-base sm:text-lg ${
                    isPast ? "text-white/25" : "text-white/45"
                  }`}
                >
                  {line.text}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3D tilt card — rotates toward the cursor                            */
/* ------------------------------------------------------------------ */

function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(
      px * 12
    ).toFixed(2)}deg) translateZ(0)`;
  };

  const onLeave = () => {
    if (ref.current) {
      ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll listener — rAF-throttled                                     */
/* ------------------------------------------------------------------ */

function useScrollListener(cb: () => void) {
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = 0;
      cb();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [cb]);
}

/* ------------------------------------------------------------------ */
/* In-view reveal (IntersectionObserver adds .in-view)                 */
/* ------------------------------------------------------------------ */

function useRevealInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in-view");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ------------------------------------------------------------------ */
/* Shared playback controls                                            */
/* ------------------------------------------------------------------ */

function ControlBar({
  currentTime,
  duration,
  isPlaying,
  isMuted,
  onRestart,
  onTogglePlay,
  onSkip,
  onToggleMute,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  onRestart: () => void;
  onTogglePlay: () => void;
  onSkip: () => void;
  onToggleMute: () => void;
  onSeek: (t: number) => void;
}) {
  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center gap-3">
        <span className="w-10 text-right font-mono text-[11px] text-white/45">
          {formatTime(currentTime)}
        </span>
        <button
          onClick={onRestart}
          className="shrink-0 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Restart"
          aria-label="Restart song"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={onTogglePlay}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-white shadow-glow transition hover:scale-105 active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <button
          onClick={onSkip}
          className="shrink-0 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Skip 10s"
          aria-label="Skip 10 seconds"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleMute}
          className="shrink-0 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title={isMuted ? "Unmute" : "Mute"}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <span className="w-10 font-mono text-[11px] text-white/45">{formatTime(duration)}</span>
      </div>

      {/* Seek bar */}
      <div
        className="group relative mt-3 h-2 w-full cursor-pointer rounded-full bg-white/10"
        role="slider"
        aria-label="Seek"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={Math.max(1, Math.round(duration))}
        aria-valuenow={Math.round(currentTime)}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          onSeek(ratio * duration);
        }}
        onKeyDown={(e) => {
          if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            if (e.key === "ArrowRight") onSeek(currentTime + 5);
            else if (e.key === "ArrowLeft") onSeek(currentTime - 5);
            else if (e.key === "Home") onSeek(0);
            else if (e.key === "End") onSeek(duration);
          }
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 transition-[width] duration-200"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover:opacity-100"
          style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Demo lyrics — guarantees the karaoke feature always works            */
/* ------------------------------------------------------------------ */

const DEMO_LYRICS: LyricLine[] = [
  { time: 0.4, text: "Close your eyes, let the rhythm take control" },
  { time: 4.2, text: "Every heartbeat moving, body and soul" },
  { time: 8.1, text: "Through the static we find a clearer sound" },
  { time: 12.3, text: "Waves of melody lifting us off the ground" },
  { time: 16.6, text: "Listen beyond, beyond the noise" },
  { time: 20.4, text: "Feel the music fill the void" },
  { time: 24.2, text: "Every note a spark, a brand new flame" },
  { time: 28.5, text: "Sonexa calling out your name" },
  { time: 32.6, text: "Golden echoes in the midnight air" },
  { time: 36.8, text: "Tangled voices, but we don't care" },
  { time: 41.0, text: "This is the moment we were made for" },
  { time: 45.2, text: "Dance until the night is no more" },
  { time: 49.5, text: "Listen beyond, beyond the noise" },
  { time: 53.3, text: "Feel the music fill the void" },
  { time: 57.1, text: "One more chorus, one more chance" },
  { time: 61.4, text: "Let the song become the dance" },
];

const DEMO_PLAIN = DEMO_LYRICS.map((l) => l.text).join("\n");

const MARQUEE_WORDS = [
  "SONEXA",
  "LISTEN BEYOND",
  "LIVE KARAOKE",
  "BEAT-SYNCED",
  "HD AUDIO",
  "OFFLINE MODE",
  "MULTI-PLATFORM",
];

const TILT_CARDS = [
  {
    icon: Zap,
    title: "Beat-Synced Visuals",
    desc: "Every glow, ring and pulse dances to the tempo of the track — a living canvas around your music.",
  },
  {
    icon: Mic2,
    title: "Live Karaoke",
    desc: "Word-perfect synced lyrics highlight along with the song, line by line, beat by beat.",
  },
  {
    icon: AudioWaveform,
    title: "Crystal HD Audio",
    desc: "Studio-grade streaming engineered for headphones, speakers and everything in between.",
  },
  {
    icon: CloudDownload,
    title: "Offline Mode",
    desc: "Download your favourites and keep the music going even with zero signal.",
  },
  {
    icon: MonitorSmartphone,
    title: "Every Platform",
    desc: "Web, Android, TV, desktop and car — one library, synced everywhere you go.",
  },
];

/* ------------------------------------------------------------------ */
/* Main experience                                                     */
/* ------------------------------------------------------------------ */

export function IntroExperience({
  videoId,
  tagline,
  appLink,
  appLabel,
  photoUrl,
  revealText,
}: {
  videoId: string;
  tagline: string;
  appLink: string;
  appLabel: string;
  photoUrl?: string | null;
  revealText?: string | null;
}) {
  const playerRef = useRef<YTPlayer | null>(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [meta, setMeta] = useState<OEmbedMeta | null>(null);
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [bpm, setBpm] = useState(118);
  const [error, setError] = useState<string | null>(null);

  /* Scroll-driven refs */
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const pinSectionRef = useRef<HTMLElement | null>(null);
  const pinTrackRef = useRef<HTMLDivElement | null>(null);
  const reduceMotionRef = useRef(false);

  /* Mouse-parallax layer refs */
  const parallaxDiscRef = useRef<HTMLDivElement | null>(null);
  const parallaxRingsRef = useRef<HTMLDivElement | null>(null);
  const parallaxTitleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /* ---------- Scroll-driven 3D animation ---------- */
  const onScroll = useCallback(() => {
    const vh = window.innerHeight;

    // Scroll progress bar
    const doc = document.documentElement;
    const max = doc.scrollHeight - vh;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;

    // Hero tilts back in 3D as it scrolls out of view
    const hero = heroSectionRef.current;
    const content = heroContentRef.current;
    if (hero && content) {
      const rect = hero.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.9)));
      if (reduceMotionRef.current) {
        content.style.opacity = "";
        content.style.transform = "";
      } else {
        content.style.opacity = String(Math.max(0, 1 - prog * 1.4));
        content.style.transform = `perspective(1200px) rotateX(${(-prog * 28).toFixed(
          2,
        )}deg) scale(${(1 - prog * 0.12).toFixed(3)}) translateY(${(-prog * 90).toFixed(1)}px)`;
      }
    }

    // Pinned horizontal 3D carousel — vertical scroll drives horizontal travel
    const pin = pinSectionRef.current;
    const track = pinTrackRef.current;
    if (pin && track) {
      const rect = pin.getBoundingClientRect();
      const total = rect.height - vh;
      const prog = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const move = prog * Math.max(0, track.scrollWidth - window.innerWidth + 40);
      if (reduceMotionRef.current) {
        track.style.transform = "translate3d(0,0,0)";
      } else {
        track.style.transform = `translate3d(${-move.toFixed(1)}px, 0, 0)`;
      }
    }
  }, []);
  useScrollListener(onScroll);

  /* ---------- Mouse parallax — disc, rings and title float at different depths ---------- */
  useEffect(() => {
    const hero = heroSectionRef.current;
    if (!hero) return;
    // Bail out entirely for reduced-motion users (no loop, no transforms).
    if (reduceMotionRef.current) return;

    const target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let lastWrittenX = 0;
    let lastWrittenY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      // Only touch the DOM when the eased position actually moved — avoids
      // pointless style writes every frame on idle/touch devices.
      if (
        Math.abs(current.x - lastWrittenX) < 0.02 &&
        Math.abs(current.y - lastWrittenY) < 0.02
      ) {
        return;
      }
      lastWrittenX = current.x;
      lastWrittenY = current.y;
      const px = current.x;
      const py = current.y;
      // Depth order: disc (deepest) > rings (mid) > title (shallow).
      if (parallaxDiscRef.current) {
        parallaxDiscRef.current.style.transform = `translate3d(${(px * 46).toFixed(
          2,
        )}px, ${(py * 34).toFixed(2)}px, 60px) rotateX(${(-py * 7).toFixed(
          2,
        )}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
      }
      if (parallaxRingsRef.current) {
        parallaxRingsRef.current.style.transform = `translate3d(${(px * 26).toFixed(
          2,
        )}px, ${(py * 20).toFixed(2)}px, 30px)`;
      }
      if (parallaxTitleRef.current) {
        parallaxTitleRef.current.style.transform = `translate3d(${(px * 12).toFixed(
          2,
        )}px, ${(py * 9).toFixed(2)}px, 0)`;
      }
    };

    hero.addEventListener("mousemove", onMove, { passive: true });
    hero.addEventListener("mouseleave", onLeave);
    tick();
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  /* ---------- Load YouTube IFrame API ---------- */
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    const init = () => {
      const yt = getYT();
      if (cancelled || !yt?.Player) return;
      try {
        // Capture the instance immediately so cleanup can destroy it even if
        // onReady has not fired yet (prevents an orphaned iframe on fast unmount).
        const player = new yt.Player("sonexa-intro-player", {
          videoId,
          width: "1",
          height: "1",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            loop: 1,
            playlist: videoId,
            playsinline: 1,
          },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              if (cancelled) return;
              playerRef.current = e.target;
              setDuration(e.target.getDuration());
              e.target.mute();
              setPlayerReady(true);
              e.target.playVideo();
            },
            onStateChange: (e: { data: number }) => {
              if (cancelled) return;
              setIsPlaying(e.data === 1);
              if (e.data === 1) {
                setDuration(playerRef.current?.getDuration() ?? 0);
              }
            },
            onError: () => {
              if (!cancelled) setError("Could not load the intro track.");
            },
          },
        });
        playerRef.current = player;
      } catch {
        if (!cancelled) setError("Could not start the intro player.");
      }
    };

    if (getYT()?.Player) {
      init();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* player may already be gone */
      }
    };
  }, [videoId]);

  /* ---------- Simulated beat when no track is configured ---------- */
  useEffect(() => {
    if (videoId || playerReady) return;
    setIsPlaying(true);
    const id = setInterval(() => {
      setCurrentTime((t) => t + 0.2);
    }, 200);
    return () => {
      clearInterval(id);
      setIsPlaying(false);
    };
  }, [videoId, playerReady]);

  /* ---------- Poll real playback position ---------- */
  useEffect(() => {
    if (!playerReady) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      setCurrentTime(p.getCurrentTime());
      setDuration(p.getDuration());
    }, 200);
    return () => clearInterval(id);
  }, [playerReady]);

  /* ---------- Fetch song metadata + lyrics (demo fallback) ---------- */
  useEffect(() => {
    if (!videoId) {
      setLyrics({ status: "found", synced: DEMO_LYRICS, plain: DEMO_PLAIN });
      return;
    }
    let cancelled = false;
    setLyrics(null);
    setLyricsLoading(true);
    fetchOEmbed(videoId).then((m) => {
      if (!cancelled && m) {
        setMeta(m);
        const artist = m.author_name;
        const title = cleanTitle(m.title);
        fetchLyrics(title, artist).then((r) => {
          if (!cancelled) {
            setLyrics(r);
            setLyricsLoading(false);
          }
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  /* ---------- Estimate BPM from synced lyric density ---------- */
  useEffect(() => {
    if (lyrics?.status !== "found" || !lyrics.synced || lyrics.synced.length < 3) return;
    const gaps: number[] = [];
    for (let i = 1; i < lyrics.synced.length; i++) {
      const g = lyrics.synced[i].time - lyrics.synced[i - 1].time;
      if (g > 0.4 && g < 12) gaps.push(g);
    }
    if (gaps.length < 3) return;
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    const est = Math.round(240 / median); // ~4 beats per lyric line
    if (est >= 70 && est <= 190) setBpm(est);
  }, [lyrics]);

  /* ---------- Beat engine (derived from playback time) ---------- */
  const beatDur = 60 / bpm;
  const beatIndex = Math.floor(currentTime / beatDur);
  const [beatKey, setBeatKey] = useState(0);
  const prevBeat = useRef(beatIndex);
  useEffect(() => {
    if (beatIndex !== prevBeat.current) {
      prevBeat.current = beatIndex;
      setBeatKey((k) => k + 1);
    }
  }, [beatIndex]);

  /* ---------- Karaoke lines (real synced → auto-timed plain → demo) ---------- */
  const karaokeLines = useMemo(() => {
    if (lyrics?.status === "found") {
      if (lyrics.synced && lyrics.synced.length) return lyrics.synced;
      const ls = (lyrics.plain ?? "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (ls.length) return ls.map((text, i) => ({ time: i * 3.6, text }));
    }
    return DEMO_LYRICS;
  }, [lyrics]);

  const usingDemo = lyrics?.status !== "found" || (!lyrics.synced?.length && !lyrics.plain);
  const activeKaraokeLine = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < karaokeLines.length; i++) {
      if (currentTime >= karaokeLines[i].time) idx = i;
    }
    return idx;
  }, [karaokeLines, currentTime]);
  const lyricsStatusLabel = lyricsLoading
    ? "Fetching lyrics…"
    : lyrics?.status === "found" && lyrics.synced?.length
      ? "Synced karaoke"
      : lyrics?.status === "found" && lyrics.plain
        ? "Auto-timed lyrics"
        : "Demo lyrics";

  /* ---------- Controls ---------- */
  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.getPlayerState() === 1) p.pauseVideo();
    else p.playVideo();
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      setIsMuted(false);
    } else {
      p.mute();
      setIsMuted(true);
    }
  }, []);

  const seekTo = useCallback((t: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, t), true);
    setCurrentTime(Math.max(0, t));
  }, []);

  const restart = useCallback(() => seekTo(0), [seekTo]);

  const skip = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.min(p.getDuration() - 1, p.getCurrentTime() + 10), true);
  }, []);

  const scrollToLyrics = useCallback(() => {
    document.getElementById("sonexa-lyrics")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hasTrack = Boolean(videoId && meta);
  const karaokeRevealRef = useRevealInView<HTMLDivElement>();
  const carouselRevealRef = useRevealInView<HTMLDivElement>();
  const outroRevealRef = useRevealInView<HTMLDivElement>();

  /* ---------- Render ---------- */
  return (
    <div className="relative overflow-x-clip bg-[#050508] text-foreground">
      {/* Hidden YouTube player element */}
      <div
        className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px opacity-0"
        aria-hidden="true"
      >
        <div id="sonexa-intro-player" />
      </div>

      {/* Scroll progress bar */}
      <div className="sticky top-0 z-[70] h-1 w-full bg-white/5">
        <div
          ref={progressRef}
          className="progress-bar h-full w-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Page-wide animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0b1020] via-[#0a0a14] to-[#1c0b22] animate-gradient-shift"
          style={{ backgroundSize: "200% 200%" }}
        />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="absolute top-1/3 left-0 h-72 w-72 rounded-full bg-cyan-600/10 blur-3xl" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="absolute bottom-[-40px] left-0 note-rise"
            style={{
              left: `${6 + i * 14}%`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${6 + (i % 3) * 2}s`,
            }}
          >
            <Music className={NOTE_ICON_SIZES[i % NOTE_ICON_SIZES.length]} />
          </div>
        ))}
      </div>

      {/* ============ SECTION 1 — HERO (3D scroll tilt) ============ */}
      <section ref={heroSectionRef} className="relative flex min-h-svh flex-col overflow-hidden">
        {/* Beat-reactive glow orbs */}
        {isPlaying && (
          <div
            key={`orb-${beatKey}`}
            className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-3xl beat-ring"
          />
        )}
        {isPlaying && (
          <div
            key={`orb2-${beatKey}`}
            className="absolute right-1/4 bottom-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/15 blur-3xl beat-ring"
            style={{ animationDelay: "0.12s" }}
          />
        )}
        <div className="absolute right-1/3 bottom-1/3 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl animate-pulse-glow" />

        <div
          ref={heroContentRef}
          className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 py-14 will-change-transform sm:gap-8"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 flex w-full items-center justify-between">
            <Link
              to="/"
              className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/50 backdrop-blur transition hover:bg-white/10 hover:text-white/80"
            >
              Sonexa Home
            </Link>
            <Link
              to={appLink}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur transition hover:border-white/30 hover:text-white"
            >
              Skip intro →
            </Link>
          </div>

          {/* Disc + title */}
          <div
            className="relative flex w-full max-w-3xl flex-col items-center gap-8"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Beat rings behind the disc (mid-depth parallax) */}
            <div ref={parallaxRingsRef} className="parallax-layer pointer-events-none absolute inset-0">
              {isPlaying && (
                <>
                  <div
                    key={`ring-${beatKey}`}
                    className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 beat-ring sm:h-96 sm:w-96"
                  />
                  <div
                    key={`ring2-${beatKey}`}
                    className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-400/30 beat-ring sm:h-96 sm:w-96"
                    style={{ animationDelay: "0.18s" }}
                  />
                </>
              )}
            </div>

            {/* Disc with live visualizer (deepest parallax) */}
            <div ref={parallaxDiscRef} className="parallax-layer">
            <div
              className={`relative h-56 w-56 rounded-full sm:h-72 sm:w-72 ${
                isPlaying ? "disc-spin" : ""
              } animate-scale-in`}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 via-violet-600/40 to-fuchsia-500/30 blur-xl animate-pulse-glow" />
              <div className="absolute inset-0 rounded-full border border-white/10 bg-[#101018] shadow-2xl shadow-violet-900/40" />
              <div className="absolute inset-4 rounded-full border border-white/5" />
              <div className="absolute inset-8 rounded-full border border-white/5" />
              <div className="absolute inset-12 rounded-full border border-white/5" />
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <BeatVisualizer
                  playing={isPlaying}
                  currentTime={currentTime}
                  bpm={bpm}
                  barCount={48}
                  className="absolute inset-0 opacity-70"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 shadow-glow">
                <Disc3 className="h-8 w-8 text-white" />
              </div>
            </div>
            </div>

            {/* Title + tagline (shallow parallax) */}
            <div ref={parallaxTitleRef} className="parallax-layer text-center">
              <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                <CharReveal
                  text="Sonexa"
                  className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(139,92,246,0.45)]"
                />
              </h1>
              <p className="mt-3 text-lg font-semibold tracking-wide text-white/75 sm:text-xl">
                <RevealWords text={tagline} beatIndex={beatIndex} className="min-h-[1.5em]" />
              </p>
              
              {/* Grand creator reveal */}
              <div className="mt-12 animate-fade-up" style={{ animationDelay: '1.2s' }}>
                {revealText ? (
                  <GrandCreatorReveal text={revealText} />
                ) : (
                  <GrandCreatorReveal text="Muhil Siddhesh" />
                )}
                <p className="mt-4 text-sm font-medium tracking-[0.3em] text-white/50 uppercase">
                  Creator & Developer
                </p>
              </div>

              {/* Admin uploaded photo reveal */}
              {photoUrl && (
                <div className="mt-8 animate-fade-up" style={{ animationDelay: '1.8s' }}>
                  <div className="relative inline-block">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-violet-500/30 to-fuchsia-500/30 blur-xl animate-pulse-glow" />
                    <img
                      src={photoUrl}
                      alt="Featured"
                      className="relative h-48 w-48 rounded-2xl object-cover ring-1 ring-white/20 shadow-2xl photo-reveal"
                    />
                  </div>
                </div>
              )}

              {/* Equalizer */}
              <div className="mt-5 flex h-5 items-end justify-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full bg-gradient-to-t from-cyan-400 via-violet-400 to-fuchsia-400 ${
                      isPlaying ? "equalizer-bar" : "opacity-30"
                    }`}
                    style={{ height: isPlaying ? undefined : 6 }}
                  />
                ))}
                <span className="ml-3 self-center text-xs font-medium tracking-widest text-white/40 uppercase">
                  {isPlaying ? "Now playing" : "Paused"}
                </span>
              </div>
            </div>
          </div>

          {/* Compact now-playing chip */}
          {hasTrack && (
            <div className="glass-card flex w-full max-w-md items-center gap-3 rounded-2xl p-3 animate-fade-up">
              {meta?.thumbnail_url ? (
                <img
                  src={meta.thumbnail_url}
                  alt=""
                  className="h-11 w-11 rounded-lg object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30">
                  <Headphones className="h-5 w-5 text-white/70" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{meta?.title}</div>
                <div className="truncate text-xs text-white/50">{meta?.author_name}</div>
              </div>
              <button
                onClick={scrollToLyrics}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                <Mic2 className="h-3.5 w-3.5" />
                Lyrics
              </button>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 animate-fade-up">
            <Link
              to={appLink}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-10 py-3.5 font-bold text-white shadow-glow transition hover:scale-105 hover:brightness-110 active:scale-95"
            >
              {appLabel}
            </Link>
            {error ? (
              <p className="text-xs text-red-400/80">{error}</p>
            ) : (
              <p className="text-center text-[11px] text-white/30">
                Background music by admin · Scroll to explore the experience
              </p>
            )}
          </div>

          {/* Scroll hint */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/40">
            <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <ChevronDown className="scroll-hint h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Trending video-like scrolling marquee - seamless loop */}
      <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.03] py-4">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-gradient-pan" style={{ backgroundSize: '200% 100%' }} />
        <div className="relative flex items-center overflow-hidden">
          <div className="flex items-center gap-8 animate-marquee-seamless">
            {['🔥 TRENDING', '⚡ VIRAL', '🎵 MUSIC', '🌟 POPULAR', '🎬 VIDEOS', '🎧 AUDIO', '✨ HITS', '🚀 RISING'].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-cyan-400/30 group cursor-pointer shrink-0"
              >
                <span className="text-lg">{item.split(' ')[0]}</span>
                <span className="text-xs font-semibold tracking-wider text-white/60 group-hover:text-white/80">
                  {item.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {['🔥 TRENDING', '⚡ VIRAL', '🎵 MUSIC', '🌟 POPULAR', '🎬 VIDEOS', '🎧 AUDIO', '✨ HITS', '🚀 RISING'].map((item, i) => (
              <div
                key={`dup-${i}`}
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-cyan-400/30 group cursor-pointer shrink-0"
              >
                <span className="text-lg">{item.split(' ')[0]}</span>
                <span className="text-xs font-semibold tracking-wider text-white/60 group-hover:text-white/80">
                  {item.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ============ SECTION 3 — PINNED 3D CAROUSEL ============ */}
      <section ref={pinSectionRef} className="relative h-[340vh]">
        <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
          <div ref={carouselRevealRef} className="reveal-3d pointer-events-none absolute top-14 left-0 z-20 px-6 sm:px-12">
            <div className="text-[11px] font-semibold tracking-[0.35em] text-fuchsia-300/80 uppercase">
              The Experience
            </div>
            <h2 className="mt-1 text-3xl font-black text-white sm:text-5xl">
              Scroll. <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">It moves with you.</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/50">
              Vertical scroll drives horizontal 3D travel — the page plays like a video, card by card.
            </p>
          </div>

          <div
            ref={pinTrackRef}
            className="flex w-max items-center gap-6 pl-[8vw] pr-[15vw] will-change-transform"
          >
            {TILT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="relative shrink-0"
                  style={{ transform: `perspective(1200px) rotateY(${(i - 2) * 6}deg)` }}
                >
                  <TiltCard className="group relative w-[78vw] max-w-[400px] rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:w-[400px] sm:p-8">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/30 ring-1 ring-white/10">
                        <Icon className="h-6 w-6 text-cyan-300" />
                      </div>
                      <span className="font-mono text-xs tracking-widest text-white/25">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-white">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{card.desc}</p>
                    <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all duration-300 group-hover:w-full" />
                    </div>
                  </TiltCard>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SECTION 4 — OUTRO ============ */}
      <section className="relative flex min-h-svh flex-col items-center justify-center px-4 py-20 text-center">
        <div ref={outroRevealRef} className="reveal-3d flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-fuchsia-300/80">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-semibold tracking-[0.35em] uppercase">
              Ready when you are
            </span>
          </div>
          <h2 className="max-w-3xl text-4xl leading-tight font-black text-white sm:text-6xl">
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              Listen Beyond Limits
            </span>
          </h2>
          <p className="max-w-md text-sm text-white/50 sm:text-base">
            The beat never stops. Your music, your lyrics, your moment — everywhere you go.
          </p>
          <Link
            to={appLink}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-12 py-4 text-lg font-bold text-white shadow-glow transition hover:scale-105 hover:brightness-110 active:scale-95"
          >
            {appLabel}
          </Link>
          <p className="text-[11px] text-white/30">
            Sonexa — Listen Beyond Limits · Created by War.Dev
          </p>
        </div>
      </section>
    </div>
  );
}
