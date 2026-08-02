import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  Shield,
  Sparkles,
  Trash2,
  Pencil,
  Save,
  X,
  Youtube,
  Plus,
  Search,
  Check,
  Ban,
  AlertTriangle,
  Copy,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Download,
  Pause,
  Play,
  RefreshCw,
  BarChart3,
  Users,
  Settings,
  LayoutGrid,
  Activity,
  Zap,
  Globe,
  Database,
  Clock,
  TrendingUp,
  Radio,
  Music2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useIsAdmin } from "@/lib/auth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateSongFromUpload,
  adminCreateUploadUrls,
  seedFromITunes,
  adminListSongs,
  adminUpdateSong,
  adminDeleteSong,
} from "@/lib/api/catalog.functions";
import { SamplePlaylistImporter } from "@/components/sonexa/SamplePlaylistImporter";
import { DownloadScheduler, DiscoveryScheduler } from "@/components/sonexa/SchedulerComponents";
import {
  adminAddYouTubeChannel,
  adminAddYouTubePlaylist,
  adminAddYouTubeTrack,
  adminAttachYouTubeBackup,
  adminCreateYouTubeBackupUploadUrl,
  adminListYouTubeRequests,
  adminRemoveYouTubeTrack,
  adminReviewYouTubeRequest,
  listAdminYouTubeTracks,
  listAdminYouTubePlaylists,
  lookupYouTube,
  searchYouTube,
  adminStartBulkDownload,
  adminGetDownloadStatus,
  adminCancelDownload,
  adminDiscoverYouTubeContent,
  adminAutoDiscoverTamilContent,
  adminCreateRadioStation,
  adminUpdateRadioStation,
  adminDeleteRadioStation,
  listRadioStations,
  adminUpdateYouTubePlaylist,
  adminDeleteYouTubePlaylist,
} from "@/lib/api/youtube.functions";
import {
  adminSetFeatureConfig,
  adminSetIntroConfig,
  getFeatureConfig,
  getIntroConfig,
  getHomeConfig,
  adminSetHomeConfig,
} from "@/lib/api/social.functions";
import {
  getAllSchedulesStatus,
  getSyncHistory,
} from "@/lib/api/scheduler.functions";
import {
  getUserCloudLibrary,
  createCloudUploadUrls,
  addCloudTrack,
  deleteCloudTrack,
  getCloudTrackUrl,
} from "@/lib/api/cloud-library.functions";
import {
  adminCreateApiKey,
  adminListApiKeys,
  adminRevokeApiKey,
} from "@/lib/api/api-keys.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin - Sonexa" }] }),
  component: Admin,
});

const YOUTUBE_BACKUP_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function isYouTubeBackupDue(createdAt?: string | null) {
  if (!createdAt) return false;
  const time = new Date(createdAt).getTime();
  return Number.isFinite(time) && Date.now() - time >= YOUTUBE_BACKUP_AFTER_MS;
}

