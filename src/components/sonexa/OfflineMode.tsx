import { useState, useEffect } from "react";
import { Download, Wifi, WifiOff, RefreshCw, Trash2, CheckCircle, AlertCircle, Settings, HardDrive, Pause, Play } from "lucide-react";
import { readOfflineTracks, saveOfflineTrack } from "@/lib/offline-library";
import { useSession } from "@/lib/auth";
import { useLocalLibrary } from "@/lib/local-library";
import { type Track } from "@/lib/player-store";
import { toast } from "sonner";

interface OfflineTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  size: string;
  downloaded: boolean;
  lastUpdated: string;
  progress?: number;
  downloading?: boolean;
}

interface OfflineSettings {
  autoDownloadFavorites: boolean;
  wifiOnly: boolean;
  audioQuality: "high" | "medium" | "low";
  maxStorageGB: number;
}

export function OfflineMode() {
  const { user } = useSession();
  const { likes } = useLocalLibrary();
  const [isOnline, setIsOnline] = useState(true);
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(1024); // 1GB in MB
  const [settings, setSettings] = useState<OfflineSettings>({
    autoDownloadFavorites: true,
    wifiOnly: true,
    audioQuality: "high",
    maxStorageGB: 1,
  });
  const [showSettings, setShowSettings] = useState(false);

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

  // Load offline tracks from localStorage
  useEffect(() => {
    const tracks = readOfflineTracks(user?.email);
    const converted: OfflineTrack[] = tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      cover: track.cover,
      size: "0 MB", // Would need to calculate actual size
      downloaded: true,
      lastUpdated: "Recently",
    }));
    setOfflineTracks(converted);
    
    // Calculate storage usage (estimate)
    const estimatedSize = tracks.length * 4; // Assume 4MB per track
    setStorageUsed(estimatedSize);
  }, [user?.email]);

  // Auto-download favorites when settings allow
  useEffect(() => {
    if (!settings.autoDownloadFavorites || !isOnline || !user?.email) return;
    if (settings.wifiOnly && !navigator.onLine) return;

    const favoriteIds = Object.keys(likes);
    const offlineIds = offlineTracks.map((t) => t.id);
    const toDownload = favoriteIds.filter((id) => !offlineIds.includes(id));
    
    // Download up to 5 favorites at a time
    toDownload.slice(0, 5).forEach((id) => {
      const track = likes[id];
      if (track && track.kind !== "youtube" && track.audio) {
        downloadTrack(track);
      }
    });
  }, [likes, settings.autoDownloadFavorites, settings.wifiOnly, isOnline, user?.email, offlineTracks]);

  const downloadTrack = async (track: Track) => {
    if (!track.audio || track.kind === "youtube") {
      toast.error("Cannot download YouTube tracks for offline use");
      return;
    }

    // Check storage limit
    if (storageUsed >= storageTotal) {
      toast.error("Storage limit reached. Remove some tracks first.");
      return;
    }

    setOfflineTracks((prev) => [
      ...prev,
      {
        id: track.id,
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        size: "4 MB",
        downloaded: true,
        lastUpdated: "Just now",
        downloading: true,
        progress: 0,
      },
    ]);

    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setOfflineTracks((prev) =>
        prev.map((t) =>
          t.id === track.id ? { ...t, progress, downloading: progress < 100 } : t
        )
      );
      if (progress >= 100) {
        clearInterval(interval);
        saveOfflineTrack(track, user?.email);
        setStorageUsed((prev) => prev + 4);
        toast.success(`Downloaded: ${track.title}`);
      }
    }, 500);
  };

  const removeTrack = (trackId: string) => {
    setOfflineTracks((prev) => prev.filter((t) => t.id !== trackId));
    setStorageUsed((prev) => Math.max(0, prev - 4));
    toast.success("Track removed from offline storage");
  };

  const syncAll = async () => {
    if (!user?.email) return;
    
    const allTracks = Object.values(likes).filter(
      (track): track is Track =>
        Boolean(track && track.kind !== "youtube" && track.audio)
    );
    
    const existingIds = offlineTracks.map((t) => t.id);
    const toDownload = allTracks.filter((track) => !existingIds.includes(track.id));
    
    if (toDownload.length === 0) {
      toast.info("All favorites are already downloaded");
      return;
    }

    toast.info(`Syncing ${toDownload.length} tracks...`);
    
    for (const track of toDownload.slice(0, 10)) {
      await downloadTrack(track);
    }
  };

  const clearAll = () => {
    if (!confirm("Are you sure you want to remove all offline tracks?")) return;
    setOfflineTracks([]);
    setStorageUsed(0);
    localStorage.removeItem(`sonexa.offline.v1:${(user?.email || "guest").toLowerCase()}`);
    toast.success("All offline tracks cleared");
  };

  const storagePercentage = (storageUsed / storageTotal) * 100;

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
                  onClick={() => removeTrack(track.id)}
                  className="px-3 py-1.5 rounded-lg bg-card/60 hover:bg-card transition text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Offline Settings */}
      <section className="p-4 rounded-xl bg-card/40 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" /> Offline Settings
          </h4>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-primary hover:underline"
          >
            {showSettings ? "Hide" : "Show"}
          </button>
        </div>
        {showSettings && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto-download favorites</div>
                <div className="text-xs text-muted-foreground">
                  Automatically download songs you like
                </div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded accent-primary"
                checked={settings.autoDownloadFavorites}
                onChange={(e) => setSettings({ ...settings, autoDownloadFavorites: e.target.checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Download on Wi-Fi only</div>
                <div className="text-xs text-muted-foreground">
                  Save mobile data by downloading only on Wi-Fi
                </div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded accent-primary"
                checked={settings.wifiOnly}
                onChange={(e) => setSettings({ ...settings, wifiOnly: e.target.checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Audio quality</div>
                <div className="text-xs text-muted-foreground">
                  Choose audio quality for downloads
                </div>
              </div>
              <select
                className="px-3 py-1.5 rounded-lg bg-card/60 text-sm"
                value={settings.audioQuality}
                onChange={(e) => setSettings({ ...settings, audioQuality: e.target.value as any })}
              >
                <option value="high">High (320kbps)</option>
                <option value="medium">Medium (192kbps)</option>
                <option value="low">Low (128kbps)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Max storage</div>
                <div className="text-xs text-muted-foreground">
                  Maximum offline storage limit
                </div>
              </div>
              <select
                className="px-3 py-1.5 rounded-lg bg-card/60 text-sm"
                value={settings.maxStorageGB}
                onChange={(e) => setSettings({ ...settings, maxStorageGB: parseInt(e.target.value) })}
              >
                <option value={0.5}>500 MB</option>
                <option value={1}>1 GB</option>
                <option value={2}>2 GB</option>
                <option value={5}>5 GB</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Storage Management */}
      <section className="p-4 rounded-xl bg-card/40 border border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="h-4 w-4 text-primary" />
          <h4 className="font-semibold">Storage Management</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">{storageUsed} MB</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-medium">{storageTotal - storageUsed} MB</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tracks</span>
            <span className="font-medium">{offlineTracks.length}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
