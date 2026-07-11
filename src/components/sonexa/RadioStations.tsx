import { useState } from "react";
import { Radio, Play, Heart, Plus, Sparkles, Flame, Music2, Clock, TrendingUp, X } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface Station {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  basedOn: "song" | "artist" | "genre" | "mood";
}

const STATIONS: Station[] = [
  {
    id: "daily-mix",
    name: "Daily Mix",
    description: "Based on your recent listening",
    icon: <Sparkles className="h-6 w-6" />,
    color: "from-purple-500 to-pink-500",
    basedOn: "song",
  },
  {
    id: "discover-weekly",
    name: "Discover Weekly",
    description: "New music picked for you",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "from-green-500 to-teal-500",
    basedOn: "song",
  },
  {
    id: "release-radar",
    name: "Release Radar",
    description: "New releases from artists you follow",
    icon: <Radio className="h-6 w-6" />,
    color: "from-blue-500 to-indigo-500",
    basedOn: "artist",
  },
  {
    id: "chill-vibes",
    name: "Chill Vibes",
    description: "Relaxing music for any mood",
    icon: <Music2 className="h-6 w-6" />,
    color: "from-cyan-500 to-blue-500",
    basedOn: "mood",
  },
  {
    id: "party-mix",
    name: "Party Mix",
    description: "High-energy tracks to get you moving",
    icon: <Flame className="h-6 w-6" />,
    color: "from-orange-500 to-red-500",
    basedOn: "mood",
  },
  {
    id: "focus-flow",
    name: "Focus Flow",
    description: "Music to help you concentrate",
    icon: <Clock className="h-6 w-6" />,
    color: "from-yellow-500 to-orange-500",
    basedOn: "mood",
  },
];

interface CustomStation {
  id: string;
  name: string;
  seedTrack?: string;
  seedArtist?: string;
  seedGenre?: string;
}

export function RadioStations() {
  const { current, startRadio } = usePlayer();
  const { user } = useSession();
  const [customStations, setCustomStations] = useState<CustomStation[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const createStation = (type: "song" | "artist" | "genre", seed: string) => {
    const newStation: CustomStation = {
      id: `custom-${Date.now()}`,
      name: `Custom ${type} Station`,
      [type === "song" ? "seedTrack" : type === "artist" ? "seedArtist" : "seedGenre"]: seed,
    };
    setCustomStations([...customStations, newStation]);
    setShowCreateForm(false);
    notifySuccess(`Created ${newStation.name}`);
  };

  const playStation = async (station: Station | CustomStation) => {
    if (!user) {
      toast.error("Sign in to play radio stations");
      return;
    }

    setSelectedStation(station.id);
    
    try {
      // In a real implementation, this would fetch tracks based on the station
      // For now, we'll use the existing startRadio function with a mock catalog
      const mockCatalog = current ? [current] : [];
      await startRadio(mockCatalog, user.email || user.id || "default");
      notifySuccess(`Playing ${station.name}`);
    } catch (error) {
      console.error("Failed to play station:", error);
      notifyError("Could not play radio station");
      setSelectedStation(null);
    }
  };

  const deleteCustomStation = (stationId: string) => {
    setCustomStations(customStations.filter(s => s.id !== stationId));
    notifySuccess("Station deleted");
  };

  return (
    <div className="space-y-6">
      {/* Predefined Stations */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Radio className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Radio Stations</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STATIONS.map((station) => (
            <button
              key={station.id}
              onClick={() => playStation(station)}
              disabled={selectedStation === station.id}
              className="group relative aspect-square rounded-xl overflow-hidden transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${station.color} opacity-80`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
              <div className="relative h-full flex flex-col items-center justify-center p-4 text-white">
                <div className="mb-3">{station.icon}</div>
                <div className="text-lg font-bold text-center">{station.name}</div>
                <div className="text-xs text-center opacity-80 mt-1">{station.description}</div>
              </div>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {selectedStation === station.id ? (
                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur animate-spin" />
                ) : (
                  <Play className="h-8 w-8 text-white drop-shadow-md" />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Custom Stations */}
      {customStations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Your Stations</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {customStations.map((station) => (
              <button
                key={station.id}
                onClick={() => playStation(station)}
                disabled={selectedStation === station.id}
                className="group relative aspect-square rounded-xl overflow-hidden transition hover:scale-105 bg-card/40 border border-border/30 disabled:opacity-50 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20" />
                <div className="relative h-full flex flex-col items-center justify-center p-4">
                  <Radio className="h-8 w-8 text-primary mb-2" />
                  <div className="text-sm font-bold text-center">{station.name}</div>
                  {station.seedTrack && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Based on: {station.seedTrack}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {selectedStation === station.id ? (
                    <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur animate-spin" />
                  ) : (
                    <Play className="h-6 w-6 text-primary drop-shadow-md" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomStation(station.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/60 hover:bg-background/80 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Create Custom Station */}
      <section>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card/40 hover:bg-card transition border border-border/30 w-full"
        >
          <Plus className="h-5 w-5 text-primary" />
          <span className="font-semibold">Create Custom Station</span>
        </button>

        {showCreateForm && (
          <div className="mt-4 p-4 rounded-xl bg-card/40 border border-border/30 space-y-3">
            <h4 className="font-semibold">Create station based on:</h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => createStation("song", "current song")}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/60 hover:bg-card transition text-left"
              >
                <Music2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Current Song</div>
                  <div className="text-xs text-muted-foreground">Create station based on what's playing</div>
                </div>
              </button>
              <button
                onClick={() => createStation("artist", "favorite artist")}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/60 hover:bg-card transition text-left"
              >
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <div className="font-semibold">Favorite Artist</div>
                  <div className="text-xs text-muted-foreground">Create station based on your top artist</div>
                </div>
              </button>
              <button
                onClick={() => createStation("genre", "tamil cinema")}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/60 hover:bg-card transition text-left"
              >
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="font-semibold">Genre</div>
                  <div className="text-xs text-muted-foreground">Create station based on a music genre</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
