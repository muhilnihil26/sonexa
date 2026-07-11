import { Clock3, Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/player-store";

function formatTime(now: Date | null) {
  if (!now) return "--:--";
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(now: Date | null) {
  if (!now) return "Sonexa time";
  return now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function MusicClock({ compact = false }: { compact?: boolean }) {
  const { isPlaying, current } = usePlayer();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const seconds = now?.getSeconds() ?? 0;
  const minutes = now?.getMinutes() ?? 0;
  const hours = now ? now.getHours() % 12 : 0;
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  if (compact) {
    return (
      <div
        className={`hidden xl:flex items-center gap-2 rounded-xl border border-border bg-background/40 px-2.5 py-2 text-xs shadow-card ${isPlaying ? "music-clock-live" : ""}`}
      >
        <ClockFace hourDeg={hourDeg} minuteDeg={minuteDeg} secondDeg={secondDeg} small />
        <div className="min-w-14">
          <div className="tabular-nums font-semibold leading-none">{formatTime(now)}</div>
          <div className="mt-1 truncate text-[10px] text-muted-foreground">
            {current ? "On beat" : "Ready"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-card/55 p-4 shadow-card backdrop-blur-xl ${isPlaying ? "music-clock-live" : ""}`}
    >
      <div className="absolute inset-0 bg-glow opacity-45 animate-gradient-pan" />
      <div className="relative flex items-center gap-4">
        <ClockFace hourDeg={hourDeg} minuteDeg={minuteDeg} secondDeg={secondDeg} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
            <Music2 className="h-3.5 w-3.5" />
            Music clock
          </div>
          <div className="mt-1 tabular-nums text-3xl font-black tracking-normal">
            {formatTime(now)}
          </div>
          <div className="mt-1 truncate text-sm text-muted-foreground">{formatDate(now)}</div>
          <div className="mt-3 flex h-7 items-end gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
              <span
                key={bar}
                className={`music-clock-bar w-1.5 rounded-full bg-brand-gradient ${isPlaying ? "" : "opacity-45"}`}
                style={{ animationDelay: `${bar * 0.12}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockFace({
  hourDeg,
  minuteDeg,
  secondDeg,
  small = false,
}: {
  hourDeg: number;
  minuteDeg: number;
  secondDeg: number;
  small?: boolean;
}) {
  const size = small ? "h-11 w-11" : "h-24 w-24";
  return (
    <div
      className={`music-clock-face relative shrink-0 rounded-full border border-primary/35 bg-background/55 ${size}`}
    >
      <span className="absolute left-1/2 top-1 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
      <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-muted-foreground/60" />
      <span className="absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-muted-foreground/60" />
      <span
        className="music-clock-hand absolute left-1/2 top-1/2 rounded-full bg-foreground/85"
        style={{
          height: small ? "13px" : "25px",
          width: small ? "2px" : "3px",
          transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`,
        }}
      />
      <span
        className="music-clock-hand absolute left-1/2 top-1/2 rounded-full bg-primary"
        style={{
          height: small ? "17px" : "34px",
          width: small ? "2px" : "3px",
          transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
        }}
      />
      <span
        className="music-clock-hand absolute left-1/2 top-1/2 rounded-full bg-accent"
        style={{
          height: small ? "19px" : "39px",
          width: "1px",
          transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
        }}
      />
      <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gradient shadow-glow" />
      <Music2
        className={`music-clock-note absolute text-primary ${small ? "right-0 top-0 h-3 w-3" : "right-2 top-2 h-4 w-4"}`}
      />
    </div>
  );
}
