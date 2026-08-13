import { useState, useRef, useCallback } from "react";
import { Award, Download, Share2, X } from "lucide-react";

export function FlagHoistingCertificate() {
  const [userName, setUserName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCertificate = useCallback(() => {
    if (!userName.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = 900;
    const h = 640;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#FFF8F0");
    bg.addColorStop(0.5, "#FFFFFF");
    bg.addColorStop(1, "#F0FFF4");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Decorative border
    ctx.strokeStyle = "#D4A017";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.strokeStyle = "#C8860080";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // Corner ornaments
    const corners = [[35, 35], [w - 55, 35], [35, h - 55], [w - 55, h - 55]];
    corners.forEach(([x, y]) => {
      ctx.fillStyle = "#D4A017";
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Tricolor top bar
    const barY = 50;
    const barH = 6;
    ctx.fillStyle = "#FF9933";
    ctx.fillRect(50, barY, (w - 100) / 3, barH);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(50 + (w - 100) / 3, barY, (w - 100) / 3, barH);
    ctx.fillStyle = "#138808";
    ctx.fillRect(50 + (2 * (w - 100)) / 3, barY, (w - 100) / 3, barH);

    // Title
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Certificate of Honour", w / 2, 110);

    // Subtitle
    ctx.fillStyle = "#555";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("Flag Hoisting Ceremony — Independence Day 2026", w / 2, 145);

    // Divider
    ctx.strokeStyle = "#D4A01780";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 165);
    ctx.lineTo(w - 200, 165);
    ctx.stroke();

    // Body text
    ctx.fillStyle = "#333";
    ctx.font = "18px Georgia, serif";
    ctx.fillText("This is to certify that", w / 2, 220);

    // User name
    ctx.fillStyle = "#000080";
    ctx.font = "bold 42px Georgia, serif";
    ctx.fillText(userName, w / 2, 280);

    // More body
    ctx.fillStyle = "#333";
    ctx.font = "18px Georgia, serif";
    ctx.fillText("has proudly hoisted the Indian National Flag", w / 2, 330);
    ctx.fillText("as a tribute to India's Independence on", w / 2, 360);
    ctx.fillText("15th August, 2026", w / 2, 390);

    // Divider
    ctx.beginPath();
    ctx.moveTo(250, 420);
    ctx.lineTo(w - 250, 420);
    ctx.stroke();

    // Ashoka Chakra (simplified)
    ctx.strokeStyle = "#000080";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, 470, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, 470, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#000080";
    ctx.fill();
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15 * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(w / 2, 470);
      ctx.lineTo(w / 2 + 22 * Math.cos(angle), 470 + 22 * Math.sin(angle));
      ctx.stroke();
    }

    // Date
    const dateStr = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    ctx.fillStyle = "#666";
    ctx.font = "14px Georgia, serif";
    ctx.fillText(dateStr, w / 2, 530);

    // Signature lines
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 570);
    ctx.lineTo(300, 570);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 300, 570);
    ctx.lineTo(w - 120, 570);
    ctx.stroke();

    ctx.fillStyle = "#888";
    ctx.font = "12px Georgia, serif";
    ctx.fillText("Organiser", 210, 590);
    ctx.fillText("Digital Signature", w - 210, 590);

    // Sonexa branding
    ctx.fillStyle = "#aaa";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("Powered by SONEXA — Listen Beyond Limits", w / 2, 620);

    // Tricolor bottom bar
    const bBarY = h - 56;
    ctx.fillStyle = "#FF9933";
    ctx.fillRect(50, bBarY, (w - 100) / 3, barH);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(50 + (w - 100) / 3, bBarY, (w - 100) / 3, barH);
    ctx.fillStyle = "#138808";
    ctx.fillRect(50 + (2 * (w - 100)) / 3, bBarY, (w - 100) / 3, barH);

    const url = canvas.toDataURL("image/png");
    setImageUrl(url);
    setShowModal(true);
  }, [userName]);

  const downloadCertificate = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `Sonexa_Independence_Certificate_${userName.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  const shareCertificate = async () => {
    if (!imageUrl) return;
    if (navigator.share) {
      try {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], "certificate.png", { type: "image/png" });
        await navigator.share({ title: "My Flag Hoisting Certificate", files: [file] });
      } catch {
        // fallback
        await navigator.clipboard.writeText("I hoisted the flag on Sonexa! 🇮🇳 #IndependenceDay #Sonexa");
      }
    } else {
      await navigator.clipboard.writeText("I hoisted the flag on Sonexa! 🇮🇳 #IndependenceDay #Sonexa");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Award className="h-5 w-5 text-yellow-500" /> Flag Hoisting Certificate
      </h3>

      <div className="flex gap-3">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your full name"
          className="flex-1 px-4 py-2.5 rounded-xl bg-background/60 border border-border text-foreground text-sm"
        />
        <button
          onClick={generateCertificate}
          disabled={!userName.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate
        </button>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Modal */}
      {showModal && imageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative max-w-2xl w-full bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-fade-up">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <img src={imageUrl} alt="Certificate" className="w-full" />

            <div className="flex gap-3 justify-center p-4 border-t border-border">
              <button
                onClick={downloadCertificate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" /> Download PNG
              </button>
              <button
                onClick={shareCertificate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}