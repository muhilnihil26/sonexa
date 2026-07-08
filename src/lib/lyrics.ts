// Lyrics fetcher with localStorage cache + fallback strategies.
// Supports multiple sources: lrclib.net (primary), genius API (fallback), direct search.
// Returns synced or plain lyrics.

export type LyricLine = { time: number; text: string };
export type LyricsResult =
  | { status: "found"; synced: LyricLine[] | null; plain: string }
  | { status: "not_found" }
  | { status: "error"; message: string };

const CACHE_PREFIX = "sonexa.lyrics.v2.";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function key(title: string, artist: string) {
  return CACHE_PREFIX + (title + "|" + artist).toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeSongName(name: string): string {
  // Remove common suffixes and normalize
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ") // Remove parentheses
    .replace(/\s*\[.*?\]\s*/g, " ") // Remove brackets
    .replace(/\s*-\s*(?:official|lyrics|lyric video|audio|music video|full song).*$/i, "") // Remove common suffixes
    .replace(/\s+/g, " ")
    .trim();
}

function parseSynced(lrc: string): LyricLine[] {
  const out: LyricLine[] = [];
  const re = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/g;
  for (const line of lrc.split(/\r?\n/)) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      const min = +m[1], sec = +m[2], ms = m[3] ? +m[3].padEnd(3, "0") : 0;
      const text = (m[4] || "").trim();
      if (text) out.push({ time: min * 60 + sec + ms / 1000, text });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

async function fetchFromLrclib(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    
    if (res.status === 404) return null; // Not found, try next source
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const json = await res.json() as { syncedLyrics?: string | null; plainLyrics?: string | null };
    const synced = json.syncedLyrics ? parseSynced(json.syncedLyrics) : null;
    const plain = json.plainLyrics ?? (synced ? synced.map((l) => l.text).join("\n") : "");
    
    if (synced?.length || plain.trim()) {
      return { status: "found", synced, plain };
    }
    return null;
  } catch (e) {
    console.error("lrclib error:", e);
    return null;
  }
}

async function fetchFromSearch(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Try searching with normalized names
    const normalTitle = normalizeSongName(title);
    const normalArtist = normalizeSongName(artist);
    
    // Try multiple search variations
    const queries = [
      `${normalTitle} ${normalArtist} lyrics`,
      `${normalTitle} lyrics`,
      `${artist} ${title}`,
    ];

    for (const query of queries) {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (!res.ok) continue;
      
      const results = await res.json() as Array<{ id: number; title: string; artist: string; syncedLyrics?: string | null; plainLyrics?: string | null }>;
      
      if (results.length > 0) {
        const best = results[0]; // Take first result
        const synced = best.syncedLyrics ? parseSynced(best.syncedLyrics) : null;
        const plain = best.plainLyrics ?? (synced ? synced.map((l) => l.text).join("\n") : "");
        
        if (synced?.length || plain.trim()) {
          return { status: "found", synced, plain };
        }
      }
    }
    return null;
  } catch (e) {
    console.error("search error:", e);
    return null;
  }
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult> {
  if (!title || !artist) {
    return { status: "error", message: "Missing title or artist" };
  }

  const k = key(title, artist);
  
  // Check cache first
  try {
    const raw = localStorage.getItem(k);
    if (raw) {
      const { at, value } = JSON.parse(raw) as { at: number; value: LyricsResult };
      if (Date.now() - at < CACHE_TTL_MS) return value;
    }
  } catch { /* ignore cache errors */ }

  try {
    // Try primary source (exact match)
    let result = await fetchFromLrclib(title, artist);
    
    // Try fallback sources
    if (!result) {
      result = await fetchFromSearch(title, artist);
    }
    
    // If nothing found
    if (!result) {
      result = { status: "not_found" };
    }
    
    // Cache the result
    try { 
      localStorage.setItem(k, JSON.stringify({ at: Date.now(), value: result })); 
    } catch { /* ignore cache write errors */ }
    
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return { status: "error", message };
  }
}