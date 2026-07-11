import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { notifyTrackChange, notifyPlaybackState } from "@/lib/notifications";

export type Track = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  cover: string;
  audio: string;
  duration?: number;
  language?: string;
  album?: string;
  kind?: "audio" | "youtube";
  ytId?: string;
};

export type AudioEffects = {
  bass: number;
  treble: number;
  echo: number;
};

// Bridge exposed by <YouTubeHost/>. The player store calls these to drive
// a hidden YouTube IFrame for audio-only playback of YT tracks.
export type YTBridge = {
  load: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void; // 0..1
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};
let ytBridge: YTBridge | null = null;
export function setYTBridge(b: YTBridge | null) {
  ytBridge = b;
}
export function getYTBridge() {
  return ytBridge;
}

// Allow YouTubeHost to push time/state updates back into the player store.
type Listener = (
  e:
    | { kind: "time"; time: number; duration: number }
    | { kind: "ended" }
    | { kind: "play" }
    | { kind: "pause" }
    | { kind: "error" },
) => void;
const ytListeners = new Set<Listener>();
export function emitYTEvent(e: Parameters<Listener>[0]) {
  ytListeners.forEach((l) => l(e));
}

// Track YT video IDs that failed so we can auto-skip them.
const failedYt = new Set<string>();
export function isYtBroken(id: string) {
  return failedYt.has(id);
}
export function markYtBroken(id: string) {
  failedYt.add(id);
}

