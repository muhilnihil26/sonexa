import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { firebaseDb } from "@/integrations/firebase/client";
import { useSession } from "@/lib/auth";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/player-store";

type RemoteCommand = {
  id: string;
  action:
    | "toggle"
    | "next"
    | "prev"
    | "volume-up"
    | "volume-down"
    | "seek-forward"
    | "seek-back"
    | "play-track"
    | "seek-to"
    | "set-volume";
  track?: Track;
  seekTime?: number;
  volume?: number;
};

const CODE_KEY = "sonexa.tvRemote.code.v1";
const PAIR_KEY = "sonexa.tvRemote.pairedCode.v1";
const AUTO_CAST_KEY = "sonexa.tvRemote.autoCast.v1";
const DISMISSED_TV_KEY = "sonexa.tvRemote.dismissedTv.v1";

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function useTvRemoteCode() {
  const [code, setCode] = useState("");

  useEffect(() => {
    let nextCode = window.localStorage.getItem(CODE_KEY);
    if (!nextCode) {
      nextCode = createCode();
      window.localStorage.setItem(CODE_KEY, nextCode);
    }
    setCode(nextCode);
  }, []);

  const resetCode = () => {
    const nextCode = createCode();
    window.localStorage.setItem(CODE_KEY, nextCode);
    setCode(nextCode);
  };

  return { code, resetCode };
}

export function TvRemoteReceiver() {
  const { session } = useSession();
  const { code } = useTvRemoteCode();
  const { current, isPlaying, play, toggle, next, prev, seek, progress, volume, setVolume } =
    usePlayer();
  const initializedCommandRef = useRef(false);

  useEffect(() => {
    if (!session?.user || !code) return;
    const ref = doc(firebaseDb, "sonexa_remote_sessions", code);

    const publish = () =>
      setDoc(
        ref,
        {
          code,
          owner: session.user.email ?? session.user.id,
          owner_uid: session.user.id,
          active: true,
          device: "tv",
          deviceName: getDeviceName("TV"),
          userAgent: navigator.userAgent,
          nowPlaying: current
            ? {
                id: current.id,
                title: current.title,
                artist: current.artist,
                cover: current.cover,
                isPlaying,
              }
            : null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ).catch(() => undefined);

    publish();
    const interval = window.setInterval(publish, 20_000);
    return () => window.clearInterval(interval);
  }, [code, current, isPlaying, session?.user]);

  useEffect(() => {
    if (!session?.user || !code) return;
    return () => {
      setDoc(
        doc(firebaseDb, "sonexa_remote_sessions", code),
        { active: false, updatedAt: serverTimestamp() },
        { merge: true },
      ).catch(() => undefined);
    };
  }, [code, session?.user]);

  useEffect(() => {
    if (!session?.user || !code) return;
    const ref = doc(firebaseDb, "sonexa_remote_sessions", code);
    return onSnapshot(
      ref,
      (snapshot) => {
        const command = snapshot.data()?.command as RemoteCommand | undefined;
        const seenKey = `sonexa.tvRemote.seen.${code}`;
        if (!initializedCommandRef.current) {
          initializedCommandRef.current = true;
          if (command?.id) window.sessionStorage.setItem(seenKey, command.id);
          return;
        }
        if (!command?.id) return;
        if (window.sessionStorage.getItem(seenKey) === command.id) return;
        window.sessionStorage.setItem(seenKey, command.id);

                if (command.action === "play-track" && command.track) play(command.track, [command.track]);
        else if (command.action === "toggle") toggle();
        else if (command.action === "next") next();
        else if (command.action === "prev") prev();
        else if (command.action === "volume-up") setVolume(Math.min(3, volume + 0.08));
        else if (command.action === "volume-down") setVolume(Math.max(0, volume - 0.08));
        else if (command.action === "seek-forward") seek(progress + 10);
        else if (command.action === "seek-back") seek(Math.max(0, progress - 10));
        else if (command.action === "seek-to" && typeof command.seekTime === "number") seek(command.seekTime);
        else if (command.action === "set-volume" && typeof command.volume === "number") setVolume(command.volume);
      },
      () => undefined,
    );
  }, [code, next, play, prev, progress, seek, session?.user, setVolume, toggle, volume]);

  return null;
}

type RemoteSessionDoc = {
  code?: string;
  active?: boolean;
  device?: string;
  deviceName?: string;
  updatedAt?: { toDate?: () => Date; seconds?: number };
  nowPlaying?: {
    title?: string;
    artist?: string;
    cover?: string;
    isPlaying?: boolean;
  } | null;
};

function getDeviceName(fallback: string) {
  const ua = navigator.userAgent;
  if (/android tv|googletv|smart-tv|smarttv/i.test(ua)) return "Living room TV";
  if (/android/i.test(ua)) return "Android device";
  if (/windows/i.test(ua)) return "Windows device";
  if (/iphone/i.test(ua)) return "iPhone";
  return fallback;
}

function isFreshSession(session: RemoteSessionDoc) {
  const updatedAt = session.updatedAt;
  const date =
    typeof updatedAt?.toDate === "function"
      ? updatedAt.toDate()
      : typeof updatedAt?.seconds === "number"
        ? new Date(updatedAt.seconds * 1000)
        : null;
  return !date || Date.now() - date.getTime() < 90_000;
}

function shouldShowPhoneDiscovery() {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem("sonexa.tvRemote.dontShowDiscoveryAgain") === "true") return false;
  
  // Check Network Information API (mostly Chrome/Android) to avoid prompting on cellular data
  if ("connection" in navigator) {
    const conn = (navigator as any).connection;
    if (conn && conn.type && conn.type !== "wifi" && conn.type !== "unknown" && conn.type !== "none") {
      return false; // User is likely on cellular, not on the same local network
    }
  }

  const ua = navigator.userAgent.toLowerCase();
  const tv = /\b(tv|smart-tv|smarttv|googletv|appletv|hbbtv|netcast|tizen|webos)\b/.test(ua);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 900px)").matches;
  return !tv && coarse && narrow;
}

