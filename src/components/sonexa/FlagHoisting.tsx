import { useState, useEffect, useRef } from "react";
import { ChevronUp, RefreshCw, Music } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { FlagHoistingCertificate } from "./FlagHoistingCertificate";

export function FlagHoisting() {
  const { play } = usePlayer();
  const [height, setHeight] = useState(0); // 0 to 100
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);
  const [isHoisted, setIsHoisted] = useState(false);
  const petalIdRef = useRef(0);

  const pullRope = () => {
    if (height >= 100) return;
    setHeight((prev) => {
      const next = prev + 10;
      if (next >= 100) {
        setIsHoisted(true);
        triggerPetalShower();
        // Play national anthem
        play({
          id: "ind-1",
          title: "Jana Gana Mana",
          artist: "Rabindranath Tagore",
          cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop",
          audio: "",
          kind: "youtube",
          ytId: "vp1HVg_J1Xg"
        });
        return 100;
      }
      return next;
    });
  };

  const triggerPetalShower = () => {
    const newPetals = Array.from({ length: 40 }).map(() => {
      petalIdRef.current++;
      const colors = ["#FF9933", "#FAFAFA", "#138808", "#FFD700", "#FF69B4"];
      return {
        id: petalIdRef.current,
        left: Math.random() * 80 + 10, // 10% to 90%
        delay: Math.random() * 3, // delay up to 3s
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });
    setPetals(newPetals);
  };

  const reset = () => {
    setHeight(0);
    setIsHoisted(false);
    setPetals([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          🇮🇳 Interactive Flag Hoisting Ceremony
        </h3>
        <p className="text-muted-foreground mt-1">
          Pull the rope step-by-step to hoist the Indian National Flag. Unfurl the flag at the top to receive your Certificate of Honour.
        </p>
      </div>

      {/* Flag Mast Area */}
      <div className="relative w-full h-[450px] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-green-700/80 shadow-2xl border border-white/10">
        {/* Sun */}
        <div className="absolute top-12 right-12 w-20 h-20 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-[0_0_50px_rgba(251,191,36,0.6)] animate-pulse" />

        {/* Clouds */}
        <div className="absolute top-20 left-10 w-24 h-8 bg-white/40 rounded-full blur-sm" />
        <div className="absolute top-28 right-1/3 w-36 h-10 bg-white/30 rounded-full blur-sm" />

        {/* Flag Pole */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-4 h-[350px] bg-gradient-to-r from-gray-500 via-gray-300 to-gray-400 rounded-t shadow-lg" />

        {/* Rope */}
        <div 
          className="absolute left-[calc(50%-10px)] w-0.5 h-[350px] bg-amber-900/60"
          style={{ bottom: "16px" }}
        />
        <div 
          className="absolute left-[calc(50%+8px)] w-0.5 h-[350px] bg-amber-900/60"
          style={{ bottom: "16px" }}
        />

        {/* The Flag */}
        <div
          className="absolute left-1/2 w-44 h-28 shadow-2xl flex flex-col transition-all duration-300 ease-out"
          style={{
            bottom: `${16 + (height / 100) * 280}px`,
            transform: "translateX(2px)",
            animation: height === 100 ? "flagFlutter 3s ease-in-out infinite" : "none",
          }}
        >
          {/* Saffron */}
          <div className="h-1/3 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 w-full" />
          {/* White */}
          <div className="h-1/3 bg-gradient-to-r from-white via-gray-100 to-white w-full flex items-center justify-center relative">
            <svg width="28" height="28" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#000080" strokeWidth="3" />
              <circle cx="50" cy="50" r="8" fill="#000080" />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 40 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={50 + 40 * Math.sin((i * 15 * Math.PI) / 180)}
                  stroke="#000080"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>
          {/* Green */}
          <div className="h-1/3 bg-gradient-to-r from-green-500 via-green-400 to-green-500 w-full" />

          {/* Folds shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent pointer-events-none" />
        </div>

        {/* Ground pedestal */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-xl flex flex-col items-center justify-center shadow-lg border-t border-white/20">
          <div className="w-24 h-4 bg-gray-400 rounded-t-md" />
          <div className="w-20 h-4 bg-gray-500 rounded-t-md" />
        </div>

        {/* Petals shower overlay */}
        {petals.map((p) => (
          <div
            key={p.id}
            className="absolute w-2 h-4 rounded-full pointer-events-none animate-petal-fall"
            style={{
              left: `${p.left}%`,
              top: "-20px",
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Unfurled flower shower particles from flag */}
        {isHoisted && (
          <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-48 h-10 pointer-events-none flex justify-center">
            <span className="text-xs font-black text-amber-300 drop-shadow-glow animate-bounce">
              🌺 JAI HIND 🌺
            </span>
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3">
          {height < 100 ? (
            <button
              onClick={pullRope}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white font-bold hover:scale-105 transition active:scale-95 shadow-glow"
            >
              <ChevronUp className="h-5 w-5" /> Pull Hoisting Rope ({height}%)
            </button>
          ) : (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-semibold transition"
            >
              <RefreshCw className="h-4 w-4" /> Reset Ceremony
            </button>
          )}

          {isHoisted && (
            <button
              onClick={() => {
                play({
                  id: "ind-1",
                  title: "Jana Gana Mana",
                  artist: "Rabindranath Tagore",
                  cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop",
                  audio: "",
                  kind: "youtube",
                  ytId: "vp1HVg_J1Xg"
                });
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
            >
              <Music className="h-4 w-4" /> Play Anthem
            </button>
          )}
        </div>
      </div>

      {/* Certificate generation available after hoisting */}
      {isHoisted && (
        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 animate-fade-up">
          <FlagHoistingCertificate />
        </div>
      )}

      <style>{`
        @keyframes flagFlutter {
          0%, 100% { transform: scaleY(1) rotate(0deg); }
          50% { transform: scaleY(0.96) rotate(1deg) skewX(2deg); }
        }
        @keyframes petalFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(480px) rotate(360deg); opacity: 0; }
        }
        .animate-petal-fall {
          animation: petalFall 4s linear infinite;
        }
      `}</style>
    </div>
  );
}