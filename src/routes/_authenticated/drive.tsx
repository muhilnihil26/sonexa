import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePlayer } from "@/lib/player-store";
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, Car } from "lucide-react";
import { useEffect, useRef } from "react";
import { useHolidayTheme } from "@/hooks/useHolidayTheme";

export const Route = createFileRoute("/_authenticated/drive")({
  head: () => ({ meta: [{ title: "Driving Mode - Sonexa" }] }),
  component: DriveMode,
});

function DriveMode() {
  const p = usePlayer();
  const navigate = useNavigate();
  useHolidayTheme();

  const handleBack = () => {
    navigate({ to: "/" });
  };

  if (!p.current) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-black p-6">
        <Car className="mb-4 h-16 w-16 text-primary" />
        <h1 className="text-2xl font-bold text-white">Driving Mode</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Play some music first to use Driving Mode.
        </p>
        <button
          onClick={handleBack}
          className="mt-8 rounded-full bg-primary px-8 py-4 text-xl font-bold text-primary-foreground"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-black text-white p-6 justify-between select-none overflow-hidden">
      {/* Background Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-[100px] scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${p.current.cover})` }}
      />

      <div className="relative z-10 flex items-center justify-between mt-4">
        <button onClick={handleBack} className="p-4 rounded-full bg-white/10 active:bg-white/30">
          <ChevronLeft className="h-10 w-10" />
        </button>
        <div className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full font-bold uppercase tracking-wider">
          <Car className="h-5 w-5" /> Driving Mode
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 mt-10">
        <div className="relative aspect-square w-full max-w-[40vh] overflow-hidden rounded-3xl shadow-2xl">
          <img src={p.current.cover} alt="Cover" className="h-full w-full object-cover" />
        </div>

        <div className="text-center w-full px-4">
          <h1 className="text-4xl sm:text-5xl font-black truncate">{p.current.title}</h1>
          <h2 className="text-2xl sm:text-3xl text-primary mt-2 truncate opacity-80">{p.current.artist}</h2>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-6 pb-12 w-full mt-auto">
        <button
          onClick={() => p.prev()}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 active:bg-white/30"
        >
          <SkipBack className="h-12 w-12" />
        </button>
        
        <button
          onClick={() => p.toggle()}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-primary active:scale-95 transition-transform text-primary-foreground"
        >
          {p.isPlaying ? <Pause className="h-16 w-16 fill-current" /> : <Play className="h-16 w-16 fill-current ml-2" />}
        </button>
        
        <button
          onClick={() => p.next()}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 active:bg-white/30"
        >
          <SkipForward className="h-12 w-12" />
        </button>
      </div>
    </div>
  );
}
