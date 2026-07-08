import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  ChevronDown,
  ListMusic,
  X,
  Heart,
  Mic2,
  Share2,
  MessageCircle,
  Eye,
  Send,
  SlidersHorizontal,
  Bluetooth,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { usePlayer } from "@/lib/player-store";
import { fetchLyrics, type LyricsResult } from "@/lib/lyrics";
import { useSession } from "@/lib/auth";
import { addSongComment, getSongSocial, toggleSongLike } from "@/lib/api/social.functions";
import { toast } from "sonner";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function FullScreenPlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = usePlayer();
  const isYouTube = p.current?.kind === "youtube";
  // Default to lyrics panel — users explicitly asked for visible lyrics.
  const { user } = useSession();
  const qc = useQueryClient();
  const getSocial = useServerFn(getSongSocial);
  const likeSong = useServerFn(toggleSongLike);
  const addComment = useServerFn(addSongComment);
  const [panel, setPanel] = useState<"none" | "queue" | "lyrics" | "comments" | "sound">("lyrics");
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [comment, setComment] = useState("");
  const socialQuery = useQuery({
    queryKey: ["song-social", p.current?.id],
    queryFn: () => getSocial({ data: { trackId: p.current!.id } }),
    enabled: !!p.current,
    refetchOnWindowFocus: false,
  });

  // Auto-open lyrics if it's the first time opening player or if lyrics are found
  useEffect(() => {
    if (open && panel === "lyrics") {
      // Prioritize lyrics panel on open
    }
  }, [open]);

  useEffect(() => {
    if (!open || !p.current) return;
    let cancelled = false;
    setLyricsLoading(true);
    setLyrics(null);
    fetchLyrics(p.current.title, p.current.artist).then((r) => {
      if (!cancelled) {
        setLyrics(r);
        setLyricsLoading(false);
        // Auto-open lyrics panel if found
        if (r && r.status === "found") {
          setPanel("lyrics");
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, p.current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    p.setYTVideoVisible(open && p.current?.kind === "youtube");
    return () => p.setYTVideoVisible(false);
  }, [open, p.current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !p.current) return null;
  const social = socialQuery.data;
  const shareUrl = `${window.location.origin}/song/${encodeURIComponent(p.current.id)}`;

  async function shareCurrent() {
    if (!p.current) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: p.current.title,
          text: `${p.current.title} - ${p.current.artist}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Song link copied");
      }
    } catch {
      /* user cancelled native share */
    }
  }

  async function likeCurrent() {
    if (!p.current) return;
    if (!user) return toast.error("Sign in to like shared songs");
    const key = ["song-social", p.current.id];
    const previous = qc.getQueryData<typeof socialQuery.data>(key);
    qc.setQueryData<typeof socialQuery.data>(key, (old) => {
      if (!old) return old;
      return {
        ...old,
        stats: {
          ...old.stats,
          likeCount: Math.max(0, old.stats.likeCount + 1),
        },
      };
    });
    try {
      const result = await likeSong({ data: { trackId: p.current.id } });
      toast.success(result.liked ? "Added to likes" : "Removed from likes");
      qc.setQueryData<typeof socialQuery.data>(key, (old) => {
        if (!old) return old;
        return { ...old, stats: { ...old.stats, likeCount: result.likeCount } };
      });
      await qc.invalidateQueries({ queryKey: key });
    } catch (error) {
      qc.setQueryData(key, previous);
      toast.error(error instanceof Error ? error.message : "Could not update like");
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!p.current || !comment.trim()) return;
    if (!user) return toast.error("Sign in to comment");
    try {
      await addComment({
        data: {
          trackId: p.current.id,
          body: comment,
          userName: user.displayName || user.email?.split("@")[0] || "Listener",
        },
      });
      setComment("");
      toast.success("Comment added");
      await qc.invalidateQueries({ queryKey: ["song-social", p.current.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add comment");
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[80] animate-page-in ${
        isYouTube ? "bg-transparent text-white" : "bg-background"
      }`}
    >
      {!isYouTube && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
          style={{ backgroundImage: `url(${p.current.cover})` }}
        />
      )}
      <div
        className={
          isYouTube
            ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.82)_0%,rgba(0,0,0,.18)_34%,rgba(0,0,0,.2)_56%,rgba(0,0,0,.86)_100%)]"
            : "absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"
        }
      />
      {p.isPlaying && !isYouTube && (
        <div className="absolute inset-0 bg-glow opacity-40 animate-gradient-pan" />
      )}

      <div className="relative flex h-dvh flex-col overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 hover:bg-card/60 transition backdrop-blur"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
          <div
            className={`text-xs uppercase tracking-[0.3em] ${
              isYouTube ? "text-white/75" : "text-muted-foreground"
            }`}
          >
            Now Playing
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPanel((s) => (s === "lyrics" ? "none" : "lyrics"))}
              className={`p-2 rounded-full bg-black/20 hover:bg-card/60 transition backdrop-blur ${panel === "lyrics" ? "text-primary" : ""}`}
              title="Lyrics"
            >
              <Mic2 className="h-6 w-6" />
            </button>
            <button
              onClick={() => setPanel((s) => (s === "queue" ? "none" : "queue"))}
              className={`p-2 rounded-full bg-black/20 hover:bg-card/60 transition backdrop-blur ${panel === "queue" ? "text-primary" : ""}`}
              title="Queue"
            >
              <ListMusic className="h-6 w-6" />
            </button>
            <button
              onClick={() => setPanel((s) => (s === "comments" ? "none" : "comments"))}
              className={`p-2 rounded-full bg-black/20 hover:bg-card/60 transition backdrop-blur ${panel === "comments" ? "text-primary" : ""}`}
              title="Comments"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
            <button
              onClick={() => setPanel((s) => (s === "sound" ? "none" : "sound"))}
              className={`p-2 rounded-full bg-black/20 hover:bg-card/60 transition backdrop-blur ${panel === "sound" ? "text-primary" : ""}`}
              title="Sound"
            >
              <SlidersHorizontal className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div
          className={`flex-1 min-h-0 flex flex-col lg:flex-row items-center gap-6 px-4 sm:px-6 pb-6 overflow-y-auto lg:overflow-hidden ${
            isYouTube ? "justify-end lg:justify-between" : "justify-center lg:gap-10"
          }`}
        >
          <div
            className={`flex-1 flex flex-col items-center w-full ${
              isYouTube
                ? "max-w-3xl justify-end rounded-2xl border border-white/10 bg-black/45 p-4 sm:p-5 shadow-2xl backdrop-blur-xl"
                : "max-w-md justify-center"
            }`}
          >
            {isYouTube ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Sonexa video mode
              </div>
            ) : (
              <img
                src={p.current.cover}
                alt={p.current.title}
                className={`aspect-square w-full max-w-sm rounded-2xl object-cover shadow-glow animate-img-in ${p.isPlaying ? "animate-cover-float" : ""}`}
              />
            )}
            <div className={`${isYouTube ? "mt-1" : "mt-8"} text-center w-full`}>
              <div className="mx-auto max-w-full overflow-hidden">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                  <span className={p.current.title.length > 22 ? "song-title-marquee" : ""}>
                    <span>{p.current.title}</span>
                    {p.current.title.length > 22 && (
                      <span aria-hidden="true">{p.current.title}</span>
                    )}
                  </span>
                </h2>
              </div>
              <p className={isYouTube ? "mt-1 text-white/70" : "text-muted-foreground mt-1"}>
                {p.current.artist}
              </p>
            </div>
            <div
              className={`w-full mt-6 flex items-center gap-3 text-[11px] ${
                isYouTube ? "text-white/70" : "text-muted-foreground"
              }`}
            >
              <span>{fmt(p.progress)}</span>
              <input
                type="range"
                min={0}
                max={p.duration || 0}
                step={0.1}
                value={p.progress}
                onChange={(e) => p.seek(Number(e.target.value))}
                className="flex-1 accent-[var(--color-primary)] h-1"
              />
              <span>{fmt(p.duration)}</span>
            </div>
            <div className="mt-6 flex items-center gap-6">
              <button
                onClick={p.toggleShuffle}
                className={`transition ${p.shuffle ? "text-primary" : "text-white/70 hover:text-white"}`}
              >
                <Shuffle className="h-5 w-5" />
              </button>
              <button onClick={p.prev} className="text-white/80 hover:text-white">
                <SkipBack className="h-7 w-7" />
              </button>
              <button
                onClick={p.toggle}
                className={`h-16 w-16 rounded-full bg-white shadow-glow flex items-center justify-center hover:scale-105 transition ${p.isPlaying ? "animate-play-pulse" : ""}`}
              >
                {p.isPlaying ? (
                  <Pause className="h-7 w-7 fill-black text-black" />
                ) : (
                  <Play className="h-7 w-7 fill-black text-black ml-1" />
                )}
              </button>
              <button onClick={p.next} className="text-white/80 hover:text-white">
                <SkipForward className="h-7 w-7" />
              </button>
              <button
                onClick={p.toggleRepeat}
                className={`transition ${p.repeat ? "text-primary" : "text-white/70 hover:text-white"}`}
              >
                <Repeat className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex items-center gap-3 w-full max-w-xs">
              <Volume2
                className={`h-4 w-4 ${isYouTube ? "text-white/70" : "text-muted-foreground"}`}
              />
              <input
                type="range"
                min={0}
                max={isYouTube ? 1 : 3}
                step={0.01}
                value={isYouTube ? Math.min(1, p.volume) : p.volume}
                onChange={(e) => p.setVolume(Number(e.target.value))}
                className="flex-1 accent-[var(--color-primary)] h-1"
              />
              <span
                className={`w-10 text-right text-[11px] ${isYouTube ? "text-white/70" : "text-muted-foreground"}`}
              >
                {Math.round((isYouTube ? Math.min(1, p.volume) : p.volume) * 100)}%
              </span>
              <Heart
                className={`h-4 w-4 ${isYouTube ? "text-white/70" : "text-muted-foreground"}`}
              />
            </div>
            {p.pairedTvCode && p.pairedTvCode.length === 6 && (
              <div className="mt-4 flex items-center justify-between gap-3 w-full max-w-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-400 font-semibold shadow-sm backdrop-blur-md animate-fade-up">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Playing on TV ({p.pairedTvCode})
                </div>
                <button
                  onClick={() => p.setPairedTvCode("")}
                  className="rounded-lg bg-emerald-500 text-background px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-400 transition"
                >
                  Disconnect
                </button>
              </div>
            )}
            <div
              className={`mt-5 flex flex-wrap items-center justify-center gap-2 text-xs ${
                isYouTube ? "text-white/75" : "text-muted-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-card/70 px-3 py-1.5 backdrop-blur">
                <Eye className="h-3.5 w-3.5" /> {social?.stats.viewCount ?? 0}
              </span>
              <button
                onClick={likeCurrent}
                className="inline-flex items-center gap-1 rounded-full bg-card/70 px-3 py-1.5 hover:text-foreground backdrop-blur"
              >
                <Heart className="h-3.5 w-3.5" /> {social?.stats.likeCount ?? 0}
              </button>
              <button
                onClick={shareCurrent}
                className="inline-flex items-center gap-1 rounded-full bg-card/70 px-3 py-1.5 hover:text-foreground backdrop-blur"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>

          {panel === "queue" && (
            <div className="w-full shrink-0 lg:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-card/70 backdrop-blur-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold">Up Next</div>
                <button
                  onClick={p.clearQueue}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear custom queue
                </button>
              </div>

              <div className="mb-4">
                <ul className="space-y-1">
                  {(() => {
                    const curIdx = p.current ? p.sourceQueue.findIndex((x) => x.id === p.current!.id) : -1;
                    const remainingSource = curIdx >= 0 ? p.sourceQueue.slice(curIdx + 1) : p.sourceQueue;
                    const upcoming = [...p.userQueue, ...remainingSource];
                    
                    if (upcoming.length === 0) {
                      return <li className="text-xs text-muted-foreground p-2">Queue is empty.</li>;
                    }

                    return upcoming.map((t, idx) => (
                      <li
                        key={`${t.id}-${idx}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", idx.toString());
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("bg-primary/20");
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove("bg-primary/20");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("bg-primary/20");
                          const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                          if (!isNaN(fromIdx) && fromIdx !== idx) {
                            p.reorderQueue(fromIdx, idx);
                          }
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/55 transition group cursor-grab active:cursor-grabbing border border-transparent"
                      >
                        <div className="text-xs text-muted-foreground w-4 text-center cursor-grab shrink-0">
                          =
                        </div>
                        <button
                          onClick={() => p.jumpTo(t.id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <img src={t.cover} alt="" className="h-10 w-10 rounded object-cover" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {t.title}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
                          </div>
                        </button>
                        {idx < p.userQueue.length && (
                          <button
                            onClick={() => p.removeFromQueue(t.id)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-background/70 hover:text-foreground"
                            title="Remove from queue"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          )}

          {panel === "lyrics" && (
            <LyricsPanel lyrics={lyrics} loading={lyricsLoading} progress={p.progress} />
          )}

          {panel === "comments" && (
            <div className="w-full shrink-0 lg:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-card/70 backdrop-blur-xl border border-border p-4 animate-fade-up">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Comments
              </div>
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={user ? "Add a comment" : "Sign in to comment"}
                  disabled={!user}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm"
                />
                <button
                  disabled={!user || !comment.trim()}
                  className="grid h-10 w-10 place-items-center rounded-lg bg-brand-gradient text-background disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="mt-4 space-y-3">
                {(social?.comments ?? []).map((item) => (
                  <div key={item.id} className="rounded-lg bg-background/50 p-3">
                    <div className="text-xs font-semibold">{item.user_name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.body}</div>
                  </div>
                ))}
                {!socialQuery.isLoading && !social?.comments.length && (
                  <div className="text-sm text-muted-foreground">No comments yet.</div>
                )}
              </div>
            </div>
          )}

          {panel === "sound" && <SoundPanel isYouTube={isYouTube} />}
        </div>
      </div>
    </div>
  );
}

type BluetoothDeviceLike = {
  name?: string;
  gatt?: {
    connected?: boolean;
    connect: () => Promise<unknown>;
  };
};

type NavigatorWithBluetooth = Navigator & {
  bluetooth?: {
    requestDevice: (options: {
      acceptAllDevices: boolean;
      optionalServices?: string[];
    }) => Promise<BluetoothDeviceLike>;
  };
};

function SoundPanel({ isYouTube }: { isYouTube: boolean }) {
  const p = usePlayer();
  const [deviceName, setDeviceName] = useState("");
  const [audioRoute, setAudioRoute] = useState("");
  const [connecting, setConnecting] = useState(false);
  const bluetoothSupported =
    typeof navigator !== "undefined" && !!(navigator as NavigatorWithBluetooth).bluetooth;

  async function connectBluetooth() {
    const bluetooth = (navigator as NavigatorWithBluetooth).bluetooth;
    if (!bluetooth) {
      toast.error("Bluetooth device selection is not supported in this browser");
      return;
    }
    setConnecting(true);
    try {
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information"],
      });
      await device.gatt?.connect();
      setDeviceName(device.name || "Bluetooth device");
      toast.success(`Connected to ${device.name || "Bluetooth device"}`);
    } catch (error) {
      if (error instanceof Error && error.name !== "NotFoundError") {
        toast.error(error.message);
      }
    } finally {
      setConnecting(false);
    }
  }

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const output = devices.find(
          (device) =>
            device.kind === "audiooutput" &&
            /bluetooth|headset|speaker|buds|airpods/i.test(device.label),
        );
        if (output?.label) setAudioRoute(output.label);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="w-full shrink-0 lg:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-card/70 backdrop-blur-xl border border-border p-4 animate-fade-up">
      <div className="text-sm font-semibold mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" /> Sound
      </div>
      {isYouTube && (
        <div className="mb-4 rounded-lg border border-border bg-background/45 p-3 text-xs text-muted-foreground">
          YouTube audio runs inside its protected video player, so bass and echo cannot be applied
          to it. App volume still works.
        </div>
      )}
      <div className={isYouTube ? "pointer-events-none opacity-45" : "space-y-4"}>
        <EffectSlider
          label="Volume boost"
          value={p.volume}
          min={0}
          max={3}
          step={0.01}
          suffix="%"
          formatValue={(value) => `${Math.round(value * 100)}%`}
          onChange={(value) => p.setVolume(value)}
        />
        <EffectSlider
          label="Bass"
          value={p.effects.bass}
          min={-12}
          max={12}
          step={1}
          suffix="dB"
          onChange={(value) => p.setAudioEffect("bass", value)}
        />
        <EffectSlider
          label="Treble"
          value={p.effects.treble}
          min={-12}
          max={12}
          step={1}
          suffix="dB"
          onChange={(value) => p.setAudioEffect("treble", value)}
        />
        <EffectSlider
          label="Echo"
          value={p.effects.echo}
          min={0}
          max={0.6}
          step={0.05}
          suffix=""
          onChange={(value) => p.setAudioEffect("echo", value)}
        />
        <button
          onClick={p.resetAudioEffects}
          className="rounded-lg border border-border bg-background/50 px-3 py-2 text-xs font-semibold hover:bg-background"
        >
          Reset effects
        </button>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Bluetooth className="h-4 w-4 text-primary" /> Bluetooth
        </div>
        <p className="text-xs text-muted-foreground">
          Web apps can request compatible Bluetooth devices, but speaker/headphone audio routing is
          controlled by your phone or computer.
        </p>
        <div className="mt-2 rounded-lg bg-background/45 px-3 py-2 text-xs text-muted-foreground">
          Current route: {deviceName || audioRoute || "System audio output"}
        </div>
        <button
          onClick={connectBluetooth}
          disabled={!bluetoothSupported || connecting}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          <Bluetooth className="h-4 w-4" />
          {connecting ? "Connecting..." : deviceName || "Connect device"}
        </button>
      </div>
    </div>
  );
}

function EffectSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  formatValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">
          {formatValue ? formatValue(value) : suffix ? `${value}${suffix}` : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--color-primary)]"
      />
    </label>
  );
}

function LyricsPanel({
  lyrics,
  loading,
  progress,
}: {
  lyrics: LyricsResult | null;
  loading: boolean;
  progress: number;
}) {
  const activeIdx = useMemo(() => {
    if (!lyrics || lyrics.status !== "found" || !lyrics.synced) return -1;
    let i = 0;
    for (; i < lyrics.synced.length; i++) if (lyrics.synced[i].time > progress) break;
    return Math.max(0, i - 1);
  }, [lyrics, progress]);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-lline="${activeIdx}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIdx]);

  return (
    <div
      className="w-full shrink-0 lg:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-card/70 backdrop-blur-xl border border-border p-4 animate-fade-up"
      ref={ref}
    >
      <div className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Mic2 className="h-4 w-4 text-primary" /> Lyrics
      </div>
      {loading && <div className="text-xs text-muted-foreground">Looking up lyrics…</div>}
      {!loading && lyrics?.status === "not_found" && (
        <div className="text-sm text-muted-foreground">
          Lyrics not found for this track on lrclib.net. Try another song.
        </div>
      )}
      {!loading && lyrics?.status === "error" && (
        <div className="text-sm text-destructive">Couldn't load lyrics ({lyrics.message}).</div>
      )}
      {!loading && lyrics?.status === "found" && lyrics.synced && (
        <div className="space-y-3 leading-relaxed">
          {lyrics.synced.map((l, i) => (
            <div
              key={i}
              data-lline={i}
              className={`text-base transition-all duration-200 ${
                i === activeIdx
                  ? "text-lg font-bold text-primary scale-105"
                  : "text-muted-foreground"
              }`}
            >
              {l.text || "♪"}
            </div>
          ))}
        </div>
      )}
      {!loading && lyrics?.status === "found" && !lyrics.synced && (
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
          {lyrics.plain}
        </pre>
      )}
    </div>
  );
}
