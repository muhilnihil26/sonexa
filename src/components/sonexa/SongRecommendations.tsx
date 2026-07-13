import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminYouTubeTracks } from "@/lib/api/youtube.functions";
import { usePlayer } from "@/lib/player-store";
import { Play, Heart, Plus } from "lucide-react";
import { useLocalLibrary } from "@/lib/local-library";
import { toast } from "sonner";
import { useState } from "react";

interface SongRecommendationsProps {
  currentTrackId?: string;
  limit?: number;
}

export function SongRecommendations({ currentTrackId, limit = 6 }: SongRecommendationsProps) {
  const { play, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLocalLibrary();
  const listTracks = useServerFn(listAdminYouTubeTracks);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", currentTrackId],
    queryFn: () => listTracks(),
    enabled: !!currentTrackId,
  });

  const tracks = data?.tracks || [];
  
  // Filter out current track and get recommendations based on language/artist
  const recommendations = tracks
    .filter((t: any) => t.id !== currentTrackId)
    .slice(0, limit);

  const handlePlay = async (track: any) => {
    setLoadingId(track.id);
    try {
      play(track, recommendations);
    } finally {
      setLoadingId(null);
    }
  };

  const handleLike = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    toggleLike(track);
    toast.success(isLiked(track.id) ? "Removed from Liked" : "Added to Liked");
  };

  const handleAddToQueue = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    addToQueue(track);
    toast.success("Added to queue");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-xl bg-muted" />
            <div className="mt-2 h-4 bg-muted rounded" />
            <div className="mt-1 h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No recommendations available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Recommended for you</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {recommendations.map((track: any) => (
          <div
            key={track.id}
            className="group relative cursor-pointer"
            onClick={() => handlePlay(track)}
          >
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="h-12 w-12 rounded-full bg-primary text-background flex items-center justify-center hover:scale-110 transition-transform">
                  {loadingId === track.id ? (
                    <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.channel}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => handleLike(e, track)}
                className={`p-1.5 rounded-lg bg-background/80 backdrop-blur-sm ${
                  isLiked(track.id) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked(track.id) ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={(e) => handleAddToQueue(e, track)}
                className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
