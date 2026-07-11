import { createFileRoute, Link } from "@tanstack/react-router";
import { Music, Flame, Heart, Clock, TrendingUp, Radio, Compass, PlayCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth";
import { useLanguagePrefs } from "@/lib/language-prefs";
import { usePlayer } from "@/lib/player-store";
import { listAdminYouTubeTracks, listAdminYouTubePlaylists } from "@/lib/api/youtube.functions";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Browse - Sonexa" }] }),
  component: Browse,
});

const GENRE_CATEGORIES = [
  { id: "classical", name: "Classical", iconName: "Music", color: "from-purple-500 to-pink-500" },
  { id: "cinema", name: "Cinema", iconName: "Flame", color: "from-orange-500 to-red-500" },
  { id: "indie", name: "Indie", iconName: "Compass", color: "from-green-500 to-teal-500" },
  { id: "folk", name: "Folk", iconName: "Heart", color: "from-yellow-500 to-orange-500" },
  { id: "romantic", name: "Romantic", iconName: "Heart", color: "from-pink-500 to-rose-500" },
  { id: "devotional", name: "Devotional", iconName: "Music", color: "from-blue-500 to-indigo-500" },
  { id: "rap", name: "Rap/Hip-Hop", iconName: "TrendingUp", color: "from-red-500 to-purple-500" },
  { id: "melody", name: "Melody", iconName: "Clock", color: "from-cyan-500 to-blue-500" },
];

const MOOD_CATEGORIES = [
  { id: "energetic", name: "Energetic", iconName: "Flame", color: "from-orange-500 to-yellow-500" },
  { id: "chill", name: "Chill", iconName: "Clock", color: "from-blue-500 to-cyan-500" },
  { id: "romantic", name: "Romantic", iconName: "Heart", color: "from-pink-500 to-rose-500" },
  { id: "focus", name: "Focus", iconName: "Compass", color: "from-purple-500 to-indigo-500" },
  { id: "party", name: "Party", iconName: "TrendingUp", color: "from-red-500 to-orange-500" },
  { id: "workout", name: "Workout", iconName: "Radio", color: "from-green-500 to-emerald-500" },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Music,
  Flame,
  Compass,
  Heart,
  Clock,
  TrendingUp,
  Radio,
};

