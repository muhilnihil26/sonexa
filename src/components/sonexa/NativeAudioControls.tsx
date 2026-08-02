import { Volume2, VolumeX, Zap, Music2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getAudioProcessor, getVisualizerBars, detectAudioMood, type AudioAnalytics } from "@/lib/audio-processor";

/**
 * Native audio controls with Web Audio API
 * Provides equalizer, visualization, and audio masking
 */
export function NativeAudioControls({ audioElement }: { audioElement: HTMLAudioElement | null }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [analytics, setAnalytics] = useState<AudioAnalytics | null>(null);
  const [mood, setMood] = useState("Balanced");
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const processorRef = useRef(getAudioProcessor());
  const eqRef = useRef<any>(null);

  useEffect(() => {
    if (!audioElement) return;

    const processor = processorRef.current;
    const initialized = processor.initialize(audioElement);

    if (initialized) {
      processor.resume();
      setIsInitialized(true);

      // Setup equalizer
      const eq = processor.createEqualizer();
      if (eq) {
        eqRef.current = eq;
      }

      // Start audio monitoring
      processor.startMonitoring((data) => {
        setAnalytics(data);
        if (data && showVisualizer) {
          setMood(detectAudioMood(data));
        }
      });

      return () => {
        processor.stopMonitoring();
      };
    }
  }, [audioElement, showVisualizer]);

  const updateEqualizer = (type: "bass" | "mid" | "treble", value: number) => {
    if (!eqRef.current) return;

    const eq = eqRef.current;
    const gainValue = (value / 50 - 1) * 15; // Range: -15 to +15 dB

    if (type === "bass") {
      eq.bass.gain.value = gainValue;
      setBass(value);
    } else if (type === "mid") {
      eq.mid.gain.value = gainValue;
      setMid(value);
    } else if (type === "treble") {
      eq.treble.gain.value = gainValue;
      setTreble(value);
    }
  };

  const bars = analytics ? getVisualizerBars(analytics, 20) : Array(20).fill(0);

  if (!isInitialized || !analytics) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <Music2 className="h-4 w-4 mx-auto mb-2 animate-pulse" />
        Initializing audio...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg bg-background/40 border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Audio Controls
        </h3>
        <button
          onClick={() => setShowVisualizer(!showVisualizer)}
          className={`px-3 py-1 rounded text-xs font-medium transition ${
            showVisualizer
              ? "bg-primary text-background"
              : "bg-background/60 text-muted-foreground hover:bg-background"
          }`}
        >
          {showVisualizer ? "Visualizer ON" : "Visualizer OFF"}
        </button>
      </div>

      {/* Audio Visualizer */}
      {showVisualizer && (
        <div className="flex items-end justify-center gap-1 h-20 bg-black/30 p-2 rounded-lg">
          {bars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 bg-brand-gradient rounded-t transition-all duration-75"
              style={{ height: `${bar * 100}%` }}
            />
          ))}
        </div>
      )}

      {/* Audio Mood */}
      <div className="text-xs text-muted-foreground">
        <span className="inline-block px-2 py-1 rounded-full bg-primary/20 text-primary">
          {mood}
        </span>
      </div>

      {/* Equalizer Controls */}
      <div className="space-y-3">
        {/* Bass */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">Bass</label>
            <span className="text-xs text-muted-foreground">{bass - 50}dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={bass}
            onChange={(e) => updateEqualizer("bass", parseInt(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Mid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">Mid</label>
            <span className="text-xs text-muted-foreground">{mid - 50}dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={mid}
            onChange={(e) => updateEqualizer("mid", parseInt(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Treble */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">Treble</label>
            <span className="text-xs text-muted-foreground">{treble - 50}dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={treble}
            onChange={(e) => updateEqualizer("treble", parseInt(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      {/* Audio Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 rounded bg-background/60 text-center">
          <div className="text-muted-foreground">Bass</div>
          <div className="font-semibold text-primary">{(analytics.bass * 100).toFixed(0)}%</div>
        </div>
        <div className="p-2 rounded bg-background/60 text-center">
          <div className="text-muted-foreground">Mid</div>
          <div className="font-semibold text-primary">{(analytics.mid * 100).toFixed(0)}%</div>
        </div>
        <div className="p-2 rounded bg-background/60 text-center">
          <div className="text-muted-foreground">Treble</div>
          <div className="font-semibold text-primary">{(analytics.treble * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}
