import { useEffect, useState } from "react";
import { Sparkles, Music4 } from "lucide-react";

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "fading">("loading");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase("ready");
          setTimeout(() => {
            setPhase("fading");
            setTimeout(onComplete, 800);
          }, 800);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ease-in-out ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden opacity-50">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[140px] animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[160px] animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/30 blur-2xl animate-pulse rounded-full" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_0_80px_rgba(var(--primary),0.5)] animate-scale-in">
            <Music4 className="h-14 w-14 text-white animate-bounce-slow" />
          </div>

          {/* Orbiting Sparkles */}
          <div className="absolute inset-0 animate-spin-slow pointer-events-none">
            <Sparkles className="absolute -top-4 left-1/2 h-6 w-6 -translate-x-1/2 text-pink-400 drop-shadow-glow" />
            <Sparkles className="absolute -bottom-4 left-1/2 h-5 w-5 -translate-x-1/2 text-purple-400 drop-shadow-glow" />
            <Sparkles className="absolute left-0 top-1/2 h-4 w-4 -translate-x-4 -translate-y-1/2 text-primary drop-shadow-glow" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white animate-fade-up bg-[length:200%_auto] animate-progress-shine drop-shadow-2xl mb-2">
          SONEXA
        </h1>
        <p
          className="text-lg sm:text-xl font-medium tracking-[0.2em] text-white/60 animate-fade-up uppercase"
          style={{ animationDelay: "0.2s" }}
        >
          Listen Beyond Limits
        </p>

        {/* Fancy Progress Indicator */}
        <div className="mt-16 w-64 sm:w-80 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-md">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(var(--primary),0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between text-xs font-bold tracking-widest text-white/50 uppercase">
            <span
              className={`transition-opacity duration-300 ${
                phase === "ready" ? "text-primary opacity-100" : "opacity-70"
              }`}
            >
              {phase === "ready" ? "System Ready" : "Initializing"}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
