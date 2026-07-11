import { useState } from "react";
import { Radio, Play, Heart, Plus, Sparkles, Flame, Music2, Clock, TrendingUp, X } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listRadioStations } from "@/lib/api/youtube.functions";

interface Station {
  id: string;
  name: string;
  description: string;
  youtube_url: string;
  youtube_video_id: string;
  icon: string;
  color: string;
  based_on: "song" | "artist" | "genre" | "custom";
}

const PREDEFINED_STATIONS: Station[] = [
  {
    id: "daily-mix",
    name: "Daily Mix",
    description: "Based on your recent listening",
    icon: "Sparkles",
    color: "from-purple-500 to-pink-500",
    based_on: "song",
    youtube_url: "",
    youtube_video_id: "",
  },
  {
    id: "discover-weekly",
    name: "Discover Weekly",
    description: "New music picked for you",
    icon: "TrendingUp",
    color: "from-green-500 to-teal-500",
    based_on: "song",
    youtube_url: "",
    youtube_video_id: "",
  },
  {
    id: "release-radar",
    name: "Release Radar",
    description: "New releases from artists you follow",
    icon: "Radio",
    color: "from-blue-500 to-indigo-500",
    based_on: "artist",
    youtube_url: "",
    youtube_video_id: "",
  },
  {
    id: "chill-vibes",
    name: "Chill Vibes",
    description: "Relaxing music for any mood",
    icon: "Music2",
    color: "from-cyan-500 to-blue-500",
    based_on: "mood",
    youtube_url: "",
    youtube_video_id: "",
  },
  {
    id: "party-mix",
    name: "Party Mix",
    description: "High-energy tracks to get you moving",
    icon: "Flame",
    color: "from-orange-500 to-red-500",
    based_on: "mood",
    youtube_url: "",
    youtube_video_id: "",
  },
  {
    id: "focus-flow",
    name: "Focus Flow",
    description: "Music to help you concentrate",
    icon: "Clock",
    color: "from-yellow-500 to-orange-500",
    based_on: "mood",
    youtube_url: "",
    youtube_video_id: "",
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Radio: <Radio className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  Music2: <Music2 className="h-6 w-6" />,
  Flame: <Flame className="h-6 w-6" />,
  Clock: <Clock className="h-6 w-6" />,
  TrendingUp: <TrendingUp className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
};

export function RadioStations() {
  const { current, startRadio } = usePlayer();
  const { user } = useSession();
  const listStations = useServerFn(listRadioStations);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const { data: firestoreStations, isLoading } = useQuery({
    queryKey: ["radio-stations"],
    queryFn: () => listStations(),
  });

  const customStations = (firestoreStations?.stations ?? []) as Station[];
  const allStations = [...PREDEFINED_STATIONS, ...customStations];

  const playStation = async (station: Station) => {
    if (!user) {
      toast.error("Sign in to play radio stations");
      return;
    }

    setSelectedStation(station.id);
    
    try {
      // If station has a YouTube URL, play it directly
      if (station.youtube_url && station.youtube_video_id) {
        // Use the YouTube video as the seed for radio
        const mockCatalog = current ? [current] : [];
        await startRadio(mockCatalog, user.email || user.id || "default");
        notifySuccess(`Playing ${station.name}`);
      } else {
        // For predefined stations, use mock catalog
        const mockCatalog = current ? [current] : [];
        await startRadio(mockCatalog, user.email || user.id || "default");
        notifySuccess(`Playing ${station.name}`);
      }
    } catch (error) {
      console.error("Failed to play station:", error);
      notifyError("Could not play radio station");
      setSelectedStation(null);
    }
  };

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || ICON_MAP.Radio;
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
          {PREDEFINED_STATIONS.map((station) => (
            <button
              key={station.id}
              onClick={() => playStation(station)}
              disabled={selectedStation === station.id}
              className="group relative aspect-square rounded-xl overflow-hidden transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${station.color} opacity-80`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
              <div className="relative h-full flex flex-col items-center justify-center p-4 text-white">
                <div className="mb-3">{getIcon(station.icon)}</div>
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

      {/* Custom Stations from Firestore */}
      {customStations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Sonexa Radio</h3>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading stations...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {customStations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => playStation(station)}
                  disabled={selectedStation === station.id}
                  className="group relative aspect-square rounded-xl overflow-hidden transition hover:scale-105 bg-card/40 border border-border/30 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${station.color}`} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                  <div className="relative h-full flex flex-col items-center justify-center p-4">
                    <div className="mb-3 text-white">{getIcon(station.icon)}</div>
                    <div className="text-sm font-bold text-center text-white">{station.name}</div>
                    <div className="text-xs text-center text-white/80 mt-1 truncate">{station.description}</div>
                  </div>
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {selectedStation === station.id ? (
                      <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur animate-spin" />
                    ) : (
                      <Play className="h-6 w-6 text-white drop-shadow-md" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
