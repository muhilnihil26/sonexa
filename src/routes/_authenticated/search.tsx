import { createFileRoute } from "@tanstack/react-router";
import { ListPlus, Music, Play, Search as SearchIcon, Send, Sparkles, Youtube } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { YouTubeRow } from "@/components/sonexa/YouTubeRow";
import { searchYouTube, submitYouTubeRequest } from "@/lib/api/youtube.functions";
import { usePlayer, type Track } from "@/lib/player-store";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

const TRENDING_SEARCHES = [
  "Anirudh",
  "Vijay songs",
  "Jailer",
  "Romantic Tamil",
  "Pushpa songs",
  "Devara songs",
  "Ilaiyaraaja BGM",
  "Yuvan BGM",
  "AR Rahman",
  "Harris Jayaraj",
];

type SearchFilter = "all" | "songs" | "artists" | "albums" | "playlists" | "youtube";

const FILTERS: Array<{ id: SearchFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "songs", label: "Songs" },
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" },
  { id: "playlists", label: "Playlists" },
  { id: "youtube", label: "YouTube" },
];

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search - Sonexa" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const initialSearch = Route.useSearch();
  const [q, setQ] = useState(initialSearch.q);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [ytUrl, setYtUrl] = useState("");
  const [ytLanguage, setYtLanguage] = useState("tamil");
  const [requesting, setRequesting] = useState(false);
  const [requestingUrl, setRequestingUrl] = useState("");
  const [ytResults, setYtResults] = useState<YouTubeResult[]>([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [ytSearchError, setYtSearchError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitRequest = useServerFn(submitYouTubeRequest);
  const runYouTubeSearch = useServerFn(searchYouTube);
  const { play, addToQueue } = usePlayer();

  useEffect(() => {
    if (initialSearch.q) setQ(initialSearch.q);
  }, [initialSearch.q]);

  const shouldSearchYouTube = true;
  const busy = shouldSearchYouTube && ytSearching;

  useEffect(() => {
    if (!shouldSearchYouTube || !q.trim() || q.trim().length < 2) {
      setYtResults([]);
      setYtSearchError("");
      return;
    }
    let cancelled = false;
    setYtSearching(true);
    const t = setTimeout(async () => {
      try {
        const result = await runYouTubeSearch({ data: { query: q, limit: 80 } });
        if (!cancelled) {
          setYtResults(result.results as YouTubeResult[]);
          setYtSearchError("");
        }
      } catch (error) {
        if (!cancelled) {
          setYtResults([]);
          setYtSearchError(error instanceof Error ? error.message : "Search failed");
        }
      } finally {
        if (!cancelled) setYtSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setYtSearching(false);
    };
  }, [q, shouldSearchYouTube]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TRENDING_SEARCHES;
    return TRENDING_SEARCHES.filter((item) => item.toLowerCase().includes(needle));
  }, [q]);

  const showSuggestions = searchOpen && suggestions.length > 0;

  useEffect(() => {
    return () => {
      if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
    };
  }, []);

  async function requestYouTubeSong(e: React.FormEvent) {
    e.preventDefault();
    await requestUrl(ytUrl);
  }

  async function requestUrl(url: string) {
    if (!url.trim()) return;
    setRequesting(true);
    setRequestingUrl(url);
    try {
      const result = await submitRequest({ data: { url, language: ytLanguage } });
      if (result.status === "already_approved") toast.success("That YouTube song is already added");
      else toast.success(`Request sent: ${result.request.title}`);
      setYtUrl("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request song");
    } finally {
      setRequesting(false);
      setRequestingUrl("");
    }
  }

  const hasQuery = q.trim().length >= 2;
  const visibleResults = ytResults.filter((result) => {
    if (filter === "all" || filter === "youtube") return true;
    if (filter === "songs") return result.type === "video";
    if (filter === "artists") return result.type === "channel";
    if (filter === "albums") return result.type === "playlist";
    if (filter === "playlists") return result.type === "playlist";
    return true;
  });
  const noResults =
    hasQuery &&
    !busy &&
    visibleResults.length === 0;

  return (
    <div className="p-6 md:p-10 animate-page-in">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 border-b border-border bg-background/90 px-6 pt-6 pb-4 backdrop-blur md:-mx-10 md:-mt-10 md:px-10 md:pt-10">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onFocus={() => {
              if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
              setSearchOpen(true);
            }}
            onBlur={() => {
              searchBlurTimer.current = setTimeout(() => setSearchOpen(false), 120);
            }}
            placeholder="Search songs, YouTube full songs, BGM, artist, or movie..."
            className="w-full rounded-full border border-border bg-card py-4 pl-12 pr-4 text-base shadow-card transition focus:outline-none focus:ring-2 ring-primary sm:text-lg"
          />
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-xs text-muted-foreground">
            {busy ? <MusicLoadingMini /> : <Sparkles className="h-4 w-4 text-primary" />}
            <span className="hidden sm:inline">Search</span>
          </div>
        </div>
        <div className="mt-3 flex max-w-4xl flex-wrap gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`touch-card shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                filter === item.id
                  ? "border-primary bg-primary text-background"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {showSuggestions && (
          <div className="mt-3 flex max-w-4xl flex-wrap gap-2 overflow-x-auto pb-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQ(suggestion);
                  setSearchOpen(false);
                }}
                className="touch-card rounded-full border border-border bg-card/55 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-page loading animation */}
      {busy && (
        <div className="mt-10 flex flex-col items-center justify-center gap-8 py-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-brand-gradient shadow-glow">
              <Music className="h-9 w-9 text-background animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Searching for songs…</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Finding the best results for "{q}"
            </div>
          </div>
          <div className="flex h-10 items-end gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
              <span
                key={bar}
                className="eq-bar w-2.5 rounded-full bg-primary"
                style={{ height: `${12 + ((bar * 9) % 28)}px`, animationDelay: `${bar * 0.07}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Request form */}
      <form
        onSubmit={requestYouTubeSong}
        className="mt-6 max-w-3xl rounded-xl border border-border bg-card/40 p-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Youtube className="h-4 w-4 text-primary" /> Request a YouTube song
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={ytUrl}
            onChange={(event) => setYtUrl(event.target.value)}
            placeholder="Paste a YouTube song URL"
            className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm"
          />
          <select
            value={ytLanguage}
            onChange={(event) => setYtLanguage(event.target.value)}
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm"
          >
            {["tamil", "hindi", "telugu", "malayalam", "english", "kannada"].map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <button
            disabled={requesting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {requesting ? "Sending..." : "Request"}
          </button>
        </div>
      </form>

      {/* YouTube results */}
      {!busy && ytSearchError && (
        <div className="mt-6 max-w-3xl rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Search failed: {ytSearchError}
        </div>
      )}

      {!busy && shouldSearchYouTube && ytResults.length > 0 && (
        <section className="mt-8 max-w-5xl animate-fade-up [animation-fill-mode:both]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Youtube className="h-5 w-5 text-primary" /> {filter === "youtube" ? "YouTube songs" : "Search results"}
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {visibleResults.length}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleResults.map((result, i) => (
                <div
                  key={result.videoId}
                  className="animate-fade-up [animation-fill-mode:both]"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <YouTubeResultCard
                    result={result}
                    requesting={requesting && requestingUrl === result.sourceUrl}
                    onRequest={() => requestUrl(result.sourceUrl)}
                    onPlay={() => play(youtubeResultToTrack(result), [youtubeResultToTrack(result)])}
                    onQueue={() => {
                      addToQueue(youtubeResultToTrack(result));
                      toast.success("Added to queue");
                    }}
                  />
                </div>
              ))}
          </div>
        </section>
      )}



      {/* No results */}
      {noResults && (
        <div className="mt-10 animate-fade-up [animation-fill-mode:both]">
          <div className="max-w-3xl rounded-2xl border border-border bg-card/45 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <SearchIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Try another music search</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Use a movie, artist, mood, or paste the YouTube song URL in the request box.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.slice(0, 6).map((item) => (
                    <button
                      key={item}
                      onClick={() => setQ(item)}
                      className="rounded-full border border-border bg-background/55 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 w-full">
            <YouTubeRow title="You might like these" limit={24} showSourceLabel={false} />
          </div>
        </div>
      )}

      {/* Default: no query → show trending */}
      {!hasQuery && (
        <div className="mt-12">
          <YouTubeRow title="Trending on YouTube" limit={80} showSourceLabel={false} />
        </div>
      )}
    </div>
  );
}

function YouTubeResultCard({
  result,
  requesting,
  onRequest,
  onPlay,
  onQueue,
}: {
  result: YouTubeResult;
  requesting: boolean;
  onRequest: () => void;
  onPlay: () => void;
  onQueue: () => void;
}) {
  return (
    <div className="touch-card flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-3 transition hover:bg-card/70 sm:flex-row sm:items-center">
      <img
        src={result.thumbnail}
        alt=""
        className="h-44 w-full rounded-xl bg-secondary object-cover sm:h-24 sm:w-40"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="line-clamp-2 text-sm font-semibold">{result.title}</div>
          {result.type && (
            <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {result.type}
            </span>
          )}
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{result.channel}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onPlay}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-background"
          >
            <Play className="h-3.5 w-3.5 fill-background" />
            Play
          </button>
          <button
            onClick={onQueue}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-background/55 px-3.5 py-2 text-xs font-semibold text-foreground"
          >
            <ListPlus className="h-3.5 w-3.5" />
            Queue
          </button>
          {!result.approved && (
            <button
              onClick={onRequest}
              disabled={requesting}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-background/55 px-3.5 py-2 text-xs font-semibold text-foreground disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {requesting ? "Sending..." : "Request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function youtubeResultToTrack(result: YouTubeResult): Track {
  return {
    id: `yt_${result.videoId}`,
    title: result.title,
    artist: result.channel,
    cover: result.thumbnail,
    audio: "",
    kind: "youtube",
    ytId: result.videoId,
  };
}

function MusicLoadingMini() {
  return (
    <span className="inline-flex h-4 items-end gap-0.5" aria-label="Loading">
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className="eq-bar w-1 rounded-full bg-primary"
          style={{ height: `${7 + bar * 2}px`, animationDelay: `${bar * 0.09}s` }}
        />
      ))}
    </span>
  );
}

type YouTubeResult = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  sourceUrl: string;
  type?: "video" | "channel" | "playlist";
  approved?: boolean;
};
