import { useState } from "react";
import { Radio, Play, Heart, Plus, Sparkles, Flame, Music2, Clock, TrendingUp, X, Settings, Trash2, Palette } from "lucide-react";
import { type Track, usePlayer } from "@/lib/player-store";
import { useIsAdmin, useSession } from "@/lib/auth";
import { toast } from "sonner";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listRadioStations, listAdminYouTubeTracks, adminCreateRadioStation, adminDeleteRadioStation } from "@/lib/api/youtube.functions";

interface Station {
  id: string;
  name: string;
  description: string;
  youtube_url: string;
  youtube_video_id: string;
  icon: string;
  color: string;
  based_on: "song" | "artist" | "genre" | "custom" | "mood";
  seed_track?: string;
  seed_artist?: string;
  seed_genre?: string;
  created_by?: string;
  is_custom?: boolean;
}

type RadioCatalogRow = {
  video_id: string;
  title: string;
  channel?: string | null;
  thumbnail?: string | null;
  backup_url?: string | null;
  duration?: number;
};

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
  Settings: <Settings className="h-6 w-6" />,
  Palette: <Palette className="h-6 w-6" />,
};

const COLOR_OPTIONS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-indigo-500",
  "from-green-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-cyan-500 to-blue-500",
  "from-yellow-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
];

const ICON_OPTIONS = ["Radio", "Sparkles", "Music2", "Flame", "Clock", "TrendingUp", "Heart", "Settings", "Palette"];

const BASED_ON_OPTIONS = [
  { value: "custom", label: "Custom Mix" },
  { value: "song", label: "Based on Song" },
  { value: "artist", label: "Based on Artist" },
  { value: "genre", label: "Based on Genre" },
  { value: "mood", label: "Based on Mood" },
];

