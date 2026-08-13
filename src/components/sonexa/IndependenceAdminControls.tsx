import { useState } from "react";
import { Settings, ToggleLeft, ToggleRight, Flag, Music, Radio, Award, Bell } from "lucide-react";

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
}

export function IndependenceAdminControls() {
  const [features, setFeatures] = useState<FeatureToggle[]>([
    {
      id: "flag-hoisting",
      name: "Flag Hoisting Feature",
      description: "Enable interactive flag hoisting ceremony",
      enabled: true,
      icon: Flag
    },
    {
      id: "independence-music",
      name: "Independence Music Playlist",
      description: "Show patriotic songs in music player",
      enabled: true,
      icon: Music
    },
    {
      id: "live-podcast",
      name: "Live Podcast (15 Aug Only)",
      description: "Enable live podcast on Independence Day",
      enabled: true,
      icon: Radio
    },
    {
      id: "certificate-system",
      name: "Certificate System",
      description: "Allow users to generate certificates",
      enabled: true,
      icon: Award
    },
    {
      id: "notifications",
      name: "Independence Notifications",
      description: "Send patriotic notifications to users",
      enabled: false,
      icon: Bell
    }
  ]);

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ));
  };

  const saveSettings = () => {
    // In a real app, this would save to backend
    alert("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Independence Day Admin Controls
          </h3>
          <p className="text-muted-foreground mt-1">Toggle Independence Day features on/off</p>
        </div>
        <button
          onClick={saveSettings}
          className="px-6 py-2 rounded-xl bg-primary text-background font-semibold hover:bg-primary/90 transition-colors"
        >
          Save Settings
        </button>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur hover:bg-card transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${feature.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{feature.name}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeature(feature.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    feature.enabled 
                      ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                      : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                  }`}
                >
                  {feature.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-white/5 to-green-500/10 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground">Feature Status</h4>
            <p className="text-sm text-muted-foreground">
              {features.filter(f => f.enabled).length} of {features.length} features enabled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="p-4 rounded-xl border border-border bg-card/40 hover:bg-card transition-colors text-left">
          <div className="flex items-center gap-3 mb-2">
            <Flag className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-foreground">Enable All</span>
          </div>
          <p className="text-sm text-muted-foreground">Turn on all Independence features</p>
        </button>
        <button className="p-4 rounded-xl border border-border bg-card/40 hover:bg-card transition-colors text-left">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Disable All</span>
          </div>
          <p className="text-sm text-muted-foreground">Turn off all Independence features</p>
        </button>
      </div>
    </div>
  );
}