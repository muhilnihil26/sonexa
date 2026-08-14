import { useState, useEffect } from "react";
import { Download, CloudDownload, HardDrive, RefreshCw, Wifi, WifiOff } from "lucide-react";

export function OfflineBackup() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backupStatus, setBackupStatus] = useState<string>("idle");
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for existing backup
    const savedBackup = localStorage.getItem('sonexa.offlineBackup');
    if (savedBackup) {
      setLastBackup(new Date(parseInt(savedBackup)).toLocaleString());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const createBackup = () => {
    setBackupStatus("creating");
    
    // Simulate backup creation
    setTimeout(() => {
      const backupData = {
        timestamp: Date.now(),
        playlists: [],
        preferences: {},
        recentlyPlayed: []
      };
      
      localStorage.setItem('sonexa.offlineBackup', JSON.stringify(backupData));
      localStorage.setItem('sonexa.offlineBackup', Date.now().toString());
      setLastBackup(new Date().toLocaleString());
      setBackupStatus("completed");
      
      setTimeout(() => setBackupStatus("idle"), 3000);
    }, 2000);
  };

  const restoreBackup = () => {
    setBackupStatus("restoring");
    
    setTimeout(() => {
      const savedBackup = localStorage.getItem('sonexa.offlineBackup');
      if (savedBackup) {
        const backupData = JSON.parse(savedBackup);
        console.log("Backup restored:", backupData);
        setBackupStatus("completed");
      } else {
        setBackupStatus("error");
      }
      
      setTimeout(() => setBackupStatus("idle"), 3000);
    }, 1500);
  };

  const clearBackup = () => {
    localStorage.removeItem('sonexa.offlineBackup');
    setLastBackup(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <CloudDownload className="h-6 w-6 text-primary" />
            Offline Backup
          </h3>
          <p className="text-muted-foreground mt-1">Backup your data for offline listening</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400">
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-semibold">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-semibold">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-4 rounded-xl border border-border bg-card/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Connection Status</h4>
              <p className="text-sm text-muted-foreground">
                {isOnline ? "Connected to Sonexa servers" : "Using offline mode"}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {isOnline ? "All features available" : "Limited features available"}
          </div>
        </div>
      </div>

      {/* Backup Actions */}
      <div className="space-y-3">
        <button
          onClick={createBackup}
          disabled={backupStatus !== "idle" || !isOnline}
          className="w-full p-4 rounded-xl border border-border bg-card/40 hover:bg-card transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Create Backup</div>
              <div className="text-sm text-muted-foreground">Save playlists and preferences</div>
            </div>
          </div>
          {backupStatus === "creating" && (
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
          )}
        </button>

        <button
          onClick={restoreBackup}
          disabled={backupStatus !== "idle"}
          className="w-full p-4 rounded-xl border border-border bg-card/40 hover:bg-card transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Restore Backup</div>
              <div className="text-sm text-muted-foreground">Restore saved data</div>
            </div>
          </div>
          {backupStatus === "restoring" && (
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
          )}
        </button>
      </div>

      {/* Backup Status */}
      {backupStatus !== "idle" && (
        <div className={`p-4 rounded-xl border ${
          backupStatus === "completed" 
            ? "border-green-500/30 bg-green-500/10" 
            : backupStatus === "error"
            ? "border-red-500/30 bg-red-500/10"
            : "border-primary/30 bg-primary/10"
        }`}>
          <div className="flex items-center gap-2">
            {backupStatus === "completed" ? (
              <span className="text-green-400">✓</span>
            ) : backupStatus === "error" ? (
              <span className="text-red-400">✗</span>
            ) : (
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            )}
            <span className="font-semibold text-foreground capitalize">{backupStatus}</span>
          </div>
        </div>
      )}

      {/* Last Backup Info */}
      {lastBackup && (
        <div className="p-4 rounded-xl border border-border bg-card/40">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground">Last Backup</h4>
              <p className="text-sm text-muted-foreground">{lastBackup}</p>
            </div>
            <button
              onClick={clearBackup}
              className="text-sm text-red-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Offline Features Info */}
      <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-blue-500/10 via-background to-purple-500/10">
        <h4 className="font-semibold text-foreground mb-3">Offline Features</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Access previously played songs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>View saved playlists</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Use basic music controls</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Streamed content unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
}