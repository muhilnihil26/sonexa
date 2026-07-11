import { useState, useEffect } from "react";
import { Download, Wifi, WifiOff, RefreshCw, Trash2, CheckCircle, AlertCircle } from "lucide-react";

interface OfflineTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  size: string;
  downloaded: boolean;
  lastUpdated: string;
}

const MOCK_OFFLINE_TRACKS: OfflineTrack[] = [
  {
    id: "1",
    title: "Naa Ready",
    artist: "Anirudh Ravichander",
    cover: "",
    size: "4.2 MB",
    downloaded: true,
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    title: "Aradhya",
    artist: "Hesham Abdul Wahab",
    cover: "",
    size: "3.8 MB",
    downloaded: true,
    lastUpdated: "5 hours ago",
  },
  {
    id: "3",
    title: "Kalaavathi",
    artist: "S. Thaman",
    cover: "",
    size: "5.1 MB",
    downloaded: false,
    lastUpdated: "1 day ago",
  },
];

export function OfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>(MOCK_OFFLINE_TRACKS);
  const [storageUsed, setStorageUsed] = useState("127 MB");
  const [storageTotal, setStorageTotal] = useState("1 GB");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const downloadTrack = (trackId: string) => {
    setOfflineTracks(
      offlineTracks.map((track) =>
        track.id === trackId ? { ...track, downloaded: true, lastUpdated: "Just now" } : track
      )
    );
  };

  const removeTrack = (trackId: string) => {
    setOfflineTracks(
      offlineTracks.map((track) =>
        track.id === trackId ? { ...track, downloaded: false } : track
      )
    );
  };

  const syncAll = () => {
    setOfflineTracks(
      offlineTracks.map((track) => ({ ...track, downloaded: true, lastUpdated: "Just now" }))
    );
  };

  const clearAll = () => {
    setOfflineTracks(
      offlineTracks.map((track) => ({ ...track, downloaded: false }))
    );
  };

  const storagePercentage = (parseInt(storageUsed) / parseInt(storageTotal)) * 100;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-4 rounded-xl border ${isOnline ? "bg-green-500/10 border-green-500/30" : "bg-orange-500/10 border-orange-500/30"}`}>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-orange-500" />
          )}
          <div>
            <div className="font-semibold">{isOnline ? "Online" : "Offline Mode"}</div>
            <div className="text-sm text-muted-foreground">
              {isOnline ? "All features available" : "Using downloaded content only"}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Info */}
      <div className="p-4 rounded-xl bg-card/40 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <span className="font-semibold">Offline Storage</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {storageUsed} / {storageTotal}
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={syncAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Sync All
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm hover:bg-destructive/20 transition"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Offline Tracks */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Downloaded Tracks</h3>
          <span className="text-sm text-muted-foreground">
            ({offlineTracks.filter((t) => t.downloaded).length} / {offlineTracks.length})
          </span>
        </div>
        <div className="space-y-2">
          {offlineTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/30"
            >
              <div className="h-12 w-12 rounded-lg bg-brand-gradient flex items-center justify-center text-background font-bold shrink-0">
                {track.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{track.title}</div>
                <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                <div className="text-xs text-muted-foreground">{track.size}</div>
              </div>
              <div className="flex items-center gap-2">
                {track.downloaded ? (
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <CheckCircle className="h-4 w-4" />
                    <span>Downloaded</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-500 text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>Not downloaded</span>
                  </div>
                )}
                <button
                  onClick={() => (track.downloaded ? removeTrack(track.id) : downloadTrack(track.id))}
                  className="px-3 py-1.5 rounded-lg bg-card/60 hover:bg-card transition text-sm"
                >
                  {track.downloaded ? "Remove" : "Download"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Offline Settings */}
      <section className="p-4 rounded-xl bg-card/40 border border-border/30">
        <h4 className="font-semibold mb-3">Offline Settings</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-download favorites</div>
              <div className="text-xs text-muted-foreground">
                Automatically download songs you like
              </div>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Download on Wi-Fi only</div>
              <div className="text-xs text-muted-foreground">
                Save mobile data by downloading only on Wi-Fi
              </div>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Audio quality</div>
              <div className="text-xs text-muted-foreground">
                Choose audio quality for downloads
              </div>
            </div>
            <select className="px-3 py-1.5 rounded-lg bg-card/60 text-sm">
              <option>High (320kbps)</option>
              <option>Medium (192kbps)</option>
              <option>Low (128kbps)</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
