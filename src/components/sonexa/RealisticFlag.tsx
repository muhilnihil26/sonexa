import { isIndependenceEnabled } from "@/lib/feature-config";

export function RealisticFlag({ className = "" }: { className?: string }) {
  if (!isIndependenceEnabled()) return null;

  return (
    <div className={`relative select-none ${className}`}>
      <div
        style={{
          transform: "rotate(-12deg) perspective(400px) rotateY(5deg)",
          width: "180px",
          filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))",
          animation: "flagWave 4s ease-in-out infinite",
        }}
      >
        {/* Saffron */}
        <div
          style={{
            height: "28px",
            background: "linear-gradient(90deg, #FF9933 0%, #FF8811 50%, #FF9933 100%)",
            borderRadius: "2px 2px 0 0",
          }}
        />
        {/* White + Chakra */}
        <div
          style={{
            height: "28px",
            background: "linear-gradient(90deg, #FAFAFA 0%, #F0F0F0 50%, #FAFAFA 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 100 100">
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
        <div
          style={{
            height: "28px",
            background: "linear-gradient(90deg, #138808 0%, #0F7A05 50%, #138808 100%)",
            borderRadius: "0 0 2px 2px",
          }}
        />
        {/* Cloth folds overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.04) 30px, rgba(0,0,0,0.04) 32px)",
            pointerEvents: "none",
          }}
        />
      </div>

      <style>{`
        @keyframes flagWave {
          0%, 100% { transform: rotate(-12deg) perspective(400px) rotateY(5deg) scaleX(1); }
          50% { transform: rotate(-12deg) perspective(400px) rotateY(5deg) scaleX(0.97); }
        }
      `}</style>
    </div>
  );
}