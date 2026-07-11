import { createFileRoute } from "@tanstack/react-router";
import {
  MonitorSmartphone,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
  Volume1,
  Volume2,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { usePlayer } from "@/lib/player-store";
import {
  usePairedTvCode,
  useRemoteSender,
  useTvAutoCastEnabled,
  useTvRemoteCode,
} from "@/lib/tv-remote";

export const Route = createFileRoute("/_authenticated/remote")({
  component: RemotePage,
});

function RemotePage() {
  const { code, resetCode } = useTvRemoteCode();
  const { pairCode, setPairCode } = usePairedTvCode();
  const { enabled: autoCast, setEnabled: setAutoCast } = useTvAutoCastEnabled();
  const { send, normalizedCode } = useRemoteSender(pairCode);
  const { current, isPlaying } = usePlayer();

  async function fire(action: Parameters<typeof send>[0], sendCurrent = false) {
    try {
      await send(action, sendCurrent ? current : null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remote command failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <section className="rounded-2xl border border-border bg-card/60 p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <MonitorSmartphone className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">
              Sonexa Remote
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Open this page on TV to show the code, then enter it on your phone to control
              playback. When paired, the song you start on the phone will also start on the TV.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-background/70 px-5 py-4 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">TV code</div>
            <div className="mt-1 font-mono text-4xl font-black tracking-[0.22em] text-primary">
              {code || "------"}
            </div>
            <button
              onClick={resetCode}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <RotateCw className="h-3.5 w-3.5" />
              New code
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <label className="text-sm font-medium text-foreground" htmlFor="pair-code">
            Phone control code
          </label>
          <input
            id="pair-code"
            inputMode="numeric"
            value={pairCode}
            onChange={(event) => setPairCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter TV code"
            className="mt-3 h-12 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-xl tracking-[0.2em] outline-none focus:border-primary"
          />
          <div className="mt-3 text-xs text-muted-foreground">
            Connected target: {normalizedCode.length === 6 ? normalizedCode : "waiting for code"}
          </div>
          <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm">
            <span>Auto play phone songs on TV</span>
            <input
              type="checkbox"
              checked={autoCast}
              onChange={(event) => setAutoCast(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
          </label>
          <button
            onClick={() => fire("play-track", true)}
            disabled={!current}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play className="h-4 w-4 fill-current" />
            Play this phone song on TV
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="mb-4 min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Now playing
            </div>
            <div className="mt-1 truncate text-lg font-semibold">
              {current ? current.title : "No song selected"}
            </div>
            <div className="truncate text-sm text-muted-foreground">
              {current ? current.artist : "Start a song on the TV first"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <RemoteButton label="Back 10" onClick={() => fire("seek-back")}>
              <StepBack className="h-5 w-5" />
            </RemoteButton>
            <RemoteButton label="Previous" onClick={() => fire("prev")}>
              <SkipBack className="h-5 w-5" />
            </RemoteButton>
            <RemoteButton label="Forward 10" onClick={() => fire("seek-forward")}>
              <StepForward className="h-5 w-5" />
            </RemoteButton>
            <RemoteButton label="Volume down" onClick={() => fire("volume-down")}>
              <Volume1 className="h-5 w-5" />
            </RemoteButton>
            <button
              onClick={() => fire("toggle")}
              className="flex h-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow transition hover:scale-[1.02]"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 fill-current" />
              ) : (
                <Play className="h-7 w-7 fill-current" />
              )}
            </button>
            <RemoteButton label="Volume up" onClick={() => fire("volume-up")}>
              <Volume2 className="h-5 w-5" />
            </RemoteButton>
            <div />
            <RemoteButton label="Next" onClick={() => fire("next")}>
              <SkipForward className="h-5 w-5" />
            </RemoteButton>
            <div />
          </div>
        </div>
      </section>
    </div>
  );
}

function RemoteButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-background/70 text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      {children}
      <span className="text-[11px]">{label}</span>
    </button>
  );
}
