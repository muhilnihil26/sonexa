import type { Track } from "./player-store";

const LS_RECENTLY_PLAYED = "sonexa.recentlyPlayed.v1";
const LS_SEARCH_HISTORY = "sonexa.searchHistory.v1";
const LS_FAVORITES = "sonexa.favorites.v1";

export type HistoryEntry = {
  track: Track;
  timestamp: number;
  count: number;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// Recently Played
export function addToRecentlyPlayed(track: Track) {
  const recent = read<HistoryEntry[]>(LS_RECENTLY_PLAYED, []);
  const idx = recent.findIndex((e) => e.track.id === track.id);
  
  if (idx >= 0) {
    recent[idx].count++;
    recent[idx].timestamp = Date.now();
  } else {
    recent.unshift({ track, timestamp: Date.now(), count: 1 });
  }
  
  // Keep last 100 items
  if (recent.length > 100) recent.pop();
  write(LS_RECENTLY_PLAYED, recent);
}

export function getRecentlyPlayed(): HistoryEntry[] {
  return read<HistoryEntry[]>(LS_RECENTLY_PLAYED, []);
}

export function clearRecentlyPlayed() {
  write(LS_RECENTLY_PLAYED, []);
}

// Search History
export function addToSearchHistory(query: string) {
  if (!query.trim()) return;
  const history = read<string[]>(LS_SEARCH_HISTORY, []);
  const filtered = history.filter((h) => h.toLowerCase() !== query.toLowerCase());
  filtered.unshift(query);
  
  if (filtered.length > 50) filtered.pop();
  write(LS_SEARCH_HISTORY, filtered);
}

export function getSearchHistory(): string[] {
  return read<string[]>(LS_SEARCH_HISTORY, []);
}

export function clearSearchHistory() {
  write(LS_SEARCH_HISTORY, []);
}

export function removeFromSearchHistory(query: string) {
  const history = read<string[]>(LS_SEARCH_HISTORY, []);
  const filtered = history.filter((h) => h.toLowerCase() !== query.toLowerCase());
  write(LS_SEARCH_HISTORY, filtered);
}

// Favorites
export function addToFavorites(track: Track) {
  const favorites = read<Track[]>(LS_FAVORITES, []);
  if (!favorites.some((f) => f.id === track.id)) {
    favorites.unshift(track);
    if (favorites.length > 500) favorites.pop();
    write(LS_FAVORITES, favorites);
  }
}

export function removeFromFavorites(trackId: string) {
  const favorites = read<Track[]>(LS_FAVORITES, []);
  const filtered = favorites.filter((f) => f.id !== trackId);
  write(LS_FAVORITES, filtered);
}

export function isFavorited(trackId: string): boolean {
  const favorites = read<Track[]>(LS_FAVORITES, []);
  return favorites.some((f) => f.id === trackId);
}

export function getFavorites(): Track[] {
  return read<Track[]>(LS_FAVORITES, []);
}

export function clearFavorites() {
  write(LS_FAVORITES, []);
}
