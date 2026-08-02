import { Download, Film, Music, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Track } from "@/lib/player-store";
import { generateLyricsVideoFrame, generateShortsFrame, canvasToBlob, downloadBlob } from "@/lib/video-export";

export function ShortsExportButton({ track }: { track: Track }) {
  const [loading, setLoading] = useState(false);

  async function exportShorts() {
    setLoading(true);
    try {
      const canvas = await generateShortsFrame(track, track.cover);
      const blob = await canvasToBlob(canvas, "image/png");
      downloadBlob(blob, `${track.title}-shorts.png`);
      toast.success("Shorts frame downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export shorts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={exportShorts}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-background font-semibold disabled:opacity-50"
      title="Download as shorts frame"
    >
      {loading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Film className="h-4 w-4" />
      )}
      {loading ? "Exporting..." : "Export Shorts"}
    </button>
  );
}

export function LyricsVideoExportButton({ track, lyrics }: { track: Track; lyrics: string[] }) {
  const [loading, setLoading] = useState(false);

  async function exportLyricsVideo() {
    setLoading(true);
    try {
      const canvas = await generateLyricsVideoFrame(lyrics, 0);
      const blob = await canvasToBlob(canvas, "image/png");
      downloadBlob(blob, `${track.title}-lyrics.png`);
      toast.success("Lyrics frame downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export lyrics video");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={exportLyricsVideo}
      disabled={loading || !lyrics.length}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-card/80 font-semibold disabled:opacity-50"
      title="Download lyrics as video frame"
    >
      {loading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Music className="h-4 w-4" />
      )}
      {loading ? "Exporting..." : "Export Lyrics"}
    </button>
  );
}