type PlayerCtx = {
  current: Track | null;
  queue: Track[];
  userQueue: Track[];
  sourceQueue: Track[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  effects: AudioEffects;
  shuffle: boolean;
  repeat: boolean;
  ytVideoVisible: boolean;
  pairedTvCode: string;
  setPairedTvCode: (code: string) => void;
  play: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  setAudioEffect: (key: keyof AudioEffects, value: number) => void;
  resetAudioEffects: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  jumpTo: (id: string) => void;
  removeFromQueue: (id: string) => void;
  addToQueue: (t: Track) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  startRadio: (catalog: Track[], userKey: string) => void;
  setYTVideoVisible: (visible: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const Ctx = createContext<PlayerCtx | null>(null);
const defaultEffects: AudioEffects = { bass: 0, treble: 0, echo: 0 };

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const feedbackRef = useRef<GainNode | null>(null);
  const echoWetRef = useRef<GainNode | null>(null);
  const historyRef = useRef<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
  const [sourceQueue, setSourceQueue] = useState<Track[]>([]);
  const [userQueue, setUserQueue] = useState<Track[]>([]);
  const queue = [...userQueue, ...sourceQueue];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState(0.8);
  const [effects, setEffects] = useState<AudioEffects>(defaultEffects);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [ytVideoVisible, setYTVideoVisible] = useState(false);

  const [pairedTvCode, setPairedTvCodeState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sonexa.tvRemote.pairedCode.v1") ?? "";
    }
    return "";
  });

  const setPairedTvCode = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPairedTvCodeState(clean);
    if (typeof window !== "undefined") {
      if (clean) {
        localStorage.setItem("sonexa.tvRemote.pairedCode.v1", clean);
      } else {
        localStorage.removeItem("sonexa.tvRemote.pairedCode.v1");
      }
    }
  };

  const sendRemoteCommand = async (
    action: string,
    track?: Track | null,
    extra?: { seekTime?: number; volume?: number }
  ) => {
    if (!pairedTvCode || pairedTvCode.length !== 6) return;
    try {
      const { firebaseDb } = await import("@/integrations/firebase/client");
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      await setDoc(
        doc(firebaseDb, "sonexa_remote_sessions", pairedTvCode),
        {
          command: {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            action,
            ...(track ? { track } : {}),
            ...(extra ?? {}),
          },
          controller: "phone",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (e) {
      console.error("Failed to send remote command:", e);
    }
  };

  // Sync background play preferences
  const [disableBackgroundPlay, setDisableBackgroundPlay] = useState(false);
  useEffect(() => {
    const checkValue = () => {
      setDisableBackgroundPlay(localStorage.getItem("sonexa.disableBackgroundPlay") === "true");
    };
    checkValue();
    window.addEventListener("storage", checkValue);
    const interval = setInterval(checkValue, 1000);
    return () => {
      window.removeEventListener("storage", checkValue);
      clearInterval(interval);
    };
  }, []);

  // Background play check - Spotify-like background playback
  useEffect(() => {
    if (!disableBackgroundPlay || !isPlaying) return;
    const handleBackground = () => {
      // Spotify-like: continue playing in background, don't pause
      // Just update media session for lock screen controls
      if (current && "mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.title,
          artist: current.artist,
          album: current.album || "Sonexa",
          artwork: [
            {
              src: current.cover,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        });

        navigator.mediaSession.setActionHandler("play", () => {
          toggle();
        });

        navigator.mediaSession.setActionHandler("pause", () => {
          toggle();
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => {
          prev();
        });

        navigator.mediaSession.setActionHandler("nexttrack", () => {
          next();
        });

        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime && details.seekTime !== undefined) {
            seek(details.seekTime);
          }
        });
      }
    };
    const handleVisibility = () => {
      if (document.hidden) handleBackground();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [disableBackgroundPlay, isPlaying, current, toggle, prev, next, seek]);

  // Phone simulation of progress when casting to TV
  useEffect(() => {
    if (!pairedTvCode || pairedTvCode.length !== 6 || !isPlaying || !current) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= duration) {
          next();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pairedTvCode, isPlaying, current, duration]);

  function applyAudioEffects(nextEffects = effects) {
    if (bassRef.current) bassRef.current.gain.value = nextEffects.bass;
    if (trebleRef.current) trebleRef.current.gain.value = nextEffects.treble;
    if (gainRef.current) gainRef.current.gain.value = Math.max(0, Math.min(3, volume));
    if (feedbackRef.current) feedbackRef.current.gain.value = nextEffects.echo * 0.22;
    if (echoWetRef.current) echoWetRef.current.gain.value = nextEffects.echo * 0.3;
  }

  function stopNativeAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function ensureAudioGraph() {
    const audio = audioRef.current;
    if (!audio || sourceRef.current) return;
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const source = ctx.createMediaElementSource(audio);
    const bass = ctx.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 160;
    const treble = ctx.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 3200;
    const gain = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.22;
    const feedback = ctx.createGain();
    const echoWet = ctx.createGain();
    feedback.gain.value = 0;
    echoWet.gain.value = 0;
    source.connect(bass);
    bass.connect(treble);
    treble.connect(gain);
    gain.gain.value = Math.max(0, Math.min(3, volume));
    gain.connect(ctx.destination);
    treble.connect(delay);
    delay.connect(echoWet);
    echoWet.connect(ctx.destination);
    delay.connect(feedback);
    feedback.connect(delay);
    audioCtxRef.current = ctx;
    sourceRef.current = source;
    gainRef.current = gain;
    bassRef.current = bass;
    trebleRef.current = treble;
    delayRef.current = delay;
    feedbackRef.current = feedback;
    echoWetRef.current = echoWet;
    applyAudioEffects();
  }

  function resumeAudioGraph() {
    ensureAudioGraph();
    audioCtxRef.current?.resume().catch(() => undefined);
  }

  // ── Audio (<audio>) lifecycle ─────────────────────────────────────────
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const t = () => {
      // Do not sync progress locally if casting
      if (pairedTvCode && pairedTvCode.length === 6) return;
      setProgress(a.currentTime);
    };
    const d = () => setDuration(a.duration || 0);
    const e = () => next();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onErr = () => setIsPlaying(false);
    a.addEventListener("timeupdate", t);
    a.addEventListener("loadedmetadata", d);
    a.addEventListener("ended", e);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("error", onErr);

    // If casting, do not drive local HTML5 audio element
    if (pairedTvCode && pairedTvCode.length === 6) {
      a.pause();
      ytBridge?.pause();
      return () => {
        a.removeEventListener("timeupdate", t);
        a.removeEventListener("loadedmetadata", d);
        a.removeEventListener("ended", e);
        a.removeEventListener("play", onPlay);
        a.removeEventListener("pause", onPause);
        a.removeEventListener("error", onErr);
      };
    }

    // Drive based on track kind
    if (current && current.kind !== "youtube") {
      ytBridge?.pause();
      ensureAudioGraph();
      a.pause();
      a.currentTime = 0;
      a.load();
      resumeAudioGraph();
      a.play().catch(() => setIsPlaying(false));
    } else if (current?.kind === "youtube") {
      stopNativeAudio();
      ytBridge?.load(current.ytId!);
    }
    return () => {
      a.removeEventListener("timeupdate", t);
      a.removeEventListener("loadedmetadata", d);
      a.removeEventListener("ended", e);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("error", onErr);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pairedTvCode]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, volume));
    if (gainRef.current) gainRef.current.gain.value = Math.max(0, Math.min(3, volume));
    ytBridge?.setVolume(Math.min(1, Math.max(0, volume)));
  }, [volume]);

  useEffect(() => {
    applyAudioEffects(effects);
  }, [effects]);

  // ── YouTube events ────────────────────────────────────────────────────
  useEffect(() => {
    const l: Listener = (e) => {
      if (!current || current.kind !== "youtube") return;
      // Do not sync progress locally if casting
      if (pairedTvCode && pairedTvCode.length === 6) return;

      if (e.kind === "time") {
        setProgress(e.time);
        if (e.duration) setDuration(e.duration);
      } else if (e.kind === "ended") next();
      else if (e.kind === "play") setIsPlaying(true);
      else if (e.kind === "pause") setIsPlaying(false);
      else if (e.kind === "error") {
        if (current.ytId) markYtBroken(current.ytId);
        next();
      }
    };
    ytListeners.add(l);
    return () => {
      ytListeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pairedTvCode]);

  // ── Media Session (lock-screen / notification controls) ──────────────
  useEffect(() => {
    if (!current) return;

    // Web fallback
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.album ?? "Sonexa",
        artwork: current.cover
          ? [{ src: current.cover, sizes: "512x512", type: "image/jpeg" }]
          : undefined,
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => toggle());
      navigator.mediaSession.setActionHandler("pause", () => toggle());
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (typeof d.seekTime === "number") seek(d.seekTime);
      });
    }

    // Native Capacitor integration
    try {
      import("@capgo/capacitor-media-session").then(({ MediaSession }) => {
        MediaSession.setMetadata({
          title: current.title,
          artist: current.artist,
          album: current.album ?? "Sonexa",
          artwork: current.cover
            ? [{ src: current.cover, sizes: "512x512", type: "image/jpeg" }]
            : undefined,
        });
        MediaSession.setPlaybackState({ playbackState: isPlaying ? "playing" : "paused" });
        MediaSession.setActionHandler({ action: "play" }, () => toggle());
        MediaSession.setActionHandler({ action: "pause" }, () => toggle());
        MediaSession.setActionHandler({ action: "nexttrack" }, () => next());
        MediaSession.setActionHandler({ action: "previoustrack" }, () => prev());
      });
    } catch (e) {
      // Ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isPlaying]);

  function playInternal(track: Track, q?: Track[], remember = true) {
    if (remember && current && current.id !== track.id) {
      historyRef.current = [
        current,
        ...historyRef.current.filter((item) => item.id !== current.id),
      ].slice(0, 50);
    }

    setCurrent(track);
    setDuration(track.duration || 180);
    setProgress(0);
    if (q) setSourceQueue(q);
    setIsPlaying(true);

    // Notify track change
    if (remember && current?.id !== track.id) {
      notifyTrackChange(track);
    }

    if (pairedTvCode && pairedTvCode.length === 6) {
      stopNativeAudio();
      ytBridge?.pause();
      sendRemoteCommand("play-track", track);
      return;
    }

    if (track.kind === "youtube") stopNativeAudio();
    else {
      setYTVideoVisible(false);
      ytBridge?.pause();
    }

    queueMicrotask(() => {
      if (track.kind === "youtube" && !(pairedTvCode && pairedTvCode.length === 6)) {
        ytBridge?.load(track.ytId!);
      }
    });
  }

  function play(track: Track, q?: Track[]) {
    // Preserve existing queue if user clicks a single song card and we have an active queue
    if (q && q.length === 1 && q[0].id === track.id && queue.length > 1) {
      const exists = queue.some((x) => x.id === track.id);
      if (exists) {
        playInternal(track, undefined, true);
      } else {
        const newSource = [...sourceQueue];
        const curIdx = current ? newSource.findIndex((x) => x.id === current.id) : -1;
        if (curIdx === -1) {
          newSource.unshift(track);
        } else {
          newSource.splice(curIdx + 1, 0, track);
        }
        playInternal(track, newSource, true);
      }
    } else {
      // Wiping custom user queue when playing a new contextual album/playlist
      setUserQueue([]);
      playInternal(track, q, true);
    }
  }

  function toggle() {
    if (!current) return;
    if (pairedTvCode && pairedTvCode.length === 6) {
      sendRemoteCommand("toggle");
      setIsPlaying(!isPlaying);
      return;
    }

    if (current.kind === "youtube") {
      if (isPlaying) {
        ytBridge?.pause();
        setIsPlaying(false);
      } else {
        ytBridge?.play();
        setIsPlaying(true);
      }
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      resumeAudioGraph();
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
    
    // Notify playback state change
    notifyPlaybackState(!isPlaying);
  }

  function next() {
    if (!current) return;
    if (pairedTvCode && pairedTvCode.length === 6) {
      sendRemoteCommand("next");
      // Fall through to update phone master states
    }

    // 1. Play from userQueue if there are custom queued songs
    if (userQueue.length > 0) {
      const nextTrack = userQueue[0];
      setUserQueue((uq) => uq.slice(1));
      playInternal(nextTrack, undefined, true);
      return;
    }

    // 2. Play from sourceQueue
    if (sourceQueue.length <= 1) {
      if (repeat) {
        seek(0);
        if (current.kind === "youtube") {
          if (!(pairedTvCode && pairedTvCode.length === 6)) ytBridge?.play();
        } else {
          resumeAudioGraph();
          if (!(pairedTvCode && pairedTvCode.length === 6)) audioRef.current?.play().catch(() => {});
        }
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    const idx = sourceQueue.findIndex((t) => t.id === current.id);
    const len = sourceQueue.length;
    for (let step = 1; step <= len; step++) {
      if (!shuffle && !repeat && idx + step >= len) {
        setIsPlaying(false);
        return;
      }
      const candIdx = shuffle ? Math.floor(Math.random() * len) : (idx + step) % len;
      const cand = sourceQueue[candIdx];
      if (cand.id === current.id && len > 1) continue;
      if (cand.kind === "youtube" && cand.ytId && failedYt.has(cand.ytId)) continue;
      playInternal(cand, undefined, true);
      return;
    }
    setIsPlaying(false);
  }

  function prev() {
    if (!current) return;
    if (pairedTvCode && pairedTvCode.length === 6) {
      sendRemoteCommand("prev");
      // Fall through to update phone master states
    }

    // Spotify style previous button flow: restart current song if played >3 seconds
    if (progress > 3) {
      seek(0);
      return;
    }

    const previous = historyRef.current.shift();
    if (previous) {
      // Re-insert into sourceQueue at beginning if not already there
      const newSource = sourceQueue.includes(previous) ? sourceQueue : [previous, ...sourceQueue];
      playInternal(previous, newSource, false);
      return;
    }
    seek(0);
  }

  function seek(s: number) {
    setProgress(s);
    if (pairedTvCode && pairedTvCode.length === 6) {
      sendRemoteCommand("seek-to", null, { seekTime: s });
      return;
    }

    if (current?.kind === "youtube") {
      ytBridge?.seek(s);
      return;
    }
    if (audioRef.current) audioRef.current.currentTime = s;
  }

  function jumpTo(id: string) {
    // Check in userQueue first
    const uIdx = userQueue.findIndex((x) => x.id === id);
    if (uIdx !== -1) {
      const track = userQueue[uIdx];
      setUserQueue((uq) => uq.slice(uIdx + 1));
      playInternal(track, undefined, true);
      return;
    }

    // Check in sourceQueue
    const t = sourceQueue.find((x) => x.id === id);
    if (t) play(t, sourceQueue);
  }

  function removeFromQueue(id: string) {
    setUserQueue((uq) => uq.filter((t) => t.id !== id));
    setSourceQueue((sq) => sq.filter((t) => t.id !== id));
  }

  function addToQueue(t: Track) {
    setUserQueue((uq) => {
      const withoutTrack = uq.filter((x) => x.id !== t.id);
      return [...withoutTrack, t];
    });
  }

  function clearQueue() {
    setUserQueue([]);
    setSourceQueue(current ? [current] : []);
  }

  function reorderQueue(startIndex: number, endIndex: number) {
    if (!current) return;
    const curIdx = sourceQueue.findIndex((x) => x.id === current.id);
    const remainingSource = curIdx >= 0 ? sourceQueue.slice(curIdx + 1) : sourceQueue;
    
    const combined = [...userQueue, ...remainingSource];
    const [removed] = combined.splice(startIndex, 1);
    combined.splice(endIndex, 0, removed);
    
    setUserQueue(combined);
    setSourceQueue([current]);
  }

  async function startRadio(catalog: Track[], userKey: string) {
    try {
      const { rankTracksForTaste } = await import("@/lib/listening-taste");
      const ranked = rankTracksForTaste(catalog, userKey);
      const top = ranked.slice(0, 50);
      if (top.length > 0) {
        setUserQueue([]);
        playInternal(top[0], top, true);
      }
    } catch (error) {
      console.error("Could not start radio", error);
    }
  }

  function setAudioEffect(key: keyof AudioEffects, value: number) {
    setEffects((prev) => ({ ...prev, [key]: value }));
  }

  function resetAudioEffects() {
    setEffects(defaultEffects);
  }

  return (
    <Ctx.Provider
      value={{
        current,
        queue,
        userQueue,
        sourceQueue,
        isPlaying,
        progress,
        duration,
        volume,
        effects,
        shuffle,
        repeat,
        ytVideoVisible,
        pairedTvCode,
        setPairedTvCode,
        play,
        toggle,
        next,
        prev,
        seek,
        setVolume: (value) => {
          const v = Math.max(0, Math.min(3, value));
          setVol(v);
          if (pairedTvCode && pairedTvCode.length === 6) {
            sendRemoteCommand("set-volume", null, { volume: v });
          }
        },
        setAudioEffect,
        resetAudioEffects,
        toggleShuffle: () => setShuffle((s) => !s),
        toggleRepeat: () => setRepeat((r) => !r),
        jumpTo,
        removeFromQueue,
        addToQueue,
        clearQueue,
        reorderQueue,
        startRadio,
        setYTVideoVisible,
        audioRef,
      }}
    >
      {children}
      <audio ref={audioRef} src={current?.audio} preload="auto" crossOrigin="anonymous" />
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer outside PlayerProvider");
  return c;
}
