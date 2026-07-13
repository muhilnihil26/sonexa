import { useState } from "react";
import { Settings, Music, Volume2, Zap } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { toast } from "sonner";

interface AudioSettingsProps {
  onClose?: () => void;
}

export function AudioSettings({ onClose }: AudioSettingsProps) {
  const { volume, setVolume } = usePlayer();
  const [audioQuality, setAudioQuality] = useState<"low" | "medium" | "high">("high");
  const [crossfade, setCrossfade] = useState(0);
  const [normalizeAudio, setNormalizeAudio] = useState(true);
  const [gaplessPlayback, setGaplessPlayback] = useState(true);

  const handleSave = () => {
    localStorage.setItem("sonexa.audioQuality", audioQuality);
    localStorage.setItem("sonexa.crossfade", String(crossfade));
    localStorage.setItem("sonexa.normalizeAudio", String(normalizeAudio));
    localStorage.setItem("sonexa.gaplessPlayback", String(gaplessPlayback));
    toast.success("Audio settings saved");
    onClose?.();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Audio Settings</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        )}
      </div>

      {/* Audio Quality */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-muted-foreground" />
          <label className="font-medium">Audio Quality</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((quality) => (
            <button
              key={quality}
              onClick={() => setAudioQuality(quality)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                audioQuality === quality
                  ? "bg-primary text-background"
                  : "bg-background/60 hover:bg-background"
              }`}
            >
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {audioQuality === "low" && "96 kbps - Saves data"}
          {audioQuality === "medium" && "160 kbps - Balanced"}
          {audioQuality === "high" && "320 kbps - Best quality"}
        </p>
      </div>

      {/* Crossfade */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <label className="font-medium">Crossfade</label>
          <span className="text-xs text-muted-foreground ml-auto">{crossfade}s</span>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={1}
          value={crossfade}
          onChange={(e) => setCrossfade(Number(e.target.value))}
          className="w-full accent-[var(--color-primary)] h-2"
        />
        <p className="text-xs text-muted-foreground">
          Smooth transition between songs
        </p>
      </div>

      {/* Volume Normalization */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <label className="font-medium">Volume Normalization</label>
        </div>
        <button
          onClick={() => setNormalizeAudio(!normalizeAudio)}
          className={`w-12 h-6 rounded-full transition ${
            normalizeAudio ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              normalizeAudio ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Gapless Playback */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-muted-foreground" />
          <label className="font-medium">Gapless Playback</label>
        </div>
        <button
          onClick={() => setGaplessPlayback(!gaplessPlayback)}
          className={`w-12 h-6 rounded-full transition ${
            gaplessPlayback ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              gaplessPlayback ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-primary text-background font-bold hover:bg-primary/90 transition"
      >
        Save Settings
      </button>
    </div>
  );
}
