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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });
      
      if (res.status === 404) return null; // Not found, try next source
      if (!res.ok) {
        console.warn(`lrclib HTTP ${res.status} for "${title}" by "${artist}"`);
        return null;
      }
      
      const json = await res.json() as { syncedLyrics?: string | null; plainLyrics?: string | null };
      const synced = json.syncedLyrics ? parseSynced(json.syncedLyrics) : null;
      const plain = json.plainLyrics ?? (synced ? synced.map((l) => l.text).join("\n") : "");
      
      if (synced?.length || plain.trim()) {
        return { status: "found", synced, plain };
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.warn(`lrclib timeout for "${title}" by "${artist}"`);
    } else {
      console.error("lrclib error:", e);
    }
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
      `${normalTitle} ${normalArtist}`,
      `${normalTitle}`,
      `${artist} ${title}`,
      `${title} ${artist}`,
    ];

    for (const query of queries) {
      try {
        const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const res = await fetch(url, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
            }
          });
          
          if (!res.ok) {
            console.warn(`lrclib search HTTP ${res.status} for query: "${query}"`);
            continue;
          }
          
          const results = await res.json() as Array<{ id: number; title: string; artist: string; syncedLyrics?: string | null; plainLyrics?: string | null }>;
          
          if (results.length > 0) {
            // Find best match by similarity
            const best = results.find(r => 
              r.title.toLowerCase().includes(normalTitle) || 
              normalTitle.includes(r.title.toLowerCase())
            ) || results[0];
            
            const synced = best.syncedLyrics ? parseSynced(best.syncedLyrics) : null;
            const plain = best.plainLyrics ?? (synced ? synced.map((l) => l.text).join("\n") : "");
            
            if (synced?.length || plain.trim()) {
              return { status: "found", synced, plain };
            }
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          console.warn(`lrclib search timeout for query: "${query}"`);
        } else {
          console.error(`search error for query "${query}":`, e);
        }
        continue;
      }
    }
    return null;
  } catch (e) {
    console.error("search error:", e);
    return null;
  }
}

async function fetchFromGenius(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Use lyrics.ovh API as fallback
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });
      
      if (!res.ok) {
        console.warn(`lyrics.ovh HTTP ${res.status} for "${title}" by "${artist}"`);
        return null;
      }
      
      const data = await res.json() as { lyrics?: string };
      const plain = data.lyrics;
      
      if (plain && plain.trim() && !plain.includes("Lyrics not found")) {
        return { status: "found", synced: null, plain };
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.warn(`lyrics.ovh timeout for "${title}" by "${artist}"`);
    } else {
      console.error("lyrics.ovh error:", e);
    }
    return null;
  }
}

async function fetchFromChartLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // ChartLyrics API - free lyrics source
    const url = `https://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      
      if (!res.ok) {
        console.warn(`chartlyrics HTTP ${res.status} for "${title}" by "${artist}"`);
        return null;
      }
      
      const text = await res.text();
      
      // Parse XML response
      if (text && text.includes("<Lyric>") && !text.includes("<Lyric />")) {
        const match = text.match(/<Lyric>(.*?)<\/Lyric>/s);
        if (match && match[1].trim()) {
          const plain = match[1].trim();
          if (plain && !plain.toLowerCase().includes("lyrics not found")) {
            return { status: "found", synced: null, plain };
          }
        }
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.warn(`chartlyrics timeout for "${title}" by "${artist}"`);
    } else {
      console.error("chartlyrics error:", e);
    }
    return null;
  }
}

async function fetchFromLyricsify(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Lyricsify API - another free source
    const url = `https://lyricsify.com/api/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });
      
      if (!res.ok) {
        console.warn(`lyricsify HTTP ${res.status} for "${title}" by "${artist}"`);
        return null;
      }
      
      const data = await res.json() as { lyrics?: string };
      
      if (data.lyrics && data.lyrics.trim() && !data.lyrics.toLowerCase().includes("lyrics not found")) {
        return { status: "found", synced: null, plain: data.lyrics };
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.warn(`lyricsify timeout for "${title}" by "${artist}"`);
    } else {
      console.error("lyricsify error:", e);
    }
    return null;
  }
}

async function fetchFromVagalume(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Vagalume API - Brazilian lyrics service
    const url = `https://api.vagalume.com.br/search.php?art=${encodeURIComponent(artist)}&mus=${encodeURIComponent(title)}&apikey=660a4395aee69fd836a644f058b9b18f`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });
      
      if (!res.ok) {
        console.warn(`vagalume HTTP ${res.status} for "${title}" by "${artist}"`);
        return null;
      }
      
      const data = await res.json() as { mus?: { 0?: { text?: string } }; error?: boolean };
      
      if (data.error) {
        console.warn(`vagalume error for "${title}" by "${artist}"`);
        return null;
      }
      
      if (data.mus?.[0]?.text && data.mus[0].text.trim()) {
        return { status: "found", synced: null, plain: data.mus[0].text };
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.warn(`vagalume timeout for "${title}" by "${artist}"`);
    } else {
      console.error("vagalume error:", e);
    }
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
    
    // Try lyrics.ovh as fallback
    if (!result) {
      result = await fetchFromGenius(title, artist);
    }
    
    // Try ChartLyrics
    if (!result) {
      result = await fetchFromChartLyrics(title, artist);
    }
    
    // Try Lyricsify
    if (!result) {
      result = await fetchFromLyricsify(title, artist);
    }
    
    // Try Vagalume
    if (!result) {
      result = await fetchFromVagalume(title, artist);
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