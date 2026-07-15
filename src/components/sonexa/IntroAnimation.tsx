import { useEffect, useState } from "react";
import { Music, Sparkles, Headphones, Play } from "lucide-react";

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase("ready");
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + Math.random() * 25;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-900/10 to-pink-900/5 animate-gradient-shift" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary to-purple-900 flex items-center justify-center animate-scale-in shadow-2xl shadow-primary/50">
            <Music className="h-16 w-16 sm:h-20 sm:w-20 text-white animate-bounce-slow" />
          </div>
          {/* Orbiting particles */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" style={{ animationDelay: '0.2s' }} />
            <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-3 h-3 bg-pink-500 rounded-full animate-pulse shadow-lg shadow-pink-500/50" style={{ animationDelay: '0.4s' }} />
            <div className="absolute right-0 top-1/2 translate-x-2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight animate-fade-up">
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              Sonexa
            </span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Listen Beyond
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 sm:w-64 space-y-2 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple-400 to-pink-400 transition-all duration-200 ease-out shadow-lg shadow-primary/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>{phase === "loading" ? "Loading..." : "Ready!"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Floating icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 animate-float" style={{ animationDelay: '0s' }}>
            <Headphones className="h-8 w-8 text-primary/20" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-float" style={{ animationDelay: '0.3s' }}>
            <Sparkles className="h-6 w-6 text-purple-400/20" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-float" style={{ animationDelay: '0.6s' }}>
            <Play className="h-7 w-7 text-pink-400/20" />
          </div>
          <div className="absolute bottom-1/4 right-1/3 animate-float" style={{ animationDelay: '0.9s' }}>
            <Music className="h-6 w-6 text-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