export function RadioStations() {
  const p = usePlayer();
  const { current, startRadio, queue } = p;
  const { user } = useSession();
  const isAdmin = useIsAdmin(user?.email);
  const queryClient = useQueryClient();
  const listStations = useServerFn(listRadioStations);
  const listTracks = useServerFn(listAdminYouTubeTracks);
  const createStation = useServerFn(adminCreateRadioStation);
  const deleteStation = useServerFn(adminDeleteRadioStation);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStation, setNewStation] = useState<{
    name: string;
    description: string;
    youtube_url: string;
    icon: string;
    color: string;
    based_on: "song" | "artist" | "genre" | "custom" | "mood";
  }>({
    name: "",
    description: "",
    youtube_url: "",
    icon: "Radio",
    color: "from-purple-500 to-pink-500",
    based_on: "custom",
  });

  const { data: firestoreStations, isLoading } = useQuery({
    queryKey: ["radio-stations"],
    queryFn: () => listStations(),
  });

  const { data: tracksData } = useQuery({
    queryKey: ["all-tracks"],
    queryFn: () => listTracks(),
    enabled: !!user,
  });

  const customStations = (firestoreStations?.stations ?? []) as Station[];
  const allStations = [...PREDEFINED_STATIONS, ...customStations];
  const allTracks = (tracksData?.tracks ?? []) as RadioCatalogRow[];

  const playStation = async (station: Station) => {
    if (!user) {
      toast.error("Sign in to play radio stations");
      return;
    }

    setSelectedStation(station.id);
    
    try {
      // For custom stations with YouTube URLs, create a track from the station data
      if (station.youtube_url && station.youtube_video_id) {
        const track: Track = {
          id: station.id,
          title: station.name,
          artist: station.description || "Unknown",
          cover: "",
          audio: "", // YouTube tracks don't need audio URL
          kind: "youtube",
          ytId: station.youtube_video_id,
        };
        
        // Use the player to play this track and start radio
        p.play(track);
        await startRadio([track], user.email || user.id || "default");
        notifySuccess(`Playing ${station.name}`);
        return;
      }
      
      // For predefined stations or stations without YouTube, use all available tracks as seed
      const seedTracks: Track[] = allTracks.length > 0 ? allTracks.map((t): Track => ({
        id: `yt_${t.video_id}`,
        title: t.title,
        artist: t.channel || "Unknown",
        cover: t.thumbnail || "",
        audio: t.backup_url || "",
        kind: t.backup_url ? "audio" : "youtube",
        ytId: t.video_id,
        duration: t.duration,
      })) : (current ? [current] : []);
      
      if (seedTracks.length === 0) {
        toast.error("No tracks available to start radio. Please add some songs first.");
        setSelectedStation(null);
        return;
      }
      
      // Shuffle the tracks for variety
      const shuffled = [...seedTracks].sort(() => Math.random() - 0.5);
      
      // Play first track and start radio with shuffled list
      p.play(shuffled[0], shuffled);
      await startRadio(shuffled, user.email || user.id || "default");
      notifySuccess(`Playing ${station.name}`);
    } catch (error) {
      console.error("Failed to play station:", error);
      notifyError("Could not play radio station");
      setSelectedStation(null);
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createStation({
        data: {
          name: newStation.name,
          description: newStation.description,
          youtubeUrl: newStation.youtube_url || undefined,
          icon: newStation.icon,
          color: newStation.color,
          basedOn: newStation.based_on,
          seedTrack: newStation.based_on === "song" ? current?.id || "" : undefined,
          seedArtist: newStation.based_on === "artist" ? current?.artist || "" : undefined,
          seedGenre: newStation.based_on === "genre" ? "pop" : undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["radio-stations"] });
      toast.success("Radio station created successfully");
      setShowCreateModal(false);
      setNewStation({
        name: "",
        description: "",
        youtube_url: "",
        icon: "Radio",
        color: "from-purple-500 to-pink-500",
        based_on: "custom" as const,
      });
    } catch (error) {
      toast.error("Failed to create radio station");
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    if (!confirm("Are you sure you want to delete this radio station?")) return;
    try {
      await deleteStation({ data: { stationId } });
      await queryClient.invalidateQueries({ queryKey: ["radio-stations"] });
      toast.success("Radio station deleted");
    } catch (error) {
      toast.error("Failed to delete radio station");
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
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Sonexa Radio</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs font-semibold hover:bg-background transition"
            >
              <Plus className="h-3.5 w-3.5" /> Create Station
            </button>
          )}
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading stations...</p>
        ) : customStations.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {customStations.map((station) => (
              <div key={station.id} className="group relative aspect-square rounded-xl overflow-hidden bg-card/40 border border-border/30">
                <button
                  onClick={() => playStation(station)}
                  disabled={selectedStation === station.id}
                  className="absolute inset-0 transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteStation(station.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete station"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <Radio className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No custom radio stations yet</p>
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-background"
              >
                <Plus className="h-3.5 w-3.5" /> Create Your First Station
              </button>
            )}
          </div>
        )}
      </section>

      {/* Create Station Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Create Radio Station</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-background transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Station Name *</label>
                <input
                  type="text"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2"
                  placeholder="My Awesome Station"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input
                  type="text"
                  value={newStation.description}
                  onChange={(e) => setNewStation({ ...newStation, description: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2"
                  placeholder="Best songs for any mood"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">YouTube URL (optional)</label>
                <input
                  type="url"
                  value={newStation.youtube_url}
                  onChange={(e) => setNewStation({ ...newStation, youtube_url: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for mixed radio mode</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Based On</label>
                <select
                  value={newStation.based_on}
                  onChange={(e) => setNewStation({ ...newStation, based_on: e.target.value as Station["based_on"] })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2"
                >
                  {BASED_ON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewStation({ ...newStation, icon })}
                      className={`p-2 rounded-lg border transition ${
                        newStation.icon === icon
                          ? "border-primary bg-primary/15"
                          : "border-border bg-background/50 hover:bg-background/80"
                      }`}
                    >
                      {getIcon(icon)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewStation({ ...newStation, color })}
                      className={`h-10 rounded-lg border-2 transition ${
                        newStation.color === color
                          ? "border-primary scale-105"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`h-full w-full rounded-md bg-gradient-to-br ${color}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-full border border-border bg-background/50 px-4 py-2.5 text-sm font-semibold hover:bg-background transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-background shadow-glow transition hover:opacity-90"
                >
                  Create Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
