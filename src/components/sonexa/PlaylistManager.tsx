import { useState } from "react";
import { Plus, FolderOpen, Trash2, Edit2, Play } from "lucide-react";
import { useLocalLibrary } from "@/lib/local-library";
import { usePlayer } from "@/lib/player-store";
import { toast } from "sonner";

interface PlaylistManagerProps {
  onClose?: () => void;
}

export function PlaylistManager({ onClose }: PlaylistManagerProps) {
  const { playlists, createPlaylist, deletePlaylist, addToPlaylist } = useLocalLibrary();
  const { play } = usePlayer();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setShowCreateForm(false);
    toast.success("Playlist created");
  };

  const handleDeletePlaylist = (playlistId: string) => {
    deletePlaylist(playlistId);
    toast.success("Playlist deleted");
  };

  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist && playlist.tracks.length > 0) {
      play(playlist.tracks[0], playlist.tracks);
      toast.success(`Playing ${playlist.name}`);
    } else {
      toast.error("Playlist is empty");
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Your Playlists</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="space-y-2 p-4 rounded-xl bg-card/40 border border-border/30">
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreatePlaylist}
              className="flex-1 py-2 rounded-lg bg-primary text-background font-medium hover:bg-primary/90 transition"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewPlaylistName("");
              }}
              className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition"
        >
          <Plus className="h-4 w-4" />
          Create New Playlist
        </button>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {playlists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No playlists yet</p>
            <p className="text-sm">Create your first playlist to get started</p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/30 hover:bg-card/60 transition group"
            >
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{playlist.name}</div>
                <div className="text-xs text-muted-foreground">
                  {playlist.tracks.length} songs
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePlayPlaylist(playlist.id)}
                  className="p-2 rounded-lg hover:bg-primary/20 text-primary"
                  title="Play playlist"
                >
                  <Play className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="p-2 rounded-lg hover:bg-destructive/20 text-destructive"
                  title="Delete playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
