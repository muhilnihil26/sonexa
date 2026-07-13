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
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10 animate-gradient-shift" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center animate-scale-in">
            <Music className="h-12 w-12 sm:h-16 sm:w-16 text-white animate-bounce-slow" />
          </div>
          {/* Orbiting particles */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            <div className="absolute right-0 top-1/2 translate-x-2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight animate-fade-up">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Sonexa
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Listen Beyond
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 sm:w-64 space-y-2 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{phase === "loading" ? "Loading..." : "Ready!"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Floating icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 animate-float" style={{ animationDelay: '0s' }}>
            <Headphones className="h-8 w-8 text-primary/30" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-float" style={{ animationDelay: '0.5s' }}>
            <Sparkles className="h-6 w-6 text-purple-500/30" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-float" style={{ animationDelay: '1s' }}>
            <Play className="h-7 w-7 text-pink-500/30" />
          </div>
          <div className="absolute bottom-1/4 right-1/3 animate-float" style={{ animationDelay: '1.5s' }}>
            <Music className="h-6 w-6 text-primary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
