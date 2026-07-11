import type { Track } from "./player-store";

type TasteProfile = {
  track: Record<string, number>;
  artist: Record<string, number>;
  language: Record<string, number>;
  kind: Record<string, number>;
  recent: Record<string, number>;
  recentTracks: Track[];
};

const emptyTaste = (): TasteProfile => ({
  track: {},
  artist: {},
  language: {},
  kind: {},
  recent: {},
  recentTracks: [],
});

function storageKey(userKey?: string | null) {
  return `sonexa.taste.${userKey || "guest"}.v1`;
}

function readTaste(userKey?: string | null): TasteProfile {
  if (typeof window === "undefined") return emptyTaste();
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    if (!raw) return emptyTaste();
    return { ...emptyTaste(), ...(JSON.parse(raw) as Partial<TasteProfile>) };
  } catch {
    return emptyTaste();
  }
}

function writeTaste(userKey: string | null | undefined, profile: TasteProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userKey), JSON.stringify(profile));
}

function bump(map: Record<string, number>, key?: string, amount = 1) {
  const clean = key?.trim().toLowerCase();
  if (!clean) return;
  map[clean] = (map[clean] ?? 0) + amount;
}

export function recordListeningTaste(track: Track, userKey?: string | null) {
  const profile = readTaste(userKey);
  bump(profile.track, track.id, 4);
  bump(profile.artist, track.artist, 2);
  bump(profile.language, track.language, 1.5);
  bump(profile.kind, track.kind ?? "audio", 1);
  profile.recent[track.id] = Date.now();
  profile.recentTracks = [
    track,
    ...(profile.recentTracks ?? []).filter((item) => item.id !== track.id),
  ].slice(0, 24);
  writeTaste(userKey, profile);
}

export function readRecentlyHeard(userKey?: string | null): Track[] {
  return readTaste(userKey).recentTracks ?? [];
}

export function scoreTrackForTaste(track: Track, userKey?: string | null) {
  const profile = readTaste(userKey);
  const last = profile.recent[track.id] ?? 0;
  const recency = last ? Math.max(0, 7 - (Date.now() - last) / 86_400_000) : 0;
  return (
    (profile.track[track.id.toLowerCase()] ?? 0) +
    (profile.artist[track.artist?.toLowerCase()] ?? 0) +
    (profile.language[(track.language ?? "").toLowerCase()] ?? 0) +
    (profile.kind[(track.kind ?? "audio").toLowerCase()] ?? 0) +
    recency
  );
}

export function rankTracksForTaste<T extends Track>(tracks: T[], userKey?: string | null): T[] {
  return [...tracks].sort((a, b) => {
    const tasteDelta = scoreTrackForTaste(b, userKey) - scoreTrackForTaste(a, userKey);
    if (tasteDelta !== 0) return tasteDelta;
    return 0;
  });
}
