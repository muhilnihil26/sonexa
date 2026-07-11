import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAlbum } from "@/lib/api/catalog.functions";
import { usePlayer, type Track } from "@/lib/player-store";
import { Play, Pause, Clock, Calendar, Music2, User, Share2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/album/$id")({
  head: () => ({ meta: [{ title: "Album — Sonexa" }] }),
  component: AlbumPage,
});

function fmt(s?: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function AlbumPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getAlbum);
  const { data, isLoading } = useQuery({ queryKey: ["album", id], queryFn: () => fn({ data: { id } }) });
  const { current, isPlaying, play, toggle } = usePlayer();

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!data?.album) return <div className="p-10">Album not found.</div>;

  const artistName = (data.album as { artists?: { name?: string } }).artists?.name ?? "";
  const artistId = (data.album as { artists?: { id?: string } }).artists?.id ?? "";
  const tracks: Track[] = data.songs.map((s) => ({
    id: s.id, title: s.title, artist: (s as { artists?: { name?: string } }).artists?.name ?? artistName,
    cover: s.cover_url ?? data.album!.cover_url ?? "", audio: s.audio_url,
  }));

  const totalDuration = data.songs.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

  return (
    <div className="p-6 md:p-10 animate-page-in">
      <div className="flex flex-col md:flex-row gap-6 items-end">
        <div className="h-48 w-48 md:h-60 md:w-60 rounded-2xl overflow-hidden shadow-glow bg-secondary shrink-0">
          {data.album.cover_url && <img src={data.album.cover_url} alt={data.album.title} className="h-full w-full object-cover animate-img-in" />}
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Album</p>
          <h1 className="text-4xl md:text-6xl font-black mt-2">{data.album.title}</h1>
          <p className="mt-3 text-sm">
            {artistId
              ? <Link to="/artist/$id" params={{ id: artistId }} className="font-semibold hover:underline">{artistName}</Link>
              : artistName} · {tracks.length} songs
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {data.album.release_date?.slice(0, 4) ?? "Unknown"}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {fmt(totalDuration)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button onClick={() => tracks[0] && play(tracks[0], tracks)} disabled={!tracks.length} className="h-14 w-14 rounded-full bg-brand-gradient shadow-glow flex items-center justify-center disabled:opacity-50">
          <Play className="h-6 w-6 fill-background text-background ml-1" />
        </button>
        <button className="h-12 w-12 rounded-full border border-border bg-card/40 hover:bg-card transition flex items-center justify-center">
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Album Info */}
      {data.album.description && (
        <section className="mt-8 p-6 rounded-2xl bg-card/40 border border-border/30">
          <h2 className="text-lg font-bold mb-2">About this album</h2>
          <p className="text-sm text-muted-foreground">{data.album.description}</p>
        </section>
      )}

      {/* Track Listings */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Track Listings</h2>
        <ol className="divide-y divide-border rounded-2xl border border-border bg-card/40 overflow-hidden">
          {tracks.map((t, i) => {
            const active = current?.id === t.id;
            return (
              <li key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-card transition group">
                <button onClick={() => (active ? toggle() : play(t, tracks))} className="w-8 text-muted-foreground group-hover:text-foreground">
                  {active && isPlaying ? <Pause className="h-4 w-4" /> : <span className="group-hover:hidden">{i + 1}</span>}
                  {!active && <Play className="h-4 w-4 hidden group-hover:block" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`truncate font-medium ${active ? "text-primary" : ""}`}>{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.artist}</div>
                </div>
                <div className="text-xs text-muted-foreground">{fmt(data.songs[i].duration_seconds)}</div>
              </li>
            );
          })}
          {!tracks.length && <li className="p-6 text-sm text-muted-foreground">No songs in this album yet.</li>}
        </ol>
      </section>

      {/* Credits */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card/40 border border-border/30">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <User className="h-4 w-4 text-primary" />
              Artist
            </div>
            <div className="text-sm text-muted-foreground">{artistName}</div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/30">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Music2 className="h-4 w-4 text-primary" />
              Total Duration
            </div>
            <div className="text-sm text-muted-foreground">{fmt(totalDuration)}</div>
          </div>
          {data.album.genre && (
            <div className="p-4 rounded-xl bg-card/40 border border-border/30">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Music2 className="h-4 w-4 text-primary" />
                Genre
              </div>
              <div className="text-sm text-muted-foreground">{data.album.genre}</div>
            </div>
          )}
          {data.album.label && (
            <div className="p-4 rounded-xl bg-card/40 border border-border/30">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Share2 className="h-4 w-4 text-primary" />
                Label
              </div>
              <div className="text-sm text-muted-foreground">{data.album.label}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}