function Admin() {
  const { user, loading } = useSession();
  const isAdmin = useIsAdmin(user?.email);
  const createUploadUrls = useServerFn(adminCreateUploadUrls);
  const createSongFromUpload = useServerFn(adminCreateSongFromUpload);
  const listAdmin = useServerFn(adminListSongs);
  const seed = useServerFn(seedFromITunes);
  const [seedQ, setSeedQ] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="p-10 max-w-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-8 bg-primary/20 rounded" />
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-10 max-w-xl">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Admin only</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in with <code>muhilsiddhesh.in@gmail.com</code> to manage Sonexa.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!audio || !cover || !title || !artist) return toast.error("Fill all fields");
    setBusy(true);
    try {
      const existing = await listAdmin();
      const duplicate = (existing.songs ?? []).find(
        (song) =>
          String(song.title ?? "")
            .trim()
            .toLowerCase() === title.trim().toLowerCase(),
      );
      if (
        duplicate &&
        !confirm(`A song named "${title}" already exists. Do you still want to add it?`)
      ) {
        return;
      }
      const upload = await createUploadUrls({
        data: { audioName: audio.name, coverName: cover.name },
      });
      const audioPath = upload.audio.path;
      const coverPath = upload.cover.path;
      const { error: e1 } = await supabase.storage
        .from("audio")
        .uploadToSignedUrl(audioPath, upload.audio.token, audio);
      if (e1) throw e1;
      const { error: e2 } = await supabase.storage
        .from("covers")
        .uploadToSignedUrl(coverPath, upload.cover.token, cover);
      if (e2) throw e2;
      await createSongFromUpload({
        data: { title, artist, audioPath, coverPath, language: "Tamil" },
      });
      toast.success("Song added");
      setTitle("");
      setArtist("");
      setAudio(null);
      setCover(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-3">
          <Shield className="h-6 w-6 md:h-7 md:w-7 text-primary" /> Admin Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Manage your Sonexa music platform - songs, YouTube content, features, and settings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutGrid },
          { id: 'upload', label: 'Upload', icon: Upload },
          { id: 'cloud', label: 'Cloud Library', icon: Database },
          { id: 'youtube', label: 'YouTube', icon: Youtube },
          { id: 'radio', label: 'Radio', icon: Radio },
          { id: 'playlists', label: 'Playlists', icon: LayoutGrid },
          { id: 'features', label: 'Features', icon: Settings },
          { id: 'api', label: 'API Keys', icon: KeyRound },
          { id: 'songs', label: 'Songs', icon: Music2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                activeTab === tab.id
                  ? 'bg-brand-gradient text-background shadow-glow scale-105'
                  : 'bg-background/40 text-muted-foreground hover:bg-background/60 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-up">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'cloud' && <CloudLibraryManager />}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <form onSubmit={submit} className="p-5 rounded-xl border border-border bg-card/40 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Upload Song
              </h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title"
                className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 ring-primary touch-manipulation"
              />
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
                className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 ring-primary touch-manipulation"
              />
              <label className="block">
                <span className="text-sm text-muted-foreground">Audio file</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-sm touch-manipulation"
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted-foreground">Cover image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-sm touch-manipulation"
                />
              </label>
              <button
                disabled={busy}
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-gradient text-background font-semibold shadow-glow disabled:opacity-60 touch-manipulation min-h-[44px]"
              >
                {busy ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload song
                  </>
                )}
              </button>
            </form>

            <div className="p-5 rounded-xl border border-border bg-card/40">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> Seed catalog (iTunes legal previews)
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Pulls Tamil tracks from the public iTunes Search API with preview audio, cover art, artist
                and album metadata.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={seedQ}
                  onChange={(e) => setSeedQ(e.target.value)}
                  placeholder="Optional extra query"
                  className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-sm touch-manipulation"
                />
                <button
                  onClick={async () => {
                    setSeeding(true);
                    try {
                      const r = await seed({ data: seedQ ? { extraQuery: seedQ } : {} });
                      toast.success(
                        `Seeded ${r.inserted} songs / ${r.artistsCreated} artists / ${r.albumsCreated} albums`,
                      );
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Seed failed");
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  disabled={seeding}
                  className="px-5 py-2 rounded-lg bg-brand-gradient text-background font-semibold shadow-glow disabled:opacity-60 touch-manipulation min-h-[44px]"
                >
                  {seeding ? "Seeding..." : "Seed Tamil catalog"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'youtube' && <YouTubeAdder />}
        {activeTab === 'radio' && <RadioStationManager />}
        {activeTab === 'playlists' && <PlaylistManager />}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <FeatureConfigManager />
            <HomeConfigManager />
            <IntroConfigManager />
          </div>
        )}
        {activeTab === 'api' && <ApiKeyManager />}
        {activeTab === 'songs' && (
          <div className="space-y-6">
            <ManageSongs />
            <YouTubeRequests />
            <DownloadScheduler />
            <DiscoveryScheduler />
            <SamplePlaylistImporter />
          </div>
        )}
      </div>
    </div>
  );
}

function AdminOverview() {
  const listAdmin = useServerFn(adminListSongs);
  const listTracks = useServerFn(listAdminYouTubeTracks);
  const listStations = useServerFn(listRadioStations);
  const listPlaylists = useServerFn(listAdminYouTubePlaylists);
  const getSchedulesStatus = useServerFn(getAllSchedulesStatus);
  const getHistory = useServerFn(getSyncHistory);
  
  const { data: songsData } = useQuery({ queryKey: ["admin-songs-overview"], queryFn: () => listAdmin() });
  const { data: youtubeData } = useQuery({ queryKey: ["admin-youtube-overview"], queryFn: () => listTracks() });
  const { data: stationsData } = useQuery({ queryKey: ["admin-stations-overview"], queryFn: () => listStations() });
  const { data: playlistsData } = useQuery({ queryKey: ["admin-playlists-overview"], queryFn: () => listPlaylists() });
  const { data: schedulesStatus } = useQuery({ queryKey: ["schedules-status"], queryFn: () => getSchedulesStatus() });
  const { data: syncHistory } = useQuery({ queryKey: ["sync-history"], queryFn: () => getHistory() });

  const songsCount = songsData?.songs?.length || 0;
  const youtubeCount = youtubeData?.tracks?.length || 0;
  const stationsCount = stationsData?.stations?.length || 0;
  const playlistsCount = playlistsData?.playlists?.length || 0;

  const stats = [
    { label: 'Total Songs', value: songsCount, icon: Music2, color: 'from-purple-500 to-pink-500' },
    { label: 'YouTube Tracks', value: youtubeCount, icon: Youtube, color: 'from-red-500 to-orange-500' },
    { label: 'Radio Stations', value: stationsCount, icon: Radio, color: 'from-green-500 to-teal-500' },
    { label: 'Playlists', value: playlistsCount, icon: LayoutGrid, color: 'from-blue-500 to-indigo-500' },
  ];

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-5 rounded-xl border border-border bg-card/40 backdrop-blur-sm hover:scale-105 transition-transform duration-200 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3 shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Sync Status Section */}
      <div className="p-5 rounded-xl border border-border bg-card/40">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" /> Sync Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download Schedule Status */}
          <div className="p-4 rounded-lg bg-background/40 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-400" />
                <span className="font-medium">Download Schedule</span>
              </div>
              {schedulesStatus?.download?.enabled ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Check className="h-3 w-3" /> Enabled
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Ban className="h-3 w-3" /> Disabled
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Last run:</span>
                <span>{formatTime(schedulesStatus?.download?.lastRunAt)}</span>
              </div>
              {schedulesStatus?.download?.errorCount && schedulesStatus.download.errorCount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Errors:</span>
                  <span>{schedulesStatus.download.errorCount}</span>
                </div>
              )}
              {schedulesStatus?.download?.lastError && (
                <div className="text-xs text-red-400 truncate" title={schedulesStatus.download.lastError}>
                  {schedulesStatus.download.lastError}
                </div>
              )}
            </div>
          </div>

          {/* Discovery Schedule Status */}
          <div className="p-4 rounded-lg bg-background/40 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="font-medium">Discovery Schedule</span>
              </div>
              {schedulesStatus?.discovery?.enabled ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Check className="h-3 w-3" /> Enabled
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Ban className="h-3 w-3" /> Disabled
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Last run:</span>
                <span>{formatTime(schedulesStatus?.discovery?.lastRunAt)}</span>
              </div>
              {schedulesStatus?.discovery?.errorCount && schedulesStatus.discovery.errorCount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Errors:</span>
                  <span>{schedulesStatus.discovery.errorCount}</span>
                </div>
              )}
              {schedulesStatus?.discovery?.lastError && (
                <div className="text-xs text-red-400 truncate" title={schedulesStatus.discovery.lastError}>
                  {schedulesStatus.discovery.lastError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync History */}
      {syncHistory?.history && syncHistory.history.length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card/40">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" /> Sync History
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {syncHistory.history.slice(0, 10).map((entry: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  entry.status === 'success'
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {entry.status === 'success' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="font-medium capitalize">{entry.type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(entry.timestamp)}</span>
                </div>
                <div className="text-sm text-muted-foreground">{entry.message}</div>
                {entry.itemCount && (
                  <div className="text-xs text-muted-foreground">{entry.itemCount} items processed</div>
                )}
                {entry.error && (
                  <div className="text-xs text-red-400 mt-1">{entry.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CloudLibraryManager() {
  const qc = useQueryClient();
  const getLibrary = useServerFn(getUserCloudLibrary);
  const createUploadUrls = useServerFn(createCloudUploadUrls);
  const addTrack = useServerFn(addCloudTrack);
  const deleteTrack = useServerFn(deleteCloudTrack);
  const { data: libraryData, isLoading } = useQuery({
    queryKey: ["cloud-library"],
    queryFn: () => getLibrary(),
  });
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<any>(null);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audio || !title || !artist) return toast.error("Please fill all required fields");
    setBusy(true);
    try {
      const urls = await createUploadUrls({
        data: {
          audioName: audio.name,
          audioSize: audio.size,
          audioMimeType: audio.type,
          coverName: cover?.name,
        },
      });
      setUploadUrls(urls);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get upload URLs");
      setBusy(false);
    }
  };

  const onUploadFiles = async () => {
    if (!uploadUrls || !audio) return;
    setBusy(true);
    try {
      const { error: audioError } = await supabase.storage
        .from("cloud-audio")
        .uploadToSignedUrl(uploadUrls.audio.path, uploadUrls.audio.token, audio);
      if (audioError) throw audioError;

      if (cover && uploadUrls.cover) {
        const { error: coverError } = await supabase.storage
          .from("cloud-covers")
          .uploadToSignedUrl(uploadUrls.cover.path, uploadUrls.cover.token, cover);
        if (coverError) throw coverError;
      }

      await addTrack({
        data: {
          title,
          artist,
          album: album || undefined,
          audioPath: uploadUrls.audio.path,
          coverPath: uploadUrls.cover?.path || undefined,
          fileSize: audio.size,
          mimeType: audio.type,
        },
      });

      toast.success("Track added to cloud library");
      setTitle("");
      setArtist("");
      setAlbum("");
      setAudio(null);
      setCover(null);
      setUploadUrls(null);
      await qc.invalidateQueries({ queryKey: ["cloud-library"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (trackId: string) => {
    if (!confirm("Delete this track from cloud library?")) return;
    setBusy(true);
    try {
      await deleteTrack({ data: { trackId } });
      toast.success("Track deleted");
      await qc.invalidateQueries({ queryKey: ["cloud-library"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Storage Info */}
      <div className="p-5 rounded-xl border border-border bg-card/40">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-primary" /> Cloud Storage
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Storage Used:</span>
            <span className="font-medium">{libraryData?.storageUsed || 0} MB / {libraryData?.storageLimit || 500} MB</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gradient transition-all duration-300"
              style={{
                width: `${((libraryData?.storageUsed || 0) / (libraryData?.storageLimit || 500)) * 100}%`,
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {libraryData?.library?.tracks.length || 0} tracks in library
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="p-5 rounded-xl border border-border bg-card/40">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5 text-primary" /> Upload to Cloud
        </h3>
        {!uploadUrls ? (
          <form onSubmit={onUpload} className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title *"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 ring-primary"
            />
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name *"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 ring-primary"
            />
            <input
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="Album (optional)"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 ring-primary"
            />
            <label className="block">
              <span className="text-sm text-muted-foreground">Audio file *</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted-foreground">Cover image (optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm"
              />
            </label>
            <button
              disabled={busy}
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-gradient text-background font-semibold shadow-glow disabled:opacity-60"
            >
              {busy ? "Getting upload URLs..." : "Upload"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload URLs generated. Uploading files...</p>
            <button
              disabled={busy}
              onClick={onUploadFiles}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-gradient text-background font-semibold shadow-glow disabled:opacity-60"
            >
              {busy ? "Uploading..." : "Confirm Upload"}
            </button>
            <button
              disabled={busy}
              onClick={() => setUploadUrls(null)}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-background/60"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Track List */}
      {libraryData?.library?.tracks && libraryData.library.tracks.length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card/40">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Music2 className="h-5 w-5 text-primary" /> Your Tracks
          </h3>
          <div className="space-y-2">
            {libraryData.library.tracks.map((track: any) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{track.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                  <div className="text-xs text-muted-foreground">{formatSize(track.fileSize)}</div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => onDelete(track.id)}
                  className="ml-3 p-2 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApiKeyManager() {
  const qc = useQueryClient();
  const listKeys = useServerFn(adminListApiKeys);
  const createKey = useServerFn(adminCreateApiKey);
  const revokeKey = useServerFn(adminRevokeApiKey);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: () => listKeys(),
  });
  const [name, setName] = useState("Sonexa catalog API");
  const [createdKey, setCreatedKey] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = "https://sonexa-listen-beyond-main.vercel.app/api/sonexa/catalog";

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const onCreate = async () => {
    if (!name.trim()) return toast.error("Enter a key name");
    setBusy(true);
    try {
      const result = await createKey({ data: { name: name.trim() } });
      setCreatedKey(result.key);
      toast.success("API key created");
      await qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create API key");
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (id: string) => {
    setBusy(true);
    try {
      await revokeKey({ data: { id } });
      toast.success("API key revoked");
      await qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke API key");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-4 sm:p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <KeyRound className="h-5 w-5 text-emerald-300" />
            Admin catalog API keys
          </div>
          <p className="mt-1 max-w-2xl text-sm text-white/60">
            Create keys for reading Sonexa songs, audio links, and thumbnails from the web API.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300 touch-manipulation min-h-[44px]"
          placeholder="Key name"
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-black disabled:opacity-50 touch-manipulation min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          Create API key
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-white">Request format</span>
          <button
            type="button"
            onClick={() => copy(`curl -H "x-sonexa-api-key: sx_your_key" "${endpoint}"`)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10 touch-manipulation min-h-[36px]"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy curl
          </button>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/45 p-3 text-xs text-emerald-100">{`GET ${endpoint}
x-sonexa-api-key: sx_your_key`}</pre>
      </div>

      {createdKey ? (
        <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-100">
              Copy this key now. It will not be shown again.
            </p>
            <button
              type="button"
              onClick={() => copy(createdKey)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black touch-manipulation min-h-[36px]"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy key
            </button>
          </div>
          <code className="mt-3 block overflow-x-auto rounded-lg bg-black/60 p-3 text-xs text-emerald-100">
            {createdKey}
          </code>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {isLoading ? <p className="text-sm text-white/50">Loading keys...</p> : null}
        {(data?.keys ?? []).map((key) => (
          <div
            key={key.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div>
              <div className="text-sm font-semibold text-white">{key.name}</div>
              <div className="text-xs text-white/45">
                {key.keyPrefix}... / {key.active ? "active" : "revoked"} / {key.createdAt}
              </div>
            </div>
            {key.active ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onRevoke(key.id)}
                className="rounded-lg border border-red-300/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-50 touch-manipulation min-h-[36px]"
              >
                Revoke
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureConfigManager() {
  const getFeatures = useServerFn(getFeatureConfig);
  const setFeatures = useServerFn(adminSetFeatureConfig);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["feature-config"], queryFn: () => getFeatures() });
  const itunesEnabled = data?.itunesEnabled === true;
  const radioEnabled = data?.radioEnabled === true;
  const playerTransparency = data?.playerTransparency ?? 0.9;

  async function toggleItunes() {
    try {
      await setFeatures({ data: { itunesEnabled: !itunesEnabled, radioEnabled, playerTransparency } });
      toast.success(!itunesEnabled ? "iTunes/BGM enabled" : "iTunes/BGM turned off");
      qc.invalidateQueries({ queryKey: ["feature-config"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save setting");
    }
  }

  async function toggleRadio() {
    try {
      await setFeatures({ data: { itunesEnabled, radioEnabled: !radioEnabled, playerTransparency } });
      toast.success(!radioEnabled ? "Sonexa Radio enabled" : "Sonexa Radio disabled");
      qc.invalidateQueries({ queryKey: ["feature-config"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save setting");
    }
  }

  async function updatePlayerTransparency(value: number) {
    try {
      await setFeatures({ data: { itunesEnabled, radioEnabled, playerTransparency: value } });
      toast.success("Player transparency updated");
      qc.invalidateQueries({ queryKey: ["feature-config"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save setting");
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-card/40 p-4 sm:p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">iTunes / BGM previews</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Temporarily hide iTunes preview songs from search. Home stays focused on approved full
            songs.
          </p>
        </div>
        <button
          onClick={toggleItunes}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-semibold hover:bg-background touch-manipulation min-h-[44px]"
        >
          {itunesEnabled ? (
            <ToggleRight className="h-5 w-5 text-primary" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
          {itunesEnabled ? "On" : "Off"}
        </button>
      </div>
      
      <div className="flex items-center justify-between gap-3 pt-5 border-t border-border/50">
        <div>
          <div className="text-sm font-semibold">Sonexa Radio</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enable the personalized endless radio feature based on the user's listening taste.
          </p>
        </div>
        <button
          onClick={toggleRadio}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-semibold hover:bg-background touch-manipulation min-h-[44px]"
        >
          {radioEnabled ? (
            <ToggleRight className="h-5 w-5 text-primary" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
          {radioEnabled ? "On" : "Off"}
        </button>
      </div>

      <div className="pt-5 border-t border-border/50">
        <div className="text-sm font-semibold mb-2">Player Transparency</div>
        <p className="mt-1 text-xs text-muted-foreground mb-3">
          Control the transparency of the player bar. Lower values make it more transparent.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={playerTransparency}
            onChange={(e) => updatePlayerTransparency(parseFloat(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-mono w-12 text-right">{(playerTransparency * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

function HomeConfigManager() {
  const getHome = useServerFn(getHomeConfig);
  const setHome = useServerFn(adminSetHomeConfig);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["home-config"], queryFn: () => getHome() });
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.2);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBackgroundImageUrl(data?.backgroundImageUrl ?? "");
    setOverlayOpacity(data?.overlayOpacity ?? 0.2);
  }, [data?.backgroundImageUrl, data?.overlayOpacity]);

  async function saveHome() {
    setSaving(true);
    try {
      await setHome({ data: { backgroundImageUrl, overlayOpacity } });
      toast.success("Home branding saved");
      qc.invalidateQueries({ queryKey: ["home-config"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save home branding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" /> Home Page Branding
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Change the background image behind the clock on the Home page and adjust its transparency. Leave URL empty to use default.
      </p>
      <div className="mt-4 grid gap-3">
        <input
          value={backgroundImageUrl}
          onChange={(e) => setBackgroundImageUrl(e.target.value)}
          placeholder="Background Image URL (https://...)"
          className="px-3 py-2 rounded-lg bg-input border border-border text-sm"
        />
        <label className="text-sm">
          Overlay Opacity: {overlayOpacity.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            className="w-full mt-2 accent-primary"
          />
        </label>
        <button
          onClick={saveHome}
          disabled={saving}
          className="justify-self-start px-4 py-2.5 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60 touch-manipulation min-h-[44px]"
        >
          {saving ? "Saving..." : "Save Branding"}
        </button>
      </div>
    </div>
  );
}

function IntroConfigManager() {
  const getIntro = useServerFn(getIntroConfig);
  const setIntro = useServerFn(adminSetIntroConfig);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["intro-config"], queryFn: () => getIntro() });
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("Listen Beyond Limits");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setYoutubeUrl(data?.youtubeUrl ?? "");
    setTitle(data?.title ?? "Listen Beyond Limits");
  }, [data?.title, data?.youtubeUrl]);

  async function saveIntro() {
    setSaving(true);
    try {
      await setIntro({ data: { youtubeUrl, title } });
      toast.success("Intro settings saved");
      qc.invalidateQueries({ queryKey: ["intro-config"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save intro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" /> Intro page
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        This YouTube URL plays as the intro background music. Double-click the Sonexa logo to open
        the intro page.
      </p>
      <div className="mt-3 grid gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Intro title"
          className="px-3 py-2 rounded-lg bg-input border border-border text-sm"
        />
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="px-3 py-2 rounded-lg bg-input border border-border text-sm"
        />
        <button
          onClick={saveIntro}
          disabled={saving}
          className="justify-self-start px-4 py-2.5 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60 touch-manipulation min-h-[44px]"
        >
          {saving ? "Saving..." : "Save intro"}
        </button>
      </div>
    </div>
  );
}

function YouTubeAdder() {
  const lookup = useServerFn(lookupYouTube);
  const searchVideos = useServerFn(searchYouTube);
  const addTrack = useServerFn(adminAddYouTubeTrack);
  const addChannel = useServerFn(adminAddYouTubeChannel);
  const addPlaylist = useServerFn(adminAddYouTubePlaylist);
  const removeTrack = useServerFn(adminRemoveYouTubeTrack);
  const createBackupUpload = useServerFn(adminCreateYouTubeBackupUploadUrl);
  const attachBackup = useServerFn(adminAttachYouTubeBackup);
  const listTracks = useServerFn(listAdminYouTubeTracks);
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [lang, setLang] = useState("tamil");
  const [preview, setPreview] = useState<null | {
    videoId: string;
    title: string;
    channel: string;
    thumbnail: string;
    sourceUrl?: string;
  }>(null);
  const [busy, setBusy] = useState(false);
  const [channelBusy, setChannelBusy] = useState(false);
  const [playlistBusy, setPlaylistBusy] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const [addingUrl, setAddingUrl] = useState("");
  const [backupBusy, setBackupBusy] = useState("");
  const { data } = useQuery({ queryKey: ["admin-youtube-tracks"], queryFn: () => listTracks() });
  const list = (data?.tracks ?? []) as Array<{
    id: string;
    video_id: string;
    title: string;
    channel: string;
    thumbnail: string;
    language: string | null;
    created_at?: string | null;
    backup_url?: string | null;
    backup_uploaded_at?: string | null;
  }>;

  async function onLookup() {
    if (!url.trim()) return;
    setBusy(true);
    try {
      setPreview(await lookup({ data: { url } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!preview) return;
    setBusy(true);
    try {
      const duplicate = list.find(
        (track) => track.title.trim().toLowerCase() === preview.title.trim().toLowerCase(),
      );
      if (
        duplicate &&
        !confirm(`A YouTube song named "${preview.title}" already exists. Add it anyway?`)
      ) {
        return;
      }
      await addTrack({ data: { url: preview.sourceUrl ?? url, language: lang } });
      toast.success(`Added "${preview.title}"`);
      setPreview(null);
      setUrl("");
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function runSearch() {
    if (!searchQ.trim()) return;
    setSearchBusy(true);
    try {
      const result = await searchVideos({ data: { query: searchQ, limit: 8 } });
      setSearchResults(result.results as YouTubeSearchResult[]);
      if (!result.results.length) toast.info("No YouTube results found");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "YouTube search failed");
      setSearchResults([]);
    } finally {
      setSearchBusy(false);
    }
  }

  async function addFromUrl(sourceUrl: string, title?: string) {
    setAddingUrl(sourceUrl);
    try {
      if (title) {
        const duplicate = list.find(
          (track) => track.title.trim().toLowerCase() === title.trim().toLowerCase(),
        );
        if (
          duplicate &&
          !confirm(`A YouTube song named "${title}" already exists. Add it anyway?`)
        ) {
          return;
        }
      }
      await addTrack({ data: { url: sourceUrl, language: lang } });
      toast.success(title ? `Added "${title}"` : "YouTube song added");
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Add failed");
    } finally {
      setAddingUrl("");
    }
  }

  async function importChannel() {
    if (!channelUrl.trim()) return;
    setChannelBusy(true);
    try {
      const result = await addChannel({ data: { url: channelUrl, language: lang, limit: 12 } });
      toast.success(`Imported ${result.inserted} videos from channel`);
      setChannelUrl("");
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Channel import failed");
    } finally {
      setChannelBusy(false);
    }
  }

  async function importPlaylist() {
    if (!playlistUrl.trim()) return;
    setPlaylistBusy(true);
    try {
      const result = await addPlaylist({ data: { url: playlistUrl, language: lang, limit: 200 } });
      toast.success(
        `Imported ${result.inserted} new videos into "${result.playlist.title}"${
          result.skipped ? `, skipped ${result.skipped} already added` : ""
        }`,
      );
      setPlaylistUrl("");
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
      qc.invalidateQueries({ queryKey: ["youtube-playlists"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Playlist import failed");
    } finally {
      setPlaylistBusy(false);
    }
  }

  async function remove(videoId: string) {
    try {
      await removeTrack({ data: { videoId } });
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  }

  async function uploadBackup(videoId: string, file: File | null | undefined) {
    if (!file) return;
    setBackupBusy(videoId);
    try {
      const upload = await createBackupUpload({
        data: { videoId, fileName: file.name },
      });
      const { error } = await supabase.storage
        .from("audio")
        .uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw error;
      await attachBackup({
        data: {
          videoId,
          path: upload.path,
          kind: file.type.startsWith("video/") ? "video" : "audio",
        },
      });
      toast.success("Cloud backup saved");
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backup upload failed");
    } finally {
      setBackupBusy("");
    }
  }

  return (
    <div className="mt-8 p-4 sm:p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Youtube className="h-4 w-4 text-primary" /> YouTube catalog
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Paste a song URL or a channel link. Metadata is extracted server-side and approved tracks
        are saved for every user.
      </p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        >
          {["tamil", "hindi", "telugu", "malayalam", "english", "kannada"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          onClick={onLookup}
          disabled={busy}
          className="px-4 py-2.5 rounded-lg bg-background/60 hover:bg-background text-sm inline-flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px]"
        >
          <Search className="h-4 w-4" />
          {busy ? "Looking..." : "Lookup"}
        </button>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Search YouTube by song, artist, or movie"
          className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        />
        <button
          onClick={runSearch}
          disabled={searchBusy}
          className="px-4 py-2.5 rounded-lg bg-background/60 hover:bg-background text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60 touch-manipulation min-h-[44px]"
        >
          <Search className="h-4 w-4" />
          {searchBusy ? "Searching..." : "Search YouTube"}
        </button>
      </div>
      {searchResults.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {searchResults.map((result) => (
            <div
              key={result.videoId}
              className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-2"
            >
              <img src={result.thumbnail} alt="" className="h-14 w-24 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{result.title}</div>
                <div className="truncate text-xs text-muted-foreground">{result.channel}</div>
              </div>
              <button
                onClick={() => addFromUrl(result.sourceUrl, result.title)}
                disabled={addingUrl === result.sourceUrl}
                className="px-3 py-2.5 rounded-lg bg-brand-gradient text-background font-semibold text-xs inline-flex items-center gap-1.5 disabled:opacity-60 touch-manipulation min-h-[36px]"
              >
                <Plus className="h-4 w-4" />
                {addingUrl === result.sourceUrl ? "Adding..." : "Add"}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="https://www.youtube.com/@channel or /channel/UC..."
          className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        />
        <button
          onClick={importChannel}
          disabled={channelBusy}
          className="px-4 py-2.5 rounded-lg bg-background/60 hover:bg-background text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60 touch-manipulation min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          {channelBusy ? "Importing..." : "Import latest 12"}
        </button>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="https://www.youtube.com/playlist?list=..."
          className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        />
        <button
          onClick={importPlaylist}
          disabled={playlistBusy}
          className="px-4 py-2.5 rounded-lg bg-background/60 hover:bg-background text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60 touch-manipulation min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          {playlistBusy ? "Importing..." : "Import playlist"}
        </button>
      </div>
      {preview && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
          <img src={preview.thumbnail} alt="" className="h-16 w-28 object-cover rounded-md" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{preview.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {preview.channel} / {preview.videoId}
            </div>
          </div>
          <button
            onClick={save}
            className="px-3 py-2.5 rounded-lg bg-brand-gradient text-background font-semibold text-sm inline-flex items-center gap-1.5 touch-manipulation min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      )}
      {list.length > 0 && (
        <div className="mt-4 divide-y divide-border/60">
          <div className="text-xs uppercase tracking-wide text-muted-foreground pb-2">
            Approved YouTube ({list.length})
          </div>
          {list.map((track) => {
            const backupDue = isYouTubeBackupDue(track.created_at);
            return (
              <div key={track.video_id} className="flex items-center gap-3 py-2">
                <img src={track.thumbnail} alt="" className="h-10 w-16 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-sm truncate">{track.title}</div>
                    {backupDue && (
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent"
                        title="YouTube links older than one week should be backed up by uploading licensed audio in the Songs section."
                      >
                        <AlertTriangle className="h-3 w-3" />
                        backup due
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {track.channel} / {track.language}
                  </div>
                  {backupDue && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Upload a licensed MP3/MP4 backup file for cloud playback.
                    </div>
                  )}
                  {track.backup_url && (
                    <div className="mt-1 text-[11px] text-primary">Cloud backup saved</div>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 py-2 text-xs font-semibold hover:bg-background touch-manipulation min-h-[36px]">
                  <Upload className="h-4 w-4" />
                  {backupBusy === track.video_id ? "Saving..." : "Backup"}
                  <input
                    type="file"
                    accept="audio/*,video/mp4,video/webm"
                    disabled={backupBusy === track.video_id}
                    onChange={(e) => uploadBackup(track.video_id, e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => remove(track.video_id)}
                  className="h-8 w-8 grid place-items-center rounded-md bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RadioStationManager() {
  const listStations = useServerFn(listRadioStations);
  const createStation = useServerFn(adminCreateRadioStation);
  const updateStation = useServerFn(adminUpdateRadioStation);
  const deleteStation = useServerFn(adminDeleteRadioStation);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-radio-stations"],
    queryFn: () => listStations(),
  });
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [icon, setIcon] = useState("Radio");
  const [color, setColor] = useState("from-purple-500 to-pink-500");
  const [basedOn, setBasedOn] = useState<"song" | "artist" | "genre" | "custom">("custom");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const stations = (data?.stations ?? []) as Array<{
    id: string;
    name: string;
    description: string;
    youtube_url: string;
    youtube_video_id: string;
    icon: string;
    color: string;
    based_on: string;
    created_at: string;
  }>;

  async function handleCreate() {
    if (!name.trim() || !description.trim() || !youtubeUrl.trim()) {
      return toast.error("Fill all fields");
    }
    setBusy(true);
    try {
      await createStation({
        data: {
          name: name.trim(),
          description: description.trim(),
          youtubeUrl: youtubeUrl.trim(),
          icon,
          color,
          basedOn,
        },
      });
      toast.success("Radio station created");
      setName("");
      setDescription("");
      setYoutubeUrl("");
      qc.invalidateQueries({ queryKey: ["admin-radio-stations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create station");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(stationId: string) {
    if (!name.trim() || !description.trim() || !youtubeUrl.trim()) {
      return toast.error("Fill all fields");
    }
    setBusy(true);
    try {
      await updateStation({
        data: {
          stationId,
          name: name.trim(),
          description: description.trim(),
          youtubeUrl: youtubeUrl.trim(),
          icon,
          color,
          basedOn,
        },
      });
      toast.success("Radio station updated");
      setEditingId(null);
      setName("");
      setDescription("");
      setYoutubeUrl("");
      qc.invalidateQueries({ queryKey: ["admin-radio-stations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update station");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(stationId: string) {
    if (!confirm("Delete this radio station?")) return;
    setBusy(true);
    try {
      await deleteStation({ data: { stationId } });
      toast.success("Radio station deleted");
      qc.invalidateQueries({ queryKey: ["admin-radio-stations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete station");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(station: typeof stations[0]) {
    setEditingId(station.id);
    setName(station.name);
    setDescription(station.description);
    setYoutubeUrl(station.youtube_url);
    setIcon(station.icon);
    setColor(station.color);
    setBasedOn(station.based_on as any);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setDescription("");
    setYoutubeUrl("");
  }

  return (
    <div className="mt-8 p-4 sm:p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Youtube className="h-4 w-4 text-primary" /> Radio Stations
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Manage radio stations with YouTube URLs. Admin can create, update, and delete stations.
      </p>

      {/* Create/Edit Form */}
      <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Station name"
          className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        />
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="YouTube URL (https://www.youtube.com/watch?v=...)"
          className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
          >
            <option value="Radio">Radio</option>
            <option value="Sparkles">Sparkles</option>
            <option value="Music2">Music</option>
            <option value="Flame">Flame</option>
            <option value="Clock">Clock</option>
            <option value="TrendingUp">Trending</option>
            <option value="Heart">Heart</option>
          </select>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
          >
            <option value="from-purple-500 to-pink-500">Purple Pink</option>
            <option value="from-green-500 to-teal-500">Green Teal</option>
            <option value="from-blue-500 to-indigo-500">Blue Indigo</option>
            <option value="from-cyan-500 to-blue-500">Cyan Blue</option>
            <option value="from-orange-500 to-red-500">Orange Red</option>
            <option value="from-yellow-500 to-orange-500">Yellow Orange</option>
          </select>
        </div>
        <select
          value={basedOn}
          onChange={(e) => setBasedOn(e.target.value as any)}
          className="px-3 py-2.5 rounded-lg bg-input border border-border text-sm touch-manipulation min-h-[44px]"
        >
          <option value="custom">Custom</option>
          <option value="song">Based on Song</option>
          <option value="artist">Based on Artist</option>
          <option value="genre">Based on Genre</option>
        </select>
        <div className="flex gap-2">
          {editingId ? (
            <>
              <button
                onClick={() => handleUpdate(editingId)}
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60 touch-manipulation min-h-[44px]"
              >
                {busy ? "Updating..." : "Update Station"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={busy}
                className="px-4 py-2.5 rounded-lg bg-background/60 hover:bg-background text-sm touch-manipulation min-h-[44px]"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              disabled={busy}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60 touch-manipulation min-h-[44px]"
            >
              {busy ? "Creating..." : "Create Station"}
            </button>
          )}
        </div>
      </div>

      {/* Stations List */}
      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading stations...</p>
      ) : stations.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No radio stations created yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {stations.map((station) => (
            <div
              key={station.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-border"
            >
              <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${station.color} flex items-center justify-center text-white`}>
                <Youtube className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{station.name}</div>
                <div className="text-xs text-muted-foreground truncate">{station.description}</div>
                <div className="text-xs text-muted-foreground truncate">{station.youtube_url}</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(station)}
                  disabled={busy}
                  className="p-2 rounded-md bg-background/60 hover:bg-background touch-manipulation min-h-[36px]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(station.id)}
                  disabled={busy}
                  className="p-2 rounded-md bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground touch-manipulation min-h-[36px]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaylistManager() {
  const listPlaylists = useServerFn(listAdminYouTubePlaylists);
  const updatePlaylist = useServerFn(adminUpdateYouTubePlaylist);
  const deletePlaylist = useServerFn(adminDeleteYouTubePlaylist);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-playlists"],
    queryFn: () => listPlaylists(),
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [busy, setBusy] = useState(false);

  const playlists = (data?.playlists ?? []) as Array<{
    id: string;
    playlist_id: string;
    title: string;
    language: string | null;
    tracks: any[];
    created_at: string;
  }>;

  async function handleUpdate(playlistId: string) {
    if (!editTitle.trim()) return toast.error("Title is required");
    setBusy(true);
    try {
      await updatePlaylist({
        data: {
          playlistId,
          title: editTitle.trim(),
          language: editLanguage || undefined,
        },
      });
      toast.success("Playlist updated");
      setEditingId(null);
      setEditTitle("");
      setEditLanguage("");
      qc.invalidateQueries({ queryKey: ["admin-playlists"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update playlist");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(playlistId: string) {
    if (!confirm("Delete this playlist? This will not delete the individual tracks.")) return;
    setBusy(true);
    try {
      await deletePlaylist({ data: { playlistId } });
      toast.success("Playlist deleted");
      qc.invalidateQueries({ queryKey: ["admin-playlists"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete playlist");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(playlist: typeof playlists[0]) {
    setEditingId(playlist.playlist_id);
    setEditTitle(playlist.title);
    setEditLanguage(playlist.language || "");
  }

  return (
    <div className="mt-8 p-4 sm:p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Youtube className="h-4 w-4 text-primary" /> Playlists
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Manage YouTube playlists. Edit titles or delete playlists.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading playlists...</p>
      ) : playlists.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No playlists created yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {playlists.map((playlist) => (
            <div
              key={playlist.playlist_id}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-border"
            >
              <div className="h-12 w-12 rounded-lg bg-brand-gradient flex items-center justify-center text-white">
                <Youtube className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === playlist.playlist_id ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Playlist title"
                      className="w-full px-2 py-1 rounded bg-input border border-border text-sm"
                    />
                    <input
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      placeholder="Language (e.g., tamil)"
                      className="w-full px-2 py-1 rounded bg-input border border-border text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-semibold">{playlist.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {playlist.tracks.length} tracks • {playlist.language || "No language"}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-1">
                {editingId === playlist.playlist_id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(playlist.playlist_id)}
                      disabled={busy}
                      className="p-2 rounded-md bg-primary/20 text-primary hover:bg-primary/30"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditTitle("");
                        setEditLanguage("");
                      }}
                      disabled={busy}
                      className="p-2 rounded-md bg-background/60 hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(playlist)}
                      disabled={busy}
                      className="p-2 rounded-md bg-background/60 hover:bg-background"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.playlist_id)}
                      disabled={busy}
                      className="p-2 rounded-md bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadManager() {
  const startDownload = useServerFn(adminStartBulkDownload);
  const getStatus = useServerFn(adminGetDownloadStatus);
  const cancelDownload = useServerFn(adminCancelDownload);
  const qc = useQueryClient();
  const [language, setLanguage] = useState("");
  const [limit, setLimit] = useState(50);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-download-status"],
    queryFn: () => getStatus(),
    refetchInterval: (query) => (query.state.data?.job?.status === "running" ? 2000 : false),
  });

  const job = data?.job;
  const recentJobs = (data?.recentJobs ?? []) as Array<{
    id: string;
    status: string;
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    startedAt: string;
    completedAt?: string;
    error?: string;
  }>;

  async function handleStart() {
    setStarting(true);
    try {
      const result = await startDownload({
        data: { language: language || undefined, limit },
      });
      if (result.job) {
        toast.success(result.message);
        qc.invalidateQueries({ queryKey: ["admin-download-status"] });
      } else {
        toast.info(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start download");
    } finally {
      setStarting(false);
    }
  }

  async function handleCancel(jobId: string) {
    setCancelling(jobId);
    try {
      await cancelDownload({ data: { jobId } });
      toast.success("Download cancelled");
      qc.invalidateQueries({ queryKey: ["admin-download-status"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel download");
    } finally {
      setCancelling("");
    }
  }

  const progress = job ? Math.round((job.completed / job.total) * 100) : 0;

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Download className="h-4 w-4 text-primary" /> Bulk YouTube MP3 Download (RapidAPI)
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Download YouTube tracks as MP3 backups using RapidAPI. Falls back to backend service if RapidAPI fails. Skips tracks that already have backups.
      </p>

      {/* Download Controls */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 rounded-lg bg-input border border-border text-sm"
        >
          <option value="">All Languages</option>
          <option value="tamil">Tamil</option>
          <option value="hindi">Hindi</option>
          <option value="telugu">Telugu</option>
          <option value="malayalam">Malayalam</option>
          <option value="english">English</option>
          <option value="kannada">Kannada</option>
        </select>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
          min="1"
          max="500"
          className="px-3 py-2 rounded-lg bg-input border border-border text-sm w-24"
          placeholder="Limit"
        />
        <button
          onClick={handleStart}
          disabled={starting || job?.status === "running"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {starting ? "Starting..." : job?.status === "running" ? "Download in progress" : "Download All"}
        </button>
      </div>

      {/* Active Job Progress */}
      {job && (
        <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">
              {job.status === "running" ? "Downloading..." : job.status === "completed" ? "Completed" : job.status}
            </div>
            {job.status === "running" && (
              <button
                onClick={() => handleCancel(job.id)}
                disabled={cancelling === job.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-semibold hover:bg-destructive hover:text-destructive-foreground disabled:opacity-60"
              >
                <Pause className="h-3 w-3" />
                {cancelling === job.id ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
          <div className="w-full bg-border rounded-full h-2 mb-3">
            <div
              className="bg-brand-gradient h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Total</div>
              <div className="font-semibold">{job.total}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Completed</div>
              <div className="font-semibold text-primary">{job.completed}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Skipped</div>
              <div className="font-semibold">{job.skipped}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Failed</div>
              <div className="font-semibold text-destructive">{job.failed}</div>
            </div>
          </div>
          {job.currentVideoId && (
            <div className="mt-3 text-xs text-muted-foreground">
              Current: <span className="font-mono">{job.currentVideoId}</span>
            </div>
          )}
          {job.error && (
            <div className="mt-2 text-xs text-destructive">{job.error}</div>
          )}
        </div>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && !job && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recent Downloads</div>
          <div className="space-y-2">
            {recentJobs.slice(0, 5).map((recentJob) => (
              <div key={recentJob.id} className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold">
                      {recentJob.status === "completed" ? "Completed" : recentJob.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {recentJob.completed}/{recentJob.total} tracks
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(recentJob.startedAt).toLocaleString()}
                  </div>
                </div>
                {recentJob.failed > 0 && (
                  <div className="text-xs text-destructive font-semibold">{recentJob.failed} failed</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AIDiscoveryManager() {
  const discover = useServerFn(adminDiscoverYouTubeContent);
  const autoDiscover = useServerFn(adminAutoDiscoverTamilContent);
  const qc = useQueryClient();
  const [query, setQuery] = useState("Tamil songs 2024");
  const [language, setLanguage] = useState("tamil");
  const [limit, setLimit] = useState(10);
  const [autoApprove, setAutoApprove] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [autoDiscovering, setAutoDiscovering] = useState(false);
  const [queriesPerRun, setQueriesPerRun] = useState(3);

  async function handleDiscover() {
    setDiscovering(true);
    try {
      const result = await discover({
        data: { query, language, limit, autoApprove },
      });
      toast.success(result.message);
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
      qc.invalidateQueries({ queryKey: ["admin-youtube-requests"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleAutoDiscover() {
    setAutoDiscovering(true);
    try {
      const result = await autoDiscover({
        data: { autoApprove, queriesPerRun },
      });
      toast.success(result.message);
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
      qc.invalidateQueries({ queryKey: ["admin-youtube-requests"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auto-discovery failed");
    } finally {
      setAutoDiscovering(false);
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" /> AI YouTube Content Discovery
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Automatically discover Tamil songs from YouTube using AI-powered search queries.
      </p>

      {/* Manual Discovery */}
      <div className="mt-4 space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search query (e.g., 'Tamil romantic songs 2024')"
          className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border text-sm"
          >
            <option value="tamil">Tamil</option>
            <option value="hindi">Hindi</option>
            <option value="telugu">Telugu</option>
            <option value="malayalam">Malayalam</option>
            <option value="english">English</option>
            <option value="kannada">Kannada</option>
          </select>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            min="1"
            max="50"
            className="px-3 py-2 rounded-lg bg-input border border-border text-sm w-24"
            placeholder="Limit"
          />
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/40 border border-border text-sm">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="accent-primary"
            />
            Auto-approve
          </label>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {discovering ? "Discovering..." : "Discover"}
          </button>
        </div>
      </div>

      {/* Auto Discovery */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-xs font-semibold mb-2">Auto-Discovery (Predefined Tamil Queries)</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={queriesPerRun}
            onChange={(e) => setQueriesPerRun(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg bg-input border border-border text-sm"
          >
            <option value="1">1 query</option>
            <option value="2">2 queries</option>
            <option value="3">3 queries</option>
            <option value="4">4 queries</option>
            <option value="5">5 queries</option>
          </select>
          <button
            onClick={handleAutoDiscover}
            disabled={autoDiscovering}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background/60 hover:bg-background text-sm font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${autoDiscovering ? "animate-spin" : ""}`} />
            {autoDiscovering ? "Running..." : "Run Auto-Discovery"}
          </button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Searches for: Tamil songs 2024, cinema music, indie folk, devotional, romantic, beat, and melody songs
        </div>
      </div>
    </div>
  );
}

function YouTubeRequests() {
  const listRequests = useServerFn(adminListYouTubeRequests);
  const review = useServerFn(adminReviewYouTubeRequest);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-youtube-requests"],
    queryFn: () => listRequests(),
  });
  const requests = (data?.requests ?? []) as Array<{
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    language: string | null;
    status: "pending" | "approved" | "rejected";
  }>;

  async function decide(requestId: string, approve: boolean) {
    try {
      await review({ data: { requestId, approve } });
      toast.success(approve ? "Approved" : "Rejected");
      qc.invalidateQueries({ queryKey: ["admin-youtube-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-youtube-tracks"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Review failed");
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Youtube className="h-4 w-4 text-primary" /> User YouTube requests
      </div>
      <div className="mt-4 divide-y divide-border/60">
        {isLoading && <div className="py-6 text-sm text-muted-foreground">Loading requests...</div>}
        {!isLoading && requests.length === 0 && (
          <div className="py-6 text-sm text-muted-foreground">No requests yet.</div>
        )}
        {requests.map((request) => (
          <div key={request.id} className="flex items-center gap-3 py-3">
            <img
              src={request.thumbnail}
              alt=""
              className="h-12 w-20 rounded-md object-cover bg-secondary"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{request.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {request.channel} / {request.language ?? "tamil"} / {request.status}
              </div>
            </div>
            {request.status === "pending" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => decide(request.id, true)}
                  className="h-8 w-8 grid place-items-center rounded-md bg-primary text-background hover:opacity-90"
                  title="Approve"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => decide(request.id, false)}
                  className="h-8 w-8 grid place-items-center rounded-md bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  title="Reject"
                >
                  <Ban className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type YouTubeSearchResult = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  sourceUrl: string;
};

type AdminSong = {
  id: string;
  title: string;
  cover_url: string | null;
  language: string | null;
  genre: string | null;
  artists: { name?: string } | null;
};

function ManageSongs() {
  const list = useServerFn(adminListSongs);
  const update = useServerFn(adminUpdateSong);
  const del = useServerFn(adminDeleteSong);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "songs"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; language: string; genre: string; approved: boolean }>({
    title: "",
    language: "",
    genre: "",
    approved: false,
  });

  const songs = (data?.songs ?? []) as (AdminSong & { approved?: boolean })[];
  const filtered = q
    ? songs.filter((s) =>
        (s.title + " " + (s.artists?.name ?? "")).toLowerCase().includes(q.toLowerCase()),
      )
    : songs;
  const visibleSongs = q ? filtered.slice(0, 100) : filtered.slice(0, 8);

  function startEdit(s: AdminSong & { approved?: boolean }) {
    setEditId(s.id);
    setDraft({ 
      title: s.title, 
      language: s.language ?? "", 
      genre: s.genre ?? "",
      approved: s.approved !== false 
    });
  }

  async function saveEdit(id: string) {
    try {
      await update({ data: { songId: id, ...draft } });
      toast.success("Saved");
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["admin", "songs"] });
      qc.invalidateQueries({ queryKey: ["songs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function toggleApproval(id: string, currentApprovalStatus: boolean) {
    try {
      await update({ data: { songId: id, approved: !currentApprovalStatus } });
      toast.success(!currentApprovalStatus ? "Approved" : "Unapproved");
      qc.invalidateQueries({ queryKey: ["admin", "songs"] });
      qc.invalidateQueries({ queryKey: ["songs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function remove(id: string, songTitle: string) {
    if (!confirm(`Delete "${songTitle}"? This cannot be undone.`)) return;
    try {
      await del({ data: { songId: id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "songs"] });
      qc.invalidateQueries({ queryKey: ["songs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Pencil className="h-4 w-4 text-primary" /> Manage songs ({songs.length})
        </div>
        <label className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search uploaded songs..."
            className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm"
          />
        </label>
      </div>
      {!q && songs.length > 8 && (
        <div className="mt-3 text-xs text-muted-foreground">
          Showing latest 8 uploaded songs. Search by title or artist to find older songs.
        </div>
      )}
      <div className="mt-4 divide-y divide-border/60">
        {isLoading && <div className="py-6 text-sm text-muted-foreground">Loading songs...</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="py-6 text-sm text-muted-foreground">
            No songs match. Seed the catalog above to get started.
          </div>
        )}
        {visibleSongs.map((s) => {
          const editing = editId === s.id;
          const isApproved = s.approved !== false;
          return (
            <div key={s.id} className="flex items-center gap-3 py-3">
              <img
                src={s.cover_url ?? ""}
                alt=""
                className="h-12 w-12 rounded-md object-cover bg-secondary"
              />
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      className="px-2 py-1.5 rounded bg-input border border-border text-sm"
                      placeholder="Title"
                    />
                    <input
                      value={draft.language}
                      onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
                      className="px-2 py-1.5 rounded bg-input border border-border text-sm"
                      placeholder="Language"
                    />
                    <input
                      value={draft.genre}
                      onChange={(e) => setDraft((d) => ({ ...d, genre: e.target.value }))}
                      className="px-2 py-1.5 rounded bg-input border border-border text-sm"
                      placeholder="Genre"
                    />
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded bg-input border border-border text-sm col-span-1 sm:col-span-3">
                      <input
                        type="checkbox"
                        checked={draft.approved}
                        onChange={(e) => setDraft((d) => ({ ...d, approved: e.target.checked }))}
                        className="accent-primary"
                      />
                      <span>Approve for public</span>
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{s.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isApproved 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.artists?.name ?? "Unknown"} / {s.language ?? "-"} / {s.genre ?? "-"}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {editing ? (
                  <>
                    <button
                      onClick={() => saveEdit(s.id)}
                      className="h-8 w-8 grid place-items-center rounded-md bg-primary text-background hover:opacity-90"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="h-8 w-8 grid place-items-center rounded-md bg-background/60 hover:bg-background"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => toggleApproval(s.id, isApproved)}
                      className={`h-8 w-8 grid place-items-center rounded-md transition-colors ${
                        isApproved
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-background'
                          : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-background'
                      }`}
                      title={isApproved ? "Disapprove" : "Approve"}
                    >
                      {isApproved ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      className="h-8 w-8 grid place-items-center rounded-md bg-background/60 hover:bg-background"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(s.id, s.title)}
                      className="h-8 w-8 grid place-items-center rounded-md bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {q && filtered.length > 100 && (
          <div className="py-3 text-xs text-muted-foreground">
            Showing first 100 of {filtered.length}. Refine search to find more.
          </div>
        )}
      </div>
    </div>
  );
}
