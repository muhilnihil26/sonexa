import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Clock, TrendingUp, Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import { readTaste } from "@/lib/listening-taste";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({ meta: [{ title: "My Stats - Sonexa" }] }),
  component: StatsPage,
});

function StatsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // get user listening history/taste
    const data = readTaste();
    setStats(data);
  }, []);

  if (!stats) return <div className="p-8 text-center text-muted-foreground">Loading stats...</div>;

  const totalTime = stats.genres ? Object.values(stats.genres).reduce((a: any, b: any) => a + b, 0) : 0;
  const topGenre = stats.genres ? Object.entries(stats.genres).sort((a: any, b: any) => b[1] - a[1])[0] : null;
  const topArtist = stats.artists ? Object.entries(stats.artists).sort((a: any, b: any) => b[1] - a[1])[0] : null;

  return (
    <div className="animate-page-in p-4 sm:p-6 md:p-8">
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-black">
        <BarChart3 className="h-8 w-8 text-primary" /> Listening Stats
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card/45 p-6 shadow-glow">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" /> Total Time
          </div>
          <div className="text-3xl font-bold">{Math.round(totalTime as number) || 0} min</div>
        </div>

        <div className="rounded-2xl border border-border bg-card/45 p-6 shadow-glow">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> Top Genre
          </div>
          <div className="text-3xl font-bold capitalize">{topGenre ? topGenre[0] : "N/A"}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card/45 p-6 shadow-glow">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Music2 className="h-4 w-4 text-primary" /> Top Artist
          </div>
          <div className="text-3xl font-bold truncate">{topArtist ? topArtist[0] : "N/A"}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card/45 p-6 shadow-glow">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" /> Activity
          </div>
          <div className="text-3xl font-bold">Level {Math.min(100, Math.floor((totalTime as number) / 10))}</div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card/45 p-6">
        <h2 className="mb-4 text-xl font-bold">Your Listening DNA</h2>
        <p className="text-muted-foreground">
          Keep playing music to see your Sonexa stats grow and evolve. We update your listening profile 
          every time you finish a song.
        </p>
      </div>
    </div>
  );
}
