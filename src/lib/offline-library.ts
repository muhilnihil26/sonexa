import type { Track } from "./player-store";

const KEY_PREFIX = "sonexa.offline.v1";

function keyForEmail(email?: string | null) {
  return `${KEY_PREFIX}:${(email || "guest").toLowerCase()}`;
}

export function readOfflineTracks(email?: string | null): Track[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyForEmail(email));
    return raw ? (JSON.parse(raw) as Track[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineTrack(track: Track, email?: string | null) {
  if (typeof window === "undefined") return;
  const tracks = readOfflineTracks(email);
  const next = tracks.some((item) => item.id === track.id) ? tracks : [track, ...tracks];
  localStorage.setItem(keyForEmail(email), JSON.stringify(next.slice(0, 200)));
}

export function saveOfflinePlaylist(tracks: Track[], email?: string | null) {
  if (typeof window === "undefined") return 0;
  const existing = readOfflineTracks(email);
  const next = [...existing];
  let added = 0;
  for (const track of tracks) {
    if (track.kind === "youtube" || !track.audio) continue;
    if (next.some((item) => item.id === track.id)) continue;
    next.unshift(track);
    added++;
  }
  localStorage.setItem(keyForEmail(email), JSON.stringify(next.slice(0, 200)));
  return added;
}
