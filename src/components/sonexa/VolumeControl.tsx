import { Volume2, Volume1, VolumeX } from "lucide-react";
import { useState } from "react";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function VolumeControl({ volume, onVolumeChange, className = "" }: VolumeControlProps) {
  const [showSlider, setShowSlider] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(3, newVolume));
    onVolumeChange(clampedVolume);
    setIsMuted(clampedVolume === 0);
    if (clampedVolume > 0) {
      setPreviousVolume(clampedVolume);
    }
  };

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      handleVolumeChange(previousVolume > 0 ? previousVolume : 1);
    } else {
      setPreviousVolume(volume);
      handleVolumeChange(0);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0 || isMuted) return <VolumeX className="h-4 w-4" />;
    if (volume < 1) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  const getVolumeColor = () => {
    const percentage = (volume / 3) * 100;
    if (percentage < 30) return "text-destructive";
    if (percentage < 70) return "text-yellow-400";
    return "text-primary";
  };

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleMute}
        className={`transition hover:scale-110 ${getVolumeColor()}`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {getVolumeIcon()}
      </button>
      
      <div className="relative group">
        <input
          type="range"
          min={0}
          max={3}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="w-20 accent-[var(--color-primary)] h-1 cursor-pointer"
          onMouseEnter={() => setShowSlider(true)}
          onMouseLeave={() => setShowSlider(false)}
        />
        
        {/* Volume level indicator */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-2 py-1 rounded bg-background border border-border text-xs font-medium">
            {Math.round((isMuted ? 0 : volume) / 3 * 100)}%
          </div>
        </div>

        {/* Visual volume bars */}
        <div className="absolute -bottom-4 left-0 right-0 flex items-end gap-0.5 h-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {[...Array(10)].map((_, i) => {
            const threshold = (i + 1) / 10;
            const isActive = (isMuted ? 0 : volume) / 3 >= threshold;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all ${
                  isActive ? "bg-primary" : "bg-border"
                }`}
                style={{ height: `${(i + 1) * 20}%` }}
              />
            );
          })}
        </div>
      </div>
      
      <span className="w-9 text-[10px] text-muted-foreground tabular-nums">
        {Math.round((isMuted ? 0 : volume) / 3 * 100)}%
      </span>
    </div>
  );
}
