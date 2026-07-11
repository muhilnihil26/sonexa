import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Play, Lock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { PlayerBar } from "@/components/sonexa/PlayerBar";
import { YouTubeHost } from "@/components/sonexa/YouTubeHost";
import { LocalLibraryProvider } from "@/lib/local-library";
import { getPublicSong } from "@/lib/api/social.functions";
import { usePlayer } from "@/lib/player-store";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/song/$id")({
  head: () => ({ meta: [{ title: "Shared song - Sonexa" }] }),
  component: SharedSongPage,
});

const GUEST_PLAYS_KEY = "sonexa.guest.playstarts.v1";
const GUEST_LIMIT = 10;

function readGuestPlays() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(GUEST_PLAYS_KEY) ?? 0);
}

function SharedSongPage() {
  const { id } = Route.useParams();
  const getSong = useServerFn(getPublicSong);
  const { play } = usePlayer();
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["public-song", id],
    queryFn: () => getSong({ data: { trackId: id } }),
  });
  const track = data?.track;
  const guestPlays = readGuestPlays();
  const locked = !user && guestPlays >= GUEST_LIMIT;

  function playSharedSong() {
    if (!track) return;
    if (!user) {
      const next = readGuestPlays() + 1;
      if (next > GUEST_LIMIT) {
        toast.error("Free shared listening limit reached. Sign in to continue.");
        return;
      }
      localStorage.setItem(GUEST_PLAYS_KEY, String(next));
    }
    play(track, [track]);
  }

  async function shareSong() {
    const url = window.location.href;
    if (navigator.share && track) {
      await navigator.share({ title: track.title, text: `${track.title} - ${track.artist}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Song link copied");
    }
  }

  return (
    <LocalLibraryProvider>
      <div className="min-h-screen overflow-hidden bg-background text-foreground">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-110"
          style={{ backgroundImage: track?.cover ? `url(${track.cover})` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
          {isLoading && <div className="text-sm text-muted-foreground">Loading song...</div>}
          {!isLoading && !track && (
            <>
              <h1 className="text-3xl font-black">Song not found</h1>
              <Link
                to="/"
                className="mt-5 rounded-full bg-brand-gradient px-5 py-2 text-background"
              >
                Go to Sonexa
              </Link>
            </>
          )}
          {track && (
            <>
              <img
                src={track.cover}
                alt={track.title}
                className="aspect-square w-64 rounded-2xl object-cover shadow-glow md:w-80"
              />
              <h1 className="mt-8 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
                {track.title}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">{track.artist}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={playSharedSong}
                  disabled={locked}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3 font-semibold text-background shadow-glow disabled:opacity-50"
                >
                  {locked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-background" />
                  )}
                  {locked ? "Limit reached" : "Play song"}
                </button>
                <button
                  onClick={shareSong}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-7 py-3 font-semibold"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                {!user && (
                  <Link
                    to="/auth"
                    className="inline-flex items-center rounded-full border border-border bg-card/60 px-7 py-3 font-semibold"
                  >
                    Sign in
                  </Link>
                )}
              </div>
              {!user && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Guest listening: {Math.min(guestPlays, GUEST_LIMIT)} / {GUEST_LIMIT}
                </p>
              )}
            </>
          )}
        </main>
        <PlayerBar />
        <YouTubeHost />
      </div>
    </LocalLibraryProvider>
  );
}
