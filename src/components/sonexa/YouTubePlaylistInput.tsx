/**
 * YouTubePlaylistInput — allows users to input YouTube song or playlist URLs
 * Extracts video IDs and creates playable tracks
 */
import { useState } from "react";
import { Youtube, Play, Plus, X, Loader2 } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { toast } from "sonner";
import { notifyError, notifySuccess } from "@/lib/notifications";

export function YouTubePlaylistInput() {
  const { play } = usePlayer();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Extract YouTube video ID from various URL formats
  function extractVideoId(input: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Extract playlist ID from YouTube playlist URL
  function extractPlaylistId(input: string): string | null {
    const match = input.match(/[?&]list=([^&\n]+)/);
    return match ? match[1] : null;
  }

  async function fetchVideoInfo(videoId: string) {
    try {
      // Using noembed for basic video info (no API key needed)
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error || "Could not fetch video info");
      }

      return {
        title: data.title || "Unknown Title",
        artist: data.author_name || "Unknown Artist",
        thumbnail: data.thumbnail_url || "",
      };
    } catch (error) {
      console.error("Failed to fetch video info:", error);
      // Fallback to generic info
      return {
        title: "YouTube Video",
        artist: "Unknown Artist",
        thumbnail: "",
      };
    }
  }

  async function handleAdd() {
    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    const videoId = extractVideoId(url);
    const playlistId = extractPlaylistId(url);

    if (!videoId && !playlistId) {
      toast.error("Invalid YouTube URL. Please enter a valid video or playlist URL.");
      return;
    }

    setLoading(true);

    try {
      if (videoId) {
        // Single video
        const info = await fetchVideoInfo(videoId);
        
        const track = {
          id: `yt-${videoId}`,
          title: info.title,
          artist: info.artist,
          cover: info.thumbnail || "/logo-icon.png",
          audio: "", // YouTube uses its own player
          duration: 0,
          kind: "youtube" as const,
          ytId: videoId,
        };

        play(track, [track]);
        notifySuccess(`Playing: ${info.title}`);
        setUrl("");
        setIsOpen(false);
      } else if (playlistId) {
        // Playlist - for now, just notify that playlist support is coming
        toast.info("Playlist support coming soon! For now, add individual videos.");
        // TODO: Implement playlist fetching using YouTube API
      }
    } catch (error) {
      console.error("Error adding YouTube video:", error);
      notifyError("Failed to add video. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/40 backdrop-blur hover:bg-card transition text-sm"
      >
        <Youtube className="h-4 w-4" />
        Add YouTube URL
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-glow p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Add YouTube Content</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-background/60 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">YouTube URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loading}
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>https://youtube.com/watch?v=VIDEO_ID</li>
              <li>https://youtu.be/VIDEO_ID</li>
              <li>https://youtube.com/shorts/VIDEO_ID</li>
              <li>Direct VIDEO_ID (11 characters)</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading || !url.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-background font-semibold hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play Now
                </>
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-background/60 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
