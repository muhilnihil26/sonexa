import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getArtist } from "@/lib/api/catalog.functions";
import { SongCard } from "@/components/sonexa/SongCard";
import { usePlayer, type Track } from "@/lib/player-store";
import { Play, BadgeCheck, Calendar, MapPin, Users, Music2, Globe, Share2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/artist/$id")({
  head: () => ({ meta: [{ title: "Artist — Sonexa" }] }),
  component: ArtistPage,
});

function ArtistPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getArtist);
  const { data, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: () => fn({ data: { id } }),
  });
  const { play } = usePlayer();

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!data?.artist) return <div className="p-10">Artist not found.</div>;

  const tracks: Track[] = (data.songs ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    artist: data.artist!.name,
    artistId: s.artist_id,
    cover: s.cover_url ?? "",
    audio: s.audio_url,
  }));
  const artistImage = data.artist.image_url || tracks.find((track) => track.cover)?.cover || "";

  return (
    <div className="animate-page-in">
      <div className="relative h-72 md:h-96 overflow-hidden">
        {artistImage ? (
          <img
            src={artistImage}
            alt={data.artist.name}
            className="h-full w-full object-cover animate-img-in"
          />
        ) : (
          <div className="h-full w-full bg-brand-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-6 left-6 md:left-10">
          {data.artist.verified && (
            <div className="flex items-center gap-2 text-xs text-primary mb-2">
              <BadgeCheck className="h-4 w-4" /> Verified Artist
            </div>
          )}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">{data.artist.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {data.artist.monthly_listeners?.toLocaleString() ?? 0} monthly listeners
          </p>
        </div>
      </div>
      <div className="p-6 md:p-10 space-y-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => tracks[0] && play(tracks[0], tracks)}
            disabled={!tracks.length}
            className="h-14 w-14 rounded-full bg-brand-gradient shadow-glow flex items-center justify-center disabled:opacity-50"
          >
            <Play className="h-6 w-6 fill-background text-background ml-1" />
          </button>
          <div className="text-sm text-muted-foreground">Play top tracks</div>
        </div>
        {data.artist.bio && <p className="text-muted-foreground max-w-3xl">{data.artist.bio}</p>}
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tracks.map((t) => (
              <SongCard key={t.id} track={t} queue={tracks} />
            ))}
            {!tracks.length && <p className="text-muted-foreground text-sm">No songs yet.</p>}
          </div>
        </section>
        {data.albums.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.albums.map((a) => (
                <Link
                  key={a.id}
                  to="/album/$id"
                  params={{ id: a.id }}
                  className="p-3 rounded-xl bg-card/40 hover:bg-card transition shadow-card hover:shadow-glow hover:-translate-y-1 duration-300"
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-secondary">
                    {a.cover_url && (
                      <img src={a.cover_url} alt={a.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="font-semibold text-sm truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.release_date?.slice(0, 4) ?? "Album"}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Artists */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Related Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.related_artists?.slice(0, 6).map((artist) => (
              <Link
                key={artist.id}
                to="/artist/$id"
                params={{ id: artist.id }}
                className="group p-3 rounded-xl bg-card/40 hover:bg-card transition shadow-card hover:shadow-glow hover:-translate-y-1 duration-300"
              >
                <div className="aspect-square rounded-full overflow-hidden mb-3 bg-secondary">
                  {artist.image_url && (
                    <img src={artist.image_url} alt={artist.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="font-semibold text-sm truncate text-center">{artist.name}</div>
              </Link>
            ))}
            {(!data.related_artists || data.related_artists.length === 0) && (
              <p className="text-muted-foreground text-sm col-span-full">No related artists yet.</p>
            )}
          </div>
        </section>

        {/* Concert Info */}
        {data.artist.concerts && data.artist.concerts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Upcoming Concerts</h2>
            <div className="space-y-3">
              {data.artist.concerts.map((concert) => (
                <div
                  key={concert.id}
                  className="p-4 rounded-xl bg-card/40 border border-border/30 hover:bg-card/60 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{concert.venue}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        {concert.city}, {concert.country}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(concert.date).toLocaleDateString()}
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition">
                      Get Tickets
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Artist Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card/40 border border-border/30">
            <Users className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{data.artist.monthly_listeners?.toLocaleString() ?? 0}</div>
            <div className="text-sm text-muted-foreground">Monthly Listeners</div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/30">
            <Music2 className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{tracks.length}</div>
            <div className="text-sm text-muted-foreground">Songs</div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/30">
            <Globe className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{data.albums.length}</div>
            <div className="text-sm text-muted-foreground">Albums</div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/30">
            <Share2 className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">Share</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
        </section>
      </div>
    </div>
  );
}
