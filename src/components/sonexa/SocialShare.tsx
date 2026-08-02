import { Share2, Youtube, MessageCircle, Instagram, Copy, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import type { Track } from "@/lib/player-store";

export function SocialShare({ track, videoUrl }: { track: Track; videoUrl?: string }) {
  const trackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/song/${encodeURIComponent(track.id)}`;
  const title = `Now playing: ${track.title} by ${track.artist}`;
  const shareText = `🎵 ${track.title}\n${track.artist}\n\nListen on Sonexa`;

  async function createShareCard(): Promise<Blob | null> {
    try {
      // Create a canvas with thumbnail + song info
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#1a1a2e");
      grad.addColorStop(1, "#0f0f1e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Album cover (if available)
      if (track.cover) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = track.cover;
        });
        ctx.drawImage(img, 50, 50, 400, 530);
      }

      // Song title
      ctx.font = "bold 48px -apple-system, Inter, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(track.title, 500, 150, 650);

      // Artist name
      ctx.font = "36px -apple-system, Inter, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText(track.artist, 500, 220);

      // Sonexa branding
      ctx.font = "24px -apple-system, Inter, sans-serif";
      ctx.fillStyle = "#68c896";
      ctx.fillText("♪ Listen on Sonexa", 500, 550);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob));
      });
    } catch (e) {
      console.error("Share card creation failed:", e);
      return null;
    }
  }

  function shareToYouTube() {
    if (videoUrl) {
      window.open(videoUrl, "_blank");
    } else if (track.ytId) {
      window.open(`https://www.youtube.com/watch?v=${track.ytId}`, "_blank");
    } else {
      toast.error("No YouTube video available");
    }
  }

  function shareToWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${trackUrl}`)}`;
    window.open(url, "_blank");
  }

  function shareToInstagram() {
    toast.info("Copy link and share on Instagram Story");
    navigator.clipboard.writeText(`${shareText}\n${trackUrl}`);
  }

  function shareToX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${trackUrl}`)}`;
    window.open(url, "_blank");
  }

  function copyLink() {
    navigator.clipboard.writeText(trackUrl);
    toast.success("Link copied to clipboard");
  }

  async function shareWithThumbnail() {
    try {
      const blob = await createShareCard();
      if (!blob) {
        toast.error("Could not create share card");
        return;
      }

      const file = new File([blob], `${track.title}-share.png`, { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: track.title,
          text: shareText,
          url: trackUrl,
          files: [file],
        });
        toast.success("Shared!");
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${track.title}-share.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Share card downloaded");
      }
    } catch (e) {
      console.error("Share failed:", e);
      toast.error("Share failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={shareToYouTube}
        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
        title="Share on YouTube"
      >
        <Youtube className="h-5 w-5" />
      </button>
      <button
        onClick={shareToWhatsApp}
        className="p-2 rounded-lg text-green-500 hover:bg-green-500/10 transition"
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      <button
        onClick={shareToInstagram}
        className="p-2 rounded-lg text-pink-500 hover:bg-pink-500/10 transition"
        title="Share on Instagram"
      >
        <Instagram className="h-5 w-5" />
      </button>
      <button
        onClick={shareToX}
        className="p-2 rounded-lg text-sky-500 hover:bg-sky-500/10 transition"
        title="Share on X/Twitter"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.763-5.868 6.763h-3.31l7.732-8.835L.424 2.25h6.7l4.671 6.181 5.719-6.181zM17.09 19.897h1.828L6.452 3.936H4.545l12.545 15.961z" />
        </svg>
      </button>
      <button
        onClick={shareWithThumbnail}
        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition"
        title="Share with thumbnail"
      >
        <Copy className="h-5 w-5" />
      </button>
      <button
        onClick={copyLink}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted/10 transition"
        title="Copy link"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}
