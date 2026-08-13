import { useState, useEffect } from "react";
import { Flag, ToggleLeft, ToggleRight } from "lucide-react";
import { getFeatureConfig, setFeatureFlag } from "@/lib/feature-config";

export function IndependenceAdminControls() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getFeatureConfig().independenceFeaturesEnabled);
  }, []);

  const toggle = () => {
    const next = !enabled;
    setFeatureFlag("independenceFeaturesEnabled", next);
    setEnabled(next);
  };

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15">
            <Flag className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Independence Day Controls</h4>
            <p className="text-xs text-muted-foreground">Toggle all Independence Day features</p>
          </div>
        </div>

        <button onClick={toggle} className="flex items-center gap-2 transition-colors">
          {enabled ? (
            <ToggleRight className="h-8 w-8 text-green-500" />
          ) : (
            <ToggleLeft className="h-8 w-8 text-muted-foreground" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${enabled ? "text-green-500" : "text-muted-foreground"}`}>
            {enabled ? "Active" : "Off"}
          </span>
        </button>
      </div>
    </div>
  );
}