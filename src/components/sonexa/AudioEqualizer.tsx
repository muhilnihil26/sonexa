import { useState } from "react";
import { Sliders, Volume2, X, RotateCw } from "lucide-react";

interface EqualizerBand {
  frequency: string;
  label: string;
  value: number;
}

const EQUALIZER_BANDS: EqualizerBand[] = [
  { frequency: "60", label: "Bass", value: 0 },
  { frequency: "170", label: "Low-Mid", value: 0 },
  { frequency: "310", label: "Mid", value: 0 },
  { frequency: "600", label: "High-Mid", value: 0 },
  { frequency: "1000", label: "Treble", value: 0 },
];

const PRESETS = [
  { name: "Flat", values: [0, 0, 0, 0, 0] },
  { name: "Bass Boost", values: [6, 4, 0, -2, -2] },
  { name: "Vocal", values: [-2, -1, 2, 4, 3] },
  { name: "Rock", values: [5, 3, 0, -2, -1] },
  { name: "Electronic", values: [4, 3, 0, -1, 2] },
  { name: "Classical", values: [4, 2, 0, 2, 3] },
];

export function AudioEqualizer() {
  const [bands, setBands] = useState<EqualizerBand[]>(EQUALIZER_BANDS);
  const [crossfade, setCrossfade] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleBandChange = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index].value = value;
    setBands(newBands);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const newBands = bands.map((band, i) => ({
      ...band,
      value: preset.values[i],
    }));
    setBands(newBands);
  };

  const reset = () => {
    setBands(EQUALIZER_BANDS);
    setCrossfade(0);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/40 hover:bg-card transition border border-border/30"
      >
        <Sliders className="h-4 w-4" />
        <span className="text-sm">Equalizer</span>
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card/40 border border-border/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Audio Settings</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Equalizer Bands */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3">Equalizer</h4>
        <div className="flex items-end justify-between gap-2">
          {bands.map((band, index) => (
            <div key={band.frequency} className="flex-1 flex flex-col items-center">
              <input
                type="range"
                min="-12"
                max="12"
                value={band.value}
                onChange={(e) => handleBandChange(index, parseInt(e.target.value))}
                className="w-full h-24 appearance-none bg-border rounded-lg cursor-pointer"
                style={{
                  writingMode: "vertical-lr",
                  direction: "rtl",
                }}
              />
              <div className="text-xs text-center mt-2">
                <div className="font-semibold">{band.label}</div>
                <div className="text-muted-foreground">{band.frequency}Hz</div>
                <div className="text-primary font-bold">{band.value}dB</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3">Presets</h4>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-lg bg-card/60 hover:bg-card transition text-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Crossfade */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3">Crossfade</h4>
        <div className="flex items-center gap-4">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="12"
            value={crossfade}
            onChange={(e) => setCrossfade(parseInt(e.target.value))}
            className="flex-1 h-2 appearance-none bg-border rounded-lg cursor-pointer"
          />
          <span className="text-sm text-muted-foreground w-16 text-right">
            {crossfade}s
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Smooth transition between songs ({crossfade} seconds)
        </p>
      </div>

      {/* Reset Button */}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/60 hover:bg-card transition text-sm w-full justify-center"
      >
        <RotateCw className="h-4 w-4" />
        Reset to Default
      </button>
    </div>
  );
}
