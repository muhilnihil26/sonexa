import type { Track } from "./player-store";

/**
 * Lightweight video export utilities using Web APIs
 * Generates video frames via canvas, can be combined with MediaRecorder
 */

export async function generateLyricsVideoFrame(
  lyrics: string[],
  currentLine: number,
  options: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    textColor?: string;
  } = {}
): Promise<Canvas> {
  const width = options.width || 1080;
  const height = options.height || 1920;
  const bgColor = options.backgroundColor || "#0a0a0a";
  const textColor = options.textColor || "#ffffff";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "rgba(104, 200, 150, 0.1)");
  grad.addColorStop(1, "rgba(104, 200, 150, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Current lyric (large)
  ctx.font = "bold 72px -apple-system, Inter, sans-serif";
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerY = height / 2;
  const currentText = lyrics[currentLine] || "";
  
  if (currentText) {
    // Wrap text if too long
    const maxWidth = width - 100;
    ctx.fillText(currentText, width / 2, centerY, maxWidth);
  }

  // Next lyric (smaller, faded)
  if (lyrics[currentLine + 1]) {
    ctx.font = "48px -apple-system, Inter, sans-serif";
    ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
    ctx.fillText(lyrics[currentLine + 1], width / 2, centerY + 100);
  }

  // Previous lyric (smaller, faded)
  if (currentLine > 0) {
    ctx.font = "48px -apple-system, Inter, sans-serif";
    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.fillText(lyrics[currentLine - 1], width / 2, centerY - 100);
  }

  return canvas;
}

export async function generateShortsFrame(
  track: Track,
  coverUrl?: string,
  options: { width?: number; height?: number } = {}
): Promise<Canvas> {
  const width = options.width || 1080;
  const height = options.height || 1920;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(1, "#0f0f1e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Cover image
  if (coverUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = coverUrl;
      });

      const coverSize = Math.min(width, height) * 0.7;
      const x = (width - coverSize) / 2;
      const y = (height - coverSize) / 3;

      // Rounded corners for cover
      ctx.save();
      const radius = 30;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + coverSize - radius, y);
      ctx.quadraticCurveTo(x + coverSize, y, x + coverSize, y + radius);
      ctx.lineTo(x + coverSize, y + coverSize - radius);
      ctx.quadraticCurveTo(x + coverSize, y + coverSize, x + coverSize - radius, y + coverSize);
      ctx.lineTo(x + radius, y + coverSize);
      ctx.quadraticCurveTo(x, y + coverSize, x, y + coverSize - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, x, y, coverSize, coverSize);
      ctx.restore();

      // Glow effect
      ctx.shadowColor = "rgba(104, 200, 150, 0.3)";
      ctx.shadowBlur = 40;
      ctx.strokeStyle = "rgba(104, 200, 150, 0.2)";
      ctx.lineWidth = 4;
      ctx.stroke();
    } catch (e) {
      console.error("Failed to load cover image:", e);
    }
  }

  // Song title
  ctx.font = "bold 64px -apple-system, Inter, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(track.title, width / 2, height * 0.65, width - 60);

  // Artist name
  ctx.font = "48px -apple-system, Inter, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(track.artist, width / 2, height * 0.75);

  // Brand watermark
  ctx.font = "28px -apple-system, Inter, sans-serif";
  ctx.fillStyle = "rgba(104, 200, 150, 0.6)";
  ctx.textAlign = "center";
  ctx.fillText("♪ Sonexa", width / 2, height - 60);

  return canvas;
}

export async function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to convert canvas to blob"));
    }, type);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a simple MP4-compatible video using MediaRecorder
 * Note: Requires user permission and browser support
 */
export async function recordCanvasToVideo(
  canvasGenerator: (frameIndex: number) => Promise<Canvas>,
  frameCount: number,
  options: {
    fps?: number;
    mimeType?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<Blob> {
  const fps = options.fps || 30;
  const mimeType = options.mimeType || "video/webm;codecs=vp9";
  const frameDuration = 1000 / fps;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;

    const stream = canvas.getContext("2d")?.canvas.captureStream?.(fps);
    if (!stream) {
      reject(new Error("Canvas capture not supported"));
      return;
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    mediaRecorder.onerror = (e) => {
      reject(e.error);
    };

    mediaRecorder.start();

    let frameIndex = 0;
    const renderFrame = async () => {
      if (frameIndex >= frameCount) {
        mediaRecorder.stop();
        return;
      }

      try {
        const frameCanvas = await canvasGenerator(frameIndex);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(frameCanvas, 0, 0);
        }
        options.onProgress?.((frameIndex / frameCount) * 100);
        frameIndex++;
        setTimeout(renderFrame, frameDuration);
      } catch (e) {
        mediaRecorder.stop();
        reject(e);
      }
    };

    renderFrame();
  });
}
