import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { adminAddYouTubePlaylist } from "@/lib/api/youtube.functions";

export function SamplePlaylistImporter() {
  const addPlaylist = useServerFn(adminAddYouTubePlaylist);
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [lang, setLang] = useState("tamil");
  const [busy, setBusy] = useState(false);

  async function importPlaylist() {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const result = await addPlaylist({ data: { url: url.trim(), language: lang, limit: 25 } });
      toast.success(`Imported ${result.inserted} new videos into "${result.playlist.title}"${result.skipped ? `, skipped ${result.skipped}` : ""}`);
      setUrl("");
      // Invalidate queries that list playlists and tracks
      qc.invalidateQueries({ queryKey: ["youtube-playlists"] });
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Playlist import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Plus className="h-4 w-4 text-primary" /> Add YouTube Playlist
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Paste a YouTube playlist URL to import its videos as tracks.
      </p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/playlist?list=..."
          className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-sm"
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="px-3 py-2 rounded-lg bg-input border border-border text-sm"
        >
          {["tamil", "hindi", "telugu", "malayalam", "english", "kannada"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <button
          onClick={importPlaylist}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-background/60 hover:bg-background text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {busy ? "Importing..." : "Import Playlist"}
        </button>
      </div>
    </div>
  );
}
