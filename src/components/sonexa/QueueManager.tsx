import { useState } from "react";
import { X, GripVertical, Play, Trash2, Plus } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { toast } from "sonner";

interface QueueManagerProps {
  onClose: () => void;
}

export function QueueManager({ onClose }: QueueManagerProps) {
  const { queue, current, play, removeFromQueue, clearQueue } = usePlayer();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handlePlay = (index: number) => {
    play(queue[index], queue.slice(index));
  };

  const handleRemove = (trackId: string) => {
    removeFromQueue(trackId);
    toast.success("Removed from queue");
  };

  const handleClear = () => {
    clearQueue();
    toast.success("Queue cleared");
  };

  if (queue.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Queue is empty</h3>
          <p className="text-sm text-muted-foreground">
            Add songs to your queue to listen to them next
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold">Queue</h2>
          <p className="text-xs text-muted-foreground">{queue.length} songs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background/80 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {queue.map((track, index) => {
          const isCurrent = current?.id === track.id;
          return (
            <div
              key={`${track.id}-${index}`}
              className={`group flex items-center gap-3 p-3 rounded-xl transition ${
                isCurrent
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-card/40 hover:bg-card/60 border border-border/30"
              }`}
            >
              <button
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handlePlay(index)}
                className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={track.cover}
                  alt={track.title}
                  className="h-full w-full object-cover"
                />
                {isCurrent && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-current" />
                  </div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className={`truncate text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>
                  {track.title}
                </div>
                <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
              </div>

              <button
                onClick={() => handleRemove(track.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition"
                title="Remove from queue"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-border bg-card/20">
        <div className="text-xs text-muted-foreground text-center">
          Total duration: ~{Math.round(queue.length * 3.5)} minutes
        </div>
      </div>
    </div>
  );
}
