import { useState, useEffect } from "react";
import { Play, Clock, Calendar, Radio, Heart, Share2, Volume2, SkipBack, SkipForward, Pause } from "lucide-react";

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  duration: string;
  airDate: string;
  image: string;
  isLive: boolean;
  language: string;
}

const independencePodcasts: PodcastEpisode[] = [
  {
    id: "1",
    title: "Independence Day Special: Tamil Patriotic Songs",
    description: "A curated journey through the most iconic Tamil patriotic songs that celebrate India's freedom struggle and cultural heritage.",
    duration: "45:00",
    airDate: "2026-08-15T09:00:00",
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    isLive: true,
    language: "Tamil"
  },
  {
    id: "2",
    title: "Stories of Freedom: Tamil Nadu's Role",
    description: "Discover the significant contributions of Tamil Nadu leaders and freedom fighters in India's independence movement.",
    duration: "38:30",
    airDate: "2026-08-15T12:00:00",
    image: "https://images.unsplash.com/photo-1531670158234-809972d6be3e?w=400&h=400&fit=crop",
    isLive: false,
    language: "Tamil"
  },
  {
    id: "3",
    title: "Classical Independence: Carnatic Tributes",
    description: "Experience the beauty of Carnatic music compositions dedicated to India's independence and national pride.",
    duration: "52:15",
    airDate: "2026-08-15T15:00:00",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    isLive: false,
    language: "Tamil"
  },
  {
    id: "4",
    title: "Folk Freedom Songs of Tamil Nadu",
    description: "Traditional folk songs that have been the voice of freedom and resistance in Tamil villages for generations.",
    duration: "41:20",
    airDate: "2026-08-15T18:00:00",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    isLive: false,
    language: "Tamil"
  },
  {
    id: "5",
    title: "Cinematic Patriotism: Tamil Film Music",
    description: "Explore how Tamil cinema has celebrated Indian patriotism through powerful and memorable musical compositions.",
    duration: "48:45",
    airDate: "2026-08-15T21:00:00",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    isLive: false,
    language: "Tamil"
  }
];

export function IndependenceDayPodcast() {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");

  useEffect(() => {
    // Simulate progress when playing
    let interval: NodeJS.Timeout;
    if (isPlaying && currentEpisode) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
        
        // Update current time display
        const totalSeconds = (parseFloat(currentEpisode.duration.split(':')[0]) * 60 + parseFloat(currentEpisode.duration.split(':')[1])) * (progress / 100);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        setCurrentTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentEpisode, progress]);

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

  const isEpisodeLive = (episode: PodcastEpisode) => {
    const now = new Date();
    const airDate = new Date(episode.airDate);
    const endDate = new Date(airDate.getTime() + parseFloat(episode.duration) * 60 * 1000);
    return now >= airDate && now <= endDate;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-orange-400 animate-pulse" />
            Independence Day Podcast Schedule
          </h3>
          <p className="text-muted-foreground mt-1">Special broadcasts celebrating India's freedom</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400">
          <Calendar className="h-4 w-4" />
          <span className="font-semibold">August 15, 2026</span>
        </div>
      </div>

      {/* Current player */}
      {currentEpisode && (
        <div className="p-6 rounded-3xl border border-border bg-gradient-to-br from-orange-500/10 via-white/5 to-green-500/10 backdrop-blur-xl animate-slide-up">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Episode art */}
            <div className="relative w-full md:w-48 aspect-square rounded-2xl overflow-hidden">
              <img
                src={currentEpisode.image}
                alt={currentEpisode.title}
                className="w-full h-full object-cover"
              />
              {currentEpisode.isLive && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  LIVE
                </div>
              )}
            </div>

            {/* Player controls */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold mb-2">{currentEpisode.title}</h4>
                <p className="text-muted-foreground text-sm mb-4">{currentEpisode.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {currentEpisode.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(currentEpisode.airDate)}
                  </div>
                  <div className="px-2 py-1 rounded-full bg-blue-900/30 text-blue-300 text-xs">
                    {currentEpisode.language}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-4">
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-white to-green-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{currentTime}</span>
                  <div className="flex items-center gap-3">
                    <button className="p-2 rounded-full hover:bg-card transition-colors">
                      <SkipBack className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center hover:scale-105 transition-transform shadow-glow"
                    >
                      {isPlaying ? <Pause className="h-6 w-6 text-blue-900" /> : <Play className="h-6 w-6 text-blue-900 ml-1" />}
                    </button>
                    <button className="p-2 rounded-full hover:bg-card transition-colors">
                      <SkipForward className="h-5 w-5" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentEpisode.duration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podcast schedule */}
      <div className="space-y-4">
        {independencePodcasts.map((episode, index) => (
          <div
            key={episode.id}
            className={`group p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
              currentEpisode?.id === episode.id 
                ? 'border-orange-500/50 bg-orange-500/10' 
                : 'border-border bg-card/40 hover:bg-card'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              {/* Episode number */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={episode.image}
                  alt={episode.title}
                  className="w-full h-full object-cover"
                />
                {episode.isLive && (
                  <div className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                    LIVE
                  </div>
                )}
              </div>

              {/* Episode info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h5 className="font-semibold text-foreground truncate group-hover:text-orange-400 transition-colors">
                      {episode.title}
                    </h5>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{episode.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {episode.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(episode.airDate)}
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300">
                        {episode.language}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setCurrentEpisode(episode);
                        setIsPlaying(true);
                        setProgress(0);
                      }}
                      className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-blue-900 hover:scale-110 transition-transform shadow-glow"
                    >
                      <Play className="h-4 w-4 ml-0.5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-red-400">
                      <Heart className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-primary">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscribe reminder */}
      <div className="p-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Radio className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Never miss an episode</p>
            <p className="text-sm text-muted-foreground">Subscribe to get notified about special broadcasts</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">
          Subscribe
        </button>
      </div>
    </div>
  );
}