import { Youtube } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SongCard } from "./SongCard";
import { isYtBroken, type Track } from "@/lib/player-store";
import { listAdminYouTubePlaylists, listAdminYouTubeTracks } from "@/lib/api/youtube.functions";
import { useProfilePrefs } from "@/lib/profile-prefs";

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

export function YouTubeRow({
  language,
  limit = 12,
  showPlaylists = true,
  title = "YouTube songs",
  showSourceLabel = true,
}: {
  language?: string;
  limit?: number;
  showPlaylists?: boolean;
  title?: string;
  showSourceLabel?: boolean;
}) {
  const listYouTube = useServerFn(listAdminYouTubeTracks);
  const listPlaylists = useServerFn(listAdminYouTubePlaylists);
  const { gridClass } = useProfilePrefs();
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

  const tracks = ((data?.tracks ?? []) as AdminYouTubeRow[])
    .filter((track) => !language || !track.language || track.language === language)
    .map(adminToTrack)
    .filter((track) => track.kind === "audio" || (!!track.ytId && !isYtBroken(track.ytId)))
    .slice(0, limit);
  const playlists = showPlaylists
    ? ((playlistData?.playlists ?? []) as AdminYouTubePlaylist[])
        .filter((playlist) => !language || !playlist.language || playlist.language === language)
        .map((playlist) => ({
          ...playlist,
          tracks: playlist.tracks
            .map(adminToTrack)
            .filter((track) => track.kind === "audio" || (!!track.ytId && !isYtBroken(track.ytId))),
        }))
        .filter((playlist) => playlist.tracks.length > 0)
    : [];

  if (!tracks.length && !playlists.length && !isLoading) return null;
  return (
    <section className="animate-fade-up space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {showSourceLabel && <Youtube className="h-6 w-6 text-primary" />}
          {title}
        </h2>
        {showSourceLabel && (
          <span className="text-xs text-muted-foreground">Approved by admin</span>
        )}
      </div>
      {isLoading ? (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-card/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className={gridClass}>
          {tracks.map((track) => (
            <SongCard key={track.id} track={track} queue={tracks} />
          ))}
        </div>
      )}
      {playlists.map((playlist) => (
        <div key={playlist.playlist_id}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold truncate">{playlist.title}</h3>
            <span className="text-xs text-muted-foreground">{playlist.tracks.length} songs</span>
          </div>
          <div className={gridClass}>
            {playlist.tracks.map((track) => (
              <SongCard
                key={`${playlist.playlist_id}-${track.id}`}
                track={track}
                queue={playlist.tracks}
                playAsQueue
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
