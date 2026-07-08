import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/player-store";
import { fetchLyrics, type LyricsResult } from "@/lib/lyrics";

/**
 * LyricsTicker - Shows the current lyric line in a compact format
 * Used in PlayerBar to display currently playing lyric
 */
export function LyricsTicker() {
  const { current, progress } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!current) return;
    
    let cancelled = false;
    setLoading(true);
    
    fetchLyrics(current.title, current.artist).then((result) => {
      if (!cancelled) {
        setLyrics(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  if (!current || loading) return null;
  if (!lyrics || lyrics.status !== "found" || !lyrics.synced) return null;

  // Find current lyric line
  let activeIdx = -1;
  for (let i = 0; i < lyrics.synced.length; i++) {
    if (lyrics.synced[i].time > progress) break;
    activeIdx = i;
  }

  if (activeIdx < 0 || !lyrics.synced[activeIdx]) return null;

  const currentLyric = lyrics.synced[activeIdx].text;
  const nextLyric = lyrics.synced[activeIdx + 1]?.text;

  return (
    <div className="hidden sm:flex flex-col items-center gap-1.5">
      <div className="text-xs text-primary font-semibold uppercase tracking-widest">Lyrics</div>
      <div className="text-center max-w-64">
        <div className="text-sm font-bold text-foreground truncate">{currentLyric || "♪"}</div>
        {nextLyric && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">{nextLyric}</div>
        )}
      </div>
    </div>
  );
}
