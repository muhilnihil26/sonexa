import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Download, Heart, Play, Pause, Radio, Sparkles, Flame, PlayCircle, Settings2, ChevronDown, ArrowRight, Shuffle, Headphones } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MusicClock } from "@/components/sonexa/MusicClock";
import { AndroidDownloadChooser } from "@/components/sonexa/AndroidDownloadChooser";
import { RadioStations } from "@/components/sonexa/RadioStations";
import { SongRecommendations } from "@/components/sonexa/SongRecommendations";
import { useSession } from "@/lib/auth";
import { useLanguagePrefs } from "@/lib/language-prefs";
import { isYtBroken, usePlayer, type Track } from "@/lib/player-store";
import { rankTracksForTaste, readRecentlyHeard } from "@/lib/listening-taste";
import { listAdminYouTubePlaylists, listAdminYouTubeTracks } from "@/lib/api/youtube.functions";
import { getHomeConfig, getFeatureConfig } from "@/lib/api/social.functions";
import { useProfilePrefs } from "@/lib/profile-prefs";
import { generateSmartPlaylists } from "@/lib/auto-playlists";
import { MusicReels } from "./reels";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home - Sonexa" }] }),
  component: Home,
});

function Home() {
  const { user } = useSession();
  const { languages, loading: langLoading, save: saveLanguages } = useLanguagePrefs(user?.id);
  const { play, startRadio } = usePlayer();
  const listYouTube = useServerFn(listAdminYouTubeTracks);
  const listPlaylists = useServerFn(listAdminYouTubePlaylists);
  const getHomeCfg = useServerFn(getHomeConfig);
  const getFeatureCfg = useServerFn(getFeatureConfig);
  const navigate = Route.useNavigate();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const allLanguages = ["tamil", "hindi", "telugu", "malayalam", "kannada", "english", "punjabi", "bengali", "marathi", "gujarati"];
  const displayLanguages = ["Tamil", "Hindi", "Telugu", "Malayalam", "Kannada", "English", "Punjabi", "Bengali", "Marathi", "Gujarati"];

  useEffect(() => {
    const conn = (navigator as any).connection;
    const isWifi = conn?.type === "wifi";
    const isTvUserAgent = /smart-tv|smarttv|appletv|hbbtv|roku|crkey|chromecast|android\.tv/i.test(navigator.userAgent);
    
    if (isWifi || isTvUserAgent) {
      const dismissed = localStorage.getItem("sonexa_tv_prompt_dismissed");
      if (!dismissed) {
        toast("Connect to mobile device?", {
          description: "Use your phone as a remote control.",
          action: {
            label: "Open Remote",
            onClick: () => {
              localStorage.setItem("sonexa_tv_prompt_dismissed", "1");
              navigate({ to: "/remote" });
            }
          },
          cancel: {
            label: "Dismiss",
            onClick: () => localStorage.setItem("sonexa_tv_prompt_dismissed", "1")
          },
          duration: 10000,
        });
      }
    }
  }, [navigate]);

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

  const { data: homeConfig } = useQuery({
    queryKey: ["home-config"],
    queryFn: () => getHomeCfg(),
  });

  const { data: featureConfig } = useQuery({
    queryKey: ["feature-config"],
    queryFn: () => getFeatureCfg(),
  });

  const isNativeApp = Capacitor.isNativePlatform();
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "listener";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Load recently heard tracks
  const recent = readRecentlyHeard(user?.email ?? user?.id);

  // Build the catalog filtered by all user languages, personalized by user ID seed
  const catalog = buildHomeCatalog({
    languages,
    userKey: user?.email ?? user?.id,
    rows: (data?.tracks ?? []) as AdminYouTubeRow[],
    playlists: (playlistData?.playlists ?? []) as AdminYouTubePlaylist[],
  });

  // Generate smart playlists dynamically from catalog tracks
  const smartPlaylists = generateSmartPlaylists(catalog.allTracks);

  if (!langLoading && user && languages.length === 0) return <Navigate to="/onboarding" />;

  const bgImage = homeConfig?.backgroundImageUrl || "/default-home-bg.png";
  const bgOpacity = homeConfig?.overlayOpacity ?? 0.2;
  const spotlightPlaylist = smartPlaylists[0];
  const radioQueue = catalog.allTracks.slice(0, Math.min(24, catalog.allTracks.length));
  const recentQueue = recent.length > 0 ? recent : catalog.trending.slice(0, 6);

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-10 pb-36 max-w-7xl mx-auto">
      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/60 bg-card/50 hover:bg-card/80 transition text-sm font-semibold"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Languages: {languages.length > 0 ? languages.length : "Select"}
          <ChevronDown className={`h-4 w-4 transition ${langMenuOpen ? "rotate-180" : ""}`} />
        </button>
        {langMenuOpen && (
          <div className="absolute top-full left-0 mt-2 p-3 rounded-2xl border border-border bg-card shadow-glow z-50 min-w-80">
            <div className="grid grid-cols-2 gap-2">
              {allLanguages.map((lang, idx) => {
                const isSelected = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => {
                      const updated = isSelected
                        ? languages.filter((l) => l !== lang)
                        : [...languages, lang];
                      saveLanguages(updated);
                      toast.success(`Updated languages`);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isSelected
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-background/40 text-muted-foreground hover:text-foreground border border-border/40"
                    }`}
                  >
                    {displayLanguages[idx]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setLangMenuOpen(false)}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-background/60 text-sm font-medium hover:bg-background"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/55 p-4 shadow-card animate-fade-up sm:p-6 md:p-8 lg:p-10 hover:shadow-glow transition-shadow duration-500">
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay" 
          style={{ 
            backgroundImage: `url('${bgImage}')`,
            opacity: bgOpacity 
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,oklch(0.7_0.24_350/.18),transparent_32%),radial-gradient(circle_at_0%_100%,oklch(0.78_0.18_60/.12),transparent_30%)]" />
        <div className="relative grid gap-4 sm:gap-6 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '0.1s' }}>{greet},</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight capitalize sm:text-3xl md:text-4xl lg:text-5xl animate-3d-text">
              {name}
            </h1>
            <p className="mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm md:text-base animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Premium Spotify-style streaming interface, customized for your vibe.
            </p>
            {!isNativeApp && (
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <AndroidDownloadChooser
                  label="Android App"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-background shadow-glow transition hover:scale-[1.02] hover:shadow-glow sm:px-5 sm:py-2.5 sm:text-sm lg:hidden"
                />
                <div className="hidden lg:flex gap-3">
                  <a
                    href="/sonexa-windows-installer.exe"
                    download
                    className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-background shadow-glow transition hover:scale-[1.02] hover:shadow-glow"
                  >
                    <Download className="h-4 w-4" />
                    Windows App
                  </a>
                  <AndroidDownloadChooser
                    label="Android App"
                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/20 hover:scale-[1.02]"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <MusicClock />
            {featureConfig?.radioEnabled && (
              <button 
                onClick={() => startRadio(catalog.allTracks, user?.email ?? user?.id ?? "")}
                className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-2xl bg-primary text-background font-bold shadow-glow hover:scale-[1.02] hover:shadow-glow transition animate-pulse-glow text-sm sm:text-base"
              >
                <Radio className="h-4 w-4 sm:h-5 sm:w-5" /> Start Sonexa Radio
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="animate-fade-up [animation-delay:80ms] [animation-fill-mode:both]">
        <div className="flex items-end justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Today on Sonexa</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight sm:text-xl md:text-2xl">Quick taps, fresh mixes, one-thumb friendly.</h2>
          </div>
          <Link to="/browse" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={() => {
              if (spotlightPlaylist?.tracks?.length) {
                play(spotlightPlaylist.tracks[0], spotlightPlaylist.tracks);
              }
            }}
            className="touch-card group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-[linear-gradient(135deg,oklch(0.2_0_0),oklch(0.14_0_0))] p-3 sm:p-5 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.68_0.18_150/.18),transparent_35%),radial-gradient(circle_at_bottom_left,oklch(0.78_0.18_60/.12),transparent_32%)]" />
            <div className="relative flex h-full min-h-32 sm:min-h-40 flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Shuffle className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Auto mix</span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold tracking-tight">Daily Mix</h3>
                <p className="mt-1 text-sm text-muted-foreground">A fresh stack from your current taste profile.</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{spotlightPlaylist?.tracks.length ?? 0} tracks ready</span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">Play mix <Play className="h-3.5 w-3.5 fill-current" /></span>
              </div>
            </div>
          </button>

          <button
            onClick={() => startRadio(radioQueue, user?.email ?? user?.id ?? "")}
            className="touch-card group relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,oklch(0.18_0_0),oklch(0.12_0_0))] p-5 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.7_0.24_350/.16),transparent_34%),radial-gradient(circle_at_bottom_right,oklch(0.78_0.18_60/.12),transparent_30%)]" />
            <div className="relative flex h-full min-h-40 flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Radio className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">Live flow</span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold tracking-tight">Start Radio</h3>
                <p className="mt-1 text-sm text-muted-foreground">Let Sonexa keep the room moving with the right follow-ups.</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Personalized by your library</span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">Start now <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </div>
          </button>

          <Link
            to="/search"
            className="touch-card group relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,oklch(0.2_0_0),oklch(0.16_0_0))] p-5 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.68_0.18_150/.15),transparent_36%),radial-gradient(circle_at_bottom_left,oklch(0.6_0.2_320/.12),transparent_32%)]" />
            <div className="relative flex h-full min-h-40 flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Headphones className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">Search fast</span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold tracking-tight">Find anything</h3>
                <p className="mt-1 text-sm text-muted-foreground">Search songs, artists, movie BGMs, or paste a YouTube link.</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tap to jump in</span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">Open search <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </div>
          </Link>

          <button
            onClick={() => {
              const track = recentQueue[0] ?? catalog.trending[0];
              if (track) play(track, recentQueue);
            }}
            className="touch-card group relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,oklch(0.18_0_0),oklch(0.1_0_0))] p-5 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.78_0.18_60/.16),transparent_35%),radial-gradient(circle_at_bottom_left,oklch(0.7_0.24_350/.12),transparent_32%)]" />
            <div className="relative flex h-full min-h-40 flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Fresh replay</span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold tracking-tight">Jump Back In</h3>
                <p className="mt-1 text-sm text-muted-foreground">Resume the last few listens without hunting for them.</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{recentQueue.length} recent picks</span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">Replay <Play className="h-3.5 w-3.5 fill-current" /></span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Recents Spotify-style grid layout */}
      {recent.length > 0 && (
        <section className="animate-fade-up duration-700">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl mb-4">Jump Back In</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {recent.slice(0, 6).map((track) => (
              <button
                key={track.id}
                onClick={() => play(track, [track])}
                className="touch-card group flex min-h-16 items-center overflow-hidden rounded-2xl border border-border/30 bg-card/40 transition duration-300 hover:bg-card/80 active:scale-[0.99]"
              >
                <img src={track.cover} alt="" className="h-16 w-16 object-cover shadow-md" />
                <div className="min-w-0 flex-1 px-3 text-left">
                  <span className="block truncate text-sm font-bold text-foreground">{track.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{track.artist}</span>
                </div>
                <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="h-8 w-8 text-primary drop-shadow-md" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Made for You Section */}
      {smartPlaylists.length > 0 && (
        <section className="animate-fade-up duration-700 [animation-delay:100ms] [animation-fill-mode:both]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Made for You</h2>
            <Link to="/browse" className="text-sm text-primary hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {smartPlaylists.slice(0, 5).map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => {
                  if (playlist.tracks.length > 0) {
                    play(playlist.tracks[0], playlist.tracks);
                  }
                }}
                className="touch-card group relative aspect-square overflow-hidden rounded-2xl border border-border/30 bg-card/40 transition duration-300 hover:bg-card/80 active:scale-[0.99]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <div className="text-xs font-bold text-white mb-1">{playlist.name}</div>
                  <div className="text-[10px] text-white/80">{playlist.tracks.length} songs</div>
                </div>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="h-10 w-10 text-primary drop-shadow-md" />
                </div>
                {playlist.cover && (
                  <img src={playlist.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Top Artists Section */}
      {(catalog as any).topArtists && (catalog as any).topArtists.length > 0 && (
        <section className="animate-fade-up duration-700 [animation-delay:150ms] [animation-fill-mode:both]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Top Artists</h2>
            <Link to="/browse" className="text-sm text-primary hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(catalog as any).topArtists.slice(0, 6).map((artist: string, idx: number) => {
              const artistTracks = catalog.allTracks.filter((t: Track) => t.artist === artist);
              const artistCover = artistTracks.length > 0 ? artistTracks[0].cover : null;
              const artistId = artistTracks.length > 0 ? artistTracks[0].artistId : null;
              
              return (
                <button
                  key={`${artist}-${idx}`}
                  onClick={() => {
                    if (artistTracks.length > 0) play(artistTracks[0], artistTracks);
                  }}
                  className="group relative aspect-square bg-card/40 hover:bg-card/80 border border-border/30 rounded-full overflow-hidden transition duration-300 hover:shadow-glow hover:scale-105"
                >
                  {artistCover ? (
                    <>
                      <img
                        src={artistCover}
                        alt={artist}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-purple-500/30">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">{artist.charAt(0)}</div>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-xs font-bold text-white truncate text-center">{artist}</div>
                    <div className="text-[10px] text-white/80 text-center">{artistTracks.length} songs</div>
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center">
                    <PlayCircle className="h-10 w-10 text-white drop-shadow-md" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="space-y-10 xl:space-y-12 pb-10">
        {/* Trending Reels section */}
      {catalog.reels.length > 0 && (
          <div className="animate-fade-up duration-700 [animation-delay:200ms] [animation-fill-mode:both]">
            <MusicReels tracks={catalog.reels} />
          </div>
        )}

        {/* Trending grid rows section */}
        <div className="animate-fade-up duration-700 [animation-delay:400ms] [animation-fill-mode:both]">
          <HomeYouTubeSection
            title="Trending Hits"
            tracks={catalog.trending}
            queue={catalog.allTracks}
            loading={isLoading}
          />
        </div>

        {/* Featured YouTube Playlists Section */}
        {playlistData?.playlists && playlistData.playlists.length > 0 && (
          <div className="animate-fade-up duration-700 [animation-delay:600ms] [animation-fill-mode:both]">
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Featured Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {playlistData.playlists.slice(0, 6).map((pl: any) => (
                  <Link
                    key={pl.playlist_id}
                    to="/playlist/$id"
                    params={{ id: pl.playlist_id }}
                    className="touch-card group flex flex-col rounded-2xl border border-border/40 bg-card/40 p-3.5 transition duration-300 hover:-translate-y-1 hover:bg-card hover:border-border hover:shadow-glow active:scale-[0.99]"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-brand-gradient shadow-md relative flex items-center justify-center">
                      {pl.tracks?.[0]?.thumbnail && (
                        <img 
                          src={pl.tracks[0].thumbnail} 
                          alt={pl.title}
                          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-100"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-300" />
                      <PlayCircle className="h-10 w-10 text-white/80 opacity-0 group-hover:opacity-100 transition duration-300 z-10" />
                    </div>
                    <h3 className="mt-3 font-bold text-sm sm:text-base leading-tight truncate group-hover:text-primary transition">
                      {pl.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      YouTube Playlist
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Smart Playlists Section */}
        {smartPlaylists.length > 0 && (
          <div className="animate-fade-up duration-700 [animation-delay:800ms] [animation-fill-mode:both]">
            <SmartPlaylistsSection playlists={smartPlaylists} />
          </div>
        )}

        {/* Radio Stations Section */}
        {featureConfig?.radioEnabled && (
          <div className="animate-fade-up duration-700 [animation-delay:900ms] [animation-fill-mode:both]">
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Radio Stations</h2>
              <RadioStations />
            </section>
          </div>
        )}

        {/* Discover More banners section */}
        <div className="animate-fade-up [animation-delay:350ms] [animation-fill-mode:both]">
          <DiscoverSection
            tracks={catalog.discover}
            queue={catalog.allTracks}
          />
        </div>

        <TasteSuggestionPanel recent={recent} />
      </div>
    </div>
  );
}

type AdminYouTubeRow = {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  language: string | null;
  source_url: string | null;
  backup_url?: string | null;
  created_at: string;
};

type AdminYouTubePlaylist = {
  id: string;
  playlist_id: string;
  title: string;
  language: string | null;
  tracks: AdminYouTubeRow[];
};

function adminToTrack(track: AdminYouTubeRow): Track {
  return {
    id: `yt_${track.video_id}`,
    title: track.title,
    artist: track.channel,
    cover: track.thumbnail,
    audio: track.backup_url ?? "",
    language: track.language ?? undefined,
    kind: track.backup_url ? "audio" : "youtube",
    ytId: track.video_id,
  };
}

function buildHomeCatalog({
  languages,
  userKey,
  rows,
  playlists,
}: {
  languages: string[];
  userKey?: string | null;
  rows: AdminYouTubeRow[];
  playlists: AdminYouTubePlaylist[];
}) {
  const seen = new Set<string>();

  // Filter db tracks matching any of the user's selected languages
  const dbTracks = rows
    .filter((track) => !languages.length || !track.language || languages.includes(track.language))
    .map(adminToTrack)
    .filter((track) => track.kind === "audio" || (!!track.ytId && !isYtBroken(track.ytId)));

  // Only use YouTube/admin DB tracks — no iTunes/sample tracks
  let allTracks = dbTracks.filter((track) => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });

  // Dynamic user-specific personalization (seeded shuffle based on user ID or email)
  if (userKey) {
    let hash = 0;
    for (let i = 0; i < userKey.length; i++) {
      hash = userKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seedRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    let seed = Math.abs(hash || 1);
    allTracks = [...allTracks].sort(() => seedRandom(seed++) - 0.5);
  }

  // Rank based on taste profiles
  const rankedTracks = rankTracksForTaste(allTracks, userKey);
  allTracks.splice(0, allTracks.length, ...rankedTracks);

  const used = new Set<string>();
  const take = (count: number, filterFn?: (t: Track) => boolean) => {
    const picked = allTracks.filter((track) => !used.has(track.id) && (!filterFn || filterFn(track))).slice(0, count);
    picked.forEach((track) => used.add(track.id));
    return picked;
  };

  const trending = take(18);
  const reels = take(20, t => t.kind === "youtube");
  const discover = take(24);

  // Calculate top artists
  const artistCounts = new Map<string, number>();
  allTracks.forEach(track => {
    artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + 1);
  });
  const topArtists = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([artist]) => artist);

  return {
    allTracks,
    trending,
    reels,
    discover,
    topArtists,
  };
}

// Compact row-list layout for Trending Hits
function HomeYouTubeSection({
  title,
  tracks,
  queue,
  loading,
}: {
  title: string;
  tracks: Track[];
  queue: Track[];
  loading: boolean;
}) {
  const { play, current, isPlaying, toggle } = usePlayer();
  if (!tracks.length && !loading) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-card/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          {tracks.map((track, index) => {
            const active = current?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => (active ? toggle() : play(track, queue))}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-card/30 hover:bg-card/75 border border-border/30 hover:border-border/80 transition cursor-pointer group"
              >
                <div className="text-xs text-muted-foreground w-4 text-center font-bold">{index + 1}</div>
                <div className="relative">
                  <img src={track.cover} alt="" className="h-12 w-12 rounded-lg object-cover shadow-sm group-hover:shadow-md transition" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition grid place-items-center">
                    {active && isPlaying ? (
                      <Pause className="h-4 w-4 text-white fill-current" />
                    ) : (
                      <Play className="h-4 w-4 text-white fill-current ml-0.5" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`truncate text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>
                    {track.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Made For You: Smart Playlists grid layout
function SmartPlaylistsSection({ playlists }: { playlists: any[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Made For You</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {playlists.map((pl) => (
          <Link
            key={pl.id}
            to="/playlist/$id"
            params={{ id: pl.id }}
            className="touch-card group flex flex-col rounded-2xl border border-border/40 bg-card/40 p-3.5 transition duration-300 hover:-translate-y-1 hover:bg-card hover:border-border hover:shadow-glow active:scale-[0.99]"
          >
            <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-brand-gradient flex items-center justify-center relative shadow-md">
              {pl.cover ? (
                <img src={pl.cover} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-500" />
              ) : null}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition" />
              <div className="absolute bottom-2.5 right-2.5 h-10 w-10 rounded-full bg-primary text-background grid place-items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-glow">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </div>
            </div>
            <div className="font-bold text-sm truncate">{pl.name}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed h-8">{pl.description}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Wide banner layout for Discover More section
function DiscoverSection({
  tracks,
  queue,
}: {
  tracks: Track[];
  queue: Track[];
}) {
  const { play, current, isPlaying, toggle } = usePlayer();
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Discover More</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tracks.map((track) => {
          const active = current?.id === track.id;
          return (
            <div
              key={track.id}
              onClick={() => (active ? toggle() : play(track, queue))}
              className="group relative flex h-24 overflow-hidden rounded-2xl border border-border bg-card/45 hover:bg-card cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
            >
              <img src={track.cover} alt="" className="h-full w-24 shrink-0 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  <div className={`font-bold text-xs sm:text-sm truncate ${active ? "text-primary" : "text-foreground"}`}>{track.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">{track.artist}</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">{track.language}</span>
                  <div className="h-7 w-7 rounded-full bg-primary/10 group-hover:bg-primary text-primary group-hover:text-background grid place-items-center transition">
                    {active && isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TasteSuggestionPanel({ recent }: { recent: Track[] }) {
  const recentArtists = Array.from(new Set(recent.map((track) => track.artist).filter(Boolean)))
    .slice(0, 3)
    .join(", ");
  return (
    <section className="animate-fade-up rounded-2xl border border-border bg-card/35 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">For your taste</p>
          <h2 className="text-2xl font-bold mt-1">Sonexa is learning your sound</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {recentArtists
              ? `More songs like ${recentArtists} will move up in your feed.`
              : "Play a few songs and Sonexa will start shaping the feed for you."}
          </p>
        </div>
        <Link
          to="/search"
          search={{ q: "" }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02]"
        >
          <Heart className="h-4 w-4 fill-current" />
          Request liked songs
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Radio, label: "More from your artists" },
          { icon: Sparkles, label: "Fresh songs near your taste" },
          { icon: Play, label: "Recently heard comes first" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3 text-sm font-semibold"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <item.icon className="h-4 w-4" />
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
