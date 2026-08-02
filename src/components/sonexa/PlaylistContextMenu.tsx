import { useState } from "react";
import { Plus, Trash2, Edit2, MoreVertical } from "lucide-react";
import { useLocalLibrary } from "@/lib/local-library";
import type { Track } from "@/lib/player-store";
import { toast } from "sonner";

export function PlaylistContextMenu({ track, onClose }: { track: Track; onClose: () => void }) {
  const { playlists, addToPlaylist } = useLocalLibrary();
  const [isOpen, setIsOpen] = useState(false);

  function handleAddToPlaylist(playlistId: string) {
    addToPlaylist(playlistId, track);
    toast.success("Added to playlist");
    setIsOpen(false);
    onClose();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition"
        title="Add to playlist"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-50 w-56 p-2">
      <div className="text-xs font-semibold text-muted-foreground px-3 py-2">Add to playlist</div>
      {playlists.length === 0 ? (
        <div className="text-xs text-muted-foreground px-3 py-2">No playlists yet</div>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleAddToPlaylist(pl.id)}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-background/50 transition truncate"
            >
              {pl.name}
              <span className="text-xs text-muted-foreground ml-2">({pl.tracks.length})</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(false)}
        className="w-full mt-2 pt-2 border-t border-border text-xs text-muted-foreground hover:text-foreground px-3 py-2"
      >
        Close
      </button>
    </div>
  );
}

export function PlaylistRenameDialog({
  playlistId,
  currentName,
  onClose,
}: {
  playlistId: string;
  currentName: string;
  onClose: () => void;
}) {
  const { renamePlaylist } = useLocalLibrary();
  const [name, setName] = useState(currentName);

  function handleSave() {
    if (name.trim()) {
      renamePlaylist(playlistId, name.trim());
      toast.success("Playlist renamed");
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-96">
        <h3 className="font-bold text-lg mb-4">Rename Playlist</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          className="w-full px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 ring-primary mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onClose();
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-brand-gradient text-background font-semibold"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