export function TvWifiConnectPrompt() {
  const { session } = useSession();
  const { current } = usePlayer();
  const { pairCode, setPairCode } = usePairedTvCode();
  const [candidate, setCandidate] = useState<RemoteSessionDoc | null>(null);
  const [visible, setVisible] = useState(false);
  const { send } = useRemoteSender(candidate?.code ?? "");

  useEffect(() => {
    if (!session?.user || !shouldShowPhoneDiscovery()) return;
    const q = query(
      collection(firebaseDb, "sonexa_remote_sessions"),
      where("owner_uid", "==", session.user.id),
      where("device", "==", "tv"),
      where("active", "==", true),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const dismissed = window.localStorage.getItem(DISMISSED_TV_KEY);
        const found = snapshot.docs
          .map((item) => item.data() as RemoteSessionDoc)
          .find(
            (item) =>
              item.code &&
              item.code !== pairCode &&
              item.code !== dismissed &&
              isFreshSession(item),
          );
        setCandidate(found ?? null);
        setVisible(Boolean(found));
      },
      () => undefined,
    );
  }, [pairCode, session?.user]);

  if (!visible || !candidate?.code) return null;

  const connect = async () => {
    setPairCode(candidate.code ?? "");
    setVisible(false);
    toast.success("Connected to TV");
    if (current) {
      await send("play-track", current).catch(() => undefined);
    }
  };

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_TV_KEY, candidate.code ?? "");
    setVisible(false);
  };

  const dontShowAgain = () => {
    window.localStorage.setItem("sonexa.tvRemote.dontShowDiscoveryAgain", "true");
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-28 z-50 mx-auto max-w-md rounded-2xl border border-emerald-300/30 bg-zinc-950/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur md:bottom-24">
      <div className="text-sm font-semibold">Connect to {candidate.deviceName ?? "Sonexa TV"}?</div>
      <p className="mt-1 text-xs leading-5 text-white/60">
        A TV is active with Sonexa. Connect over WiFi-style remote playback and play phone songs
        there automatically.
      </p>
      {candidate.nowPlaying?.title ? (
        <div className="mt-3 truncate rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70">
          TV now: {candidate.nowPlaying.title}
        </div>
      ) : null}
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={connect}
          className="w-full rounded-xl bg-emerald-400 px-3 py-2 text-sm font-bold text-black hover:bg-emerald-300 transition"
        >
          Connect
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5 transition"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={dontShowAgain}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5 transition"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePairedTvCode() {
  const { pairedTvCode, setPairedTvCode } = usePlayer();
  return { pairCode: pairedTvCode, setPairCode: setPairedTvCode };
}

export function useTvAutoCastEnabled() {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setEnabledState(window.localStorage.getItem(AUTO_CAST_KEY) !== "false");
  }, []);

  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    window.localStorage.setItem(AUTO_CAST_KEY, value ? "true" : "false");
  };

  return { enabled, setEnabled };
}

export function TvCastBridge() {
  const { pairCode } = usePairedTvCode();
  const { enabled } = useTvAutoCastEnabled();
  const { current, isPlaying } = usePlayer();
  const { send } = useRemoteSender(pairCode);
  const lastSentRef = useRef("");

  useEffect(() => {
    if (!enabled || !current || !isPlaying || pairCode.length !== 6) return;
    const signature = `${pairCode}:${current.id}`;
    if (lastSentRef.current === signature) return;
    lastSentRef.current = signature;
    send("play-track", current).catch(() => undefined);
  }, [current, enabled, isPlaying, pairCode, send]);

  return null;
}

export function useRemoteSender(pairCode: string) {
  const normalizedCode = useMemo(() => pairCode.replace(/\D/g, "").slice(0, 6), [pairCode]);

  async function send(action: RemoteCommand["action"], track?: Track | null) {
    if (normalizedCode.length !== 6) throw new Error("Enter the 6 digit TV code");
    await setDoc(
      doc(firebaseDb, "sonexa_remote_sessions", normalizedCode),
      {
        command: {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          action,
          ...(track ? { track } : {}),
        },
        controller: "phone",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return { send, normalizedCode };
}
