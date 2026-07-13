import { useEffect } from "react";
import { usePlayer } from "@/lib/player-store";
import { toast } from "sonner";

interface KeyboardShortcutsProps {
  enabled?: boolean;
}

export function KeyboardShortcuts({ enabled = true }: KeyboardShortcutsProps) {
  const { toggle, next, prev, toggleShuffle, toggleRepeat, volume, setVolume } = usePlayer();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Prevent default for our shortcuts
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          toggle();
          break;
        case "arrowright":
        case "n":
          e.preventDefault();
          next();
          break;
        case "arrowleft":
        case "p":
          e.preventDefault();
          prev();
          break;
        case "s":
          e.preventDefault();
          toggleShuffle();
          toast.success("Shuffle toggled");
          break;
        case "r":
          e.preventDefault();
          toggleRepeat();
          toast.success("Repeat toggled");
          break;
        case "arrowup":
          e.preventDefault();
          setVolume(Math.min(3, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case "m":
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 1);
          toast.success(volume > 0 ? "Muted" : "Unmuted");
          break;
        case "f":
          e.preventDefault();
          // Toggle fullscreen (if supported)
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen().catch(() => {
              toast.info("Fullscreen not supported");
            });
          }
          break;
        case "?":
          e.preventDefault();
          showShortcutsHelp();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, toggle, next, prev, toggleShuffle, toggleRepeat, volume, setVolume]);

  return null;
}

function showShortcutsHelp() {
  const shortcuts = [
    { key: "Space / K", action: "Play / Pause" },
    { key: "→ / N", action: "Next track" },
    { key: "← / P", action: "Previous track" },
    { key: "S", action: "Toggle shuffle" },
    { key: "R", action: "Toggle repeat" },
    { key: "↑ / ↓", action: "Volume up / down" },
    { key: "M", action: "Mute / Unmute" },
    { key: "F", action: "Fullscreen" },
    { key: "?", action: "Show shortcuts" },
  ];

  const shortcutsText = shortcuts
    .map((s) => `${s.key.padEnd(12)} ${s.action}`)
    .join("\n");

  toast("Keyboard Shortcuts", {
    description: (
      <pre className="text-xs text-left mt-2 whitespace-pre font-mono">
        {shortcutsText}
      </pre>
    ),
    duration: 10000,
  });
}