function Browse() {
  const { user } = useSession();
  const { languages } = useLanguagePrefs(user?.id);
  const { play } = usePlayer();
  const listYouTube = useServerFn(listAdminYouTubeTracks);
  const listPlaylists = useServerFn(listAdminYouTubePlaylists);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-youtube-tracks"],
    queryFn: () => listYouTube(),
    refetchOnWindowFocus: false,
  });

  const { data: playlistData } = useQuery({
    queryKey: ["youtube-playlists"],
    queryFn: () => listPlaylists(),
    refetchOnWindowFocus: false,
  });

  const tracks = (data?.tracks ?? []) as Array<{
    video_id: string;
    title: string;
    channel: string;
    thumbnail: string;
    language: string | null;
    source_url?: string;
  }>;

  const playlists = (playlistData?.playlists ?? []) as Array<{
    playlist_id: string;
    title: string;
    language: string | null;
    tracks: Array<{ video_id: string; title: string; thumbnail: string }>;
  }>;

  const filteredTracks = languages.length > 0
    ? tracks.filter((track) => languages.includes(track.language || "tamil"))
    : tracks;
  const heroTrack = filteredTracks[0];

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-10 pb-36 max-w-7xl mx-auto animate-fade-up">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card/55 p-6 shadow-card sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.68_0.18_150/.16),transparent_34%),radial-gradient(circle_at_top_right,oklch(0.7_0.24_350/.12),transparent_28%),radial-gradient(circle_at_bottom_left,oklch(0.78_0.18_60/.10),transparent_30%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Compass className="h-4 w-4 text-primary" />
              Browse
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Move by mood, language, and energy.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Built for thumb-first browsing: larger cards, quick taps, and rails that feel good on phones and tablets.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {filteredTracks.length} tracks
              </span>
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {playlists.length} playlists
              </span>
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {languages.length > 0 ? `${languages.length} languages selected` : "All languages enabled"}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {heroTrack && (
                <button
                  onClick={() => play(
                    {
                      id: heroTrack.video_id,
                      title: heroTrack.title,
                      artist: heroTrack.channel,
                      cover: heroTrack.thumbnail,
                      audio: `https://www.youtube.com/watch?v=${heroTrack.video_id}`,
                      kind: "youtube" as const
                    },
                    filteredTracks.slice(0, 18).map((track) => ({
                      id: track.video_id,
                      title: track.title,
                      artist: track.channel,
                      cover: track.thumbnail,
                      audio: `https://www.youtube.com/watch?v=${track.video_id}`,
                      kind: "youtube" as const
                    }))
                  )}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-background shadow-glow transition hover:scale-[1.02] active:scale-[0.99]"
                >
                  <PlayCircle className="h-4 w-4" />
                  Play first match
                </button>
              )}
              <Link
                to="/search"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-card active:scale-[0.99]"
              >
                Search library
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Vibe rail</div>
              <div className="mt-2 text-2xl font-black">{Math.min(filteredTracks.length, 8)}</div>
              <div className="mt-1 text-sm text-muted-foreground">Quick picks made for tapping through.</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Touch mode</div>
              <div className="mt-2 text-2xl font-black">Large</div>
              <div className="mt-1 text-sm text-muted-foreground">Cards and controls sized for mobile browsing.</div>
            </div>
          </div>
        </div>
      </section>

      {heroTrack && (
        <section className="animate-fade-up [animation-delay:80ms] [animation-fill-mode:both]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Quick picks</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tap any card to start a mini-queue instantly.</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {filteredTracks.slice(0, 6).map((track, index) => (
              <button
                key={track.video_id}
                onClick={() => play(
                  {
                    id: track.video_id,
                    title: track.title,
                    artist: track.channel,
                    cover: track.thumbnail,
                    audio: `https://www.youtube.com/watch?v=${track.video_id}`,
                    kind: "youtube" as const
                  },
                  filteredTracks.slice(index, index + 18).map((item) => ({
                    id: item.video_id,
                    title: item.title,
                    artist: item.channel,
                    cover: item.thumbnail,
                    audio: `https://www.youtube.com/watch?v=${item.video_id}`,
                    kind: "youtube" as const
                  }))
                )}
                className="touch-card group min-w-[15rem] snap-start overflow-hidden rounded-2xl border border-border/40 bg-card/45 text-left transition duration-300 hover:bg-card/80 active:scale-[0.99]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={track.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="line-clamp-2 text-sm font-bold text-white">{track.title}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-white/80">
                      <span className="truncate">{track.channel}</span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5">#{index + 1}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Genre Categories */}
      <section className="animate-fade-up [animation-delay:100ms] [animation-fill-mode:both]">
        <h2 className="text-xl font-bold tracking-tight mb-4">Browse by Genre</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {GENRE_CATEGORIES.map((category) => {
            const Icon = iconMap[category.iconName];
            const categoryTracks = filteredTracks.filter((track) =>
              track.title.toLowerCase().includes(category.id.toLowerCase()) ||
              track.title.toLowerCase().includes(category.name.toLowerCase())
            );
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  if (categoryTracks.length > 0) {
                    const track = categoryTracks[0];
                    play(
                      {
                        id: track.video_id,
                        title: track.title,
                        artist: track.channel,
                        cover: track.thumbnail,
                        audio: `https://www.youtube.com/watch?v=${track.video_id}`,
                        kind: "youtube" as const
                      },
                      categoryTracks.map((t) => ({
                        id: t.video_id,
                        title: t.title,
                        artist: t.channel,
                        cover: t.thumbnail,
                        audio: `https://www.youtube.com/watch?v=${t.video_id}`,
                        kind: "youtube" as const
                      }))
                    );
                  }
                }}
                className="touch-card group relative aspect-square overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-glow active:scale-[0.99]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                <div className="relative h-full flex flex-col items-center justify-center p-4 text-white">
                  <Icon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-bold">{category.name}</div>
                  <div className="text-xs opacity-80 mt-1">{categoryTracks.length} songs</div>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mood Categories */}
      <section className="animate-fade-up [animation-delay:200ms] [animation-fill-mode:both]">
        <h2 className="text-xl font-bold tracking-tight mb-4">Browse by Mood</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {MOOD_CATEGORIES.map((category) => {
            const Icon = iconMap[category.iconName];
            // More flexible mood matching - check title, channel, and common mood keywords
            const moodKeywords: Record<string, string[]> = {
              energetic: ["energetic", "fast", "beat", "party", "dance", "upbeat", "high energy", "power"],
              chill: ["chill", "relax", "calm", "peaceful", "slow", "soft", "mellow", "ambient"],
              romantic: ["romantic", "love", "heart", "emotion", "feeling", "sentimental", "passion"],
              focus: ["focus", "study", "work", "concentrate", "ambient", "instrumental", "background"],
              party: ["party", "dance", "club", "remix", "beat", "upbeat", "celebration"],
              workout: ["workout", "gym", "fitness", "exercise", "power", "energy", "motivation"],
            };
            
            const keywords = moodKeywords[category.id] || [category.id, category.name.toLowerCase()];
            const moodTracks = filteredTracks.filter((track) => {
              const searchText = `${track.title} ${track.channel}`.toLowerCase();
              return keywords.some(keyword => searchText.includes(keyword));
            });
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  if (moodTracks.length > 0) {
                    const track = moodTracks[0];
                    play(
                      {
                        id: track.video_id,
                        title: track.title,
                        artist: track.channel,
                        cover: track.thumbnail,
                        audio: `https://www.youtube.com/watch?v=${track.video_id}`,
                        kind: "youtube" as const
                      },
                      moodTracks.map((t) => ({
                        id: t.video_id,
                        title: t.title,
                        artist: t.channel,
                        cover: t.thumbnail,
                        audio: `https://www.youtube.com/watch?v=${t.video_id}`,
                        kind: "youtube" as const
                      }))
                    );
                  }
                }}
                className="touch-card group relative aspect-[4/3] overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-glow active:scale-[0.99]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                <div className="relative h-full flex flex-col items-center justify-center p-3 text-white">
                  <Icon className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold">{category.name}</div>
                  <div className="text-[10px] opacity-80 mt-1">{moodTracks.length} songs</div>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle className="h-10 w-10 text-white drop-shadow-lg" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Curated Playlists */}
      {playlists.length > 0 && (
        <section className="animate-fade-up [animation-delay:300ms] [animation-fill-mode:both]">
          <h2 className="text-xl font-bold tracking-tight mb-4">Curated Playlists</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {playlists.slice(0, 8).map((playlist) => (
              <button
                key={playlist.playlist_id}
                onClick={() => {
                  if (playlist.tracks.length > 0) {
                    const firstTrack = playlist.tracks[0];
                    play(
                      { 
                        id: firstTrack.video_id, 
                        title: firstTrack.title, 
                        artist: firstTrack.title, 
                        cover: firstTrack.thumbnail,
                        audio: `https://www.youtube.com/watch?v=${firstTrack.video_id}`,
                        kind: "youtube" as const
                      },
                      playlist.tracks.map((t) => ({ 
                        id: t.video_id, 
                        title: t.title, 
                        artist: t.title, 
                        cover: t.thumbnail,
                        audio: `https://www.youtube.com/watch?v=${t.video_id}`,
                        kind: "youtube" as const
                      }))
                    );
                  }
                }}
                className="touch-card group relative aspect-square overflow-hidden rounded-2xl border border-border/30 bg-card/40 transition-all duration-300 hover:-translate-y-1 hover:bg-card/80 hover:shadow-glow active:scale-[0.99]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <div className="text-sm font-bold text-white mb-1">{playlist.title}</div>
                  <div className="text-xs text-white/80">{playlist.tracks.length} songs</div>
                  {playlist.language && (
                    <div className="text-[10px] text-white/60 capitalize">{playlist.language}</div>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="h-8 w-8 text-primary drop-shadow-md" />
                </div>
                {playlist.tracks[0]?.thumbnail && (
                  <img src={playlist.tracks[0].thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      <section className="animate-fade-up [animation-delay:400ms] [animation-fill-mode:both]">
        <h2 className="text-xl font-bold tracking-tight mb-4">New Releases</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredTracks.slice(0, 8).map((track) => (
            <button
              key={track.video_id}
              onClick={() => play(
                { 
                  id: track.video_id, 
                  title: track.title, 
                  artist: track.channel, 
                  cover: track.thumbnail,
                  audio: `https://www.youtube.com/watch?v=${track.video_id}`,
                  kind: "youtube" as const
                },
                [{ 
                  id: track.video_id, 
                  title: track.title, 
                  artist: track.channel, 
                  cover: track.thumbnail,
                  audio: `https://www.youtube.com/watch?v=${track.video_id}`,
                  kind: "youtube" as const
                }]
              )}
              className="touch-card group relative aspect-square overflow-hidden rounded-2xl border border-border/30 bg-card/40 transition duration-300 hover:bg-card/80 active:scale-[0.99]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-3">
                <div className="text-sm font-bold text-white mb-1 line-clamp-2">{track.title}</div>
                <div className="text-xs text-white/80 truncate">{track.channel}</div>
              </div>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="h-8 w-8 text-primary drop-shadow-md" />
              </div>
              <img src={track.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
