import { useState } from "react";
import { Play, Clock, Calendar, Radio, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { isIndependenceEnabled } from "@/lib/feature-config";

interface PodcastEpisode extends Track {
  durationStr: string;
  airDate: string;
  description: string;
  isLive: boolean;
  language: string;
}

const independencePodcasts: PodcastEpisode[] = [
  {
    id: "pod-1",
    title: "Independence Day Special: Tamil Patriotic Songs",
    description: "A curated journey through the most iconic Tamil patriotic songs that celebrate India's freedom struggle and cultural heritage.",
    durationStr: "45:00",
    airDate: "2026-08-15T09:00:00",
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "vp1HVg_J1Xg",
    isLive: true,
    language: "Tamil"
  },
  {
    id: "pod-2",
    title: "Stories of Freedom: Tamil Nadu's Role",
    description: "Discover the significant contributions of Tamil Nadu leaders and freedom fighters in India's independence movement.",
    durationStr: "38:30",
    airDate: "2026-08-15T12:00:00",
    cover: "https://images.unsplash.com/photo-1531670158234-809972d6be3e?w=400&h=400&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "jDn2bn7_YSM",
    isLive: false,
    language: "Tamil"
  },
  {
    id: "pod-3",
    title: "Classical Independence: Carnatic Tributes",
    description: "Experience the beauty of Carnatic music compositions dedicated to India's independence and national pride.",
    durationStr: "52:15",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "5bex-7q_uP8",
    isLive: false,
    language: "Tamil"
  },
  {
    id: "pod-4",
    title: "Patriotic Music Mix: Independence Celebration",
    description: "A special mix of patriotic songs from across India celebrating Independence Day.",
    durationStr: "1:00:00",
    airDate: "2026-08-15T15:00:00",
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "6X2I3M_m0TA",
    isLive: false,
    language: "Tamil"
  },
  {
    id: "pod-5",
    title: "Freedom Fighters: Remembering Heroes",
    description: "Stories and songs dedicated to the brave freedom fighters who sacrificed for India's independence.",
    durationStr: "42:00",
    airDate: "2026-08-15T18:00:00",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "Ee5fG4C6aMw",
    isLive: false,
    language: "Tamil"
  }
];

export function IndependenceDayPodcast() {
  if (!isIndependenceEnabled()) return null;

  const { current, isPlaying, play, toggle } = usePlayer();

  const playEpisode = (episode: PodcastEpisode) => {
    play(episode, independencePodcasts);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-orange-400 animate-pulse" />
            Independence Special Broadcasts
          </h3>
          <p className="text-muted-foreground mt-1">Listen to special podcasts and programs celebrating freedom</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {independencePodcasts.map((episode) => {
          const isActive = current?.id === episode.id;
          return (
            <div
              key={episode.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card/45 hover:bg-card"
              }`}
            >
              <div>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3">
                  <img
                    src={episode.cover}
                    alt={episode.title}
                    className="w-full h-full object-cover"
                  />
                  {episode.isLive && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-black tracking-widest animate-pulse">
                      LIVE
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-foreground text-sm line-clamp-1">{episode.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{episode.description}</p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-[10px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {episode.durationStr}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(episode.airDate)}
                  </div>
                </div>

                <button
                  onClick={() => (isActive ? toggle() : playEpisode(episode))}
                  className={`p-3 rounded-full ${
                    isActive ? "bg-primary text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}