import { useState, useEffect } from "react";
import { Share2, Copy, Check, Users, MessageCircle, Send, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function ImprovedInviteSystem() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [inviteLink] = useState("https://sonexa.app/invite");
  const [hypePoints, setHypePoints] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sonexa.hype.points");
      if (saved) setHypePoints(parseInt(saved, 10));
    }
  }, []);

  const addHypePoints = (amount: number, actionName: string) => {
    setHypePoints((prev) => {
      const next = prev + amount;
      localStorage.setItem("sonexa.hype.points", next.toString());
      toast.success(`+${amount} Hype Points! (${actionName})`, {
        icon: "🔥"
      });
      return next;
    });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    addHypePoints(5, "Copied link");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmailInvite = () => {
    if (email) {
      setSentInvites([...sentInvites, email]);
      setEmail("");
      addHypePoints(15, "Invited friend via Email");
    }
  };

  const shareOnSocial = (platform: string) => {
    const shareText = "🎵 Join me on Sonexa - the ultimate Tamil music experience! Stream your favorite tunes and podcasts now. #Sonexa #TamilMusic";
    const shareUrl = encodeURIComponent(inviteLink);
    
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareText)} ${shareUrl}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank");
      addHypePoints(10, `Shared on ${platform}`);
    }
  };

  // Hype rank progression logic
  const getRankInfo = () => {
    if (hypePoints < 15) return { name: "Music Fan", level: 1, next: 15, badge: "🥉" };
    if (hypePoints < 40) return { name: "Community Promoter", level: 2, next: 40, badge: "🥈" };
    if (hypePoints < 80) return { name: "Sonexa Ambassador", level: 3, next: 80, badge: "🥇" };
    return { name: "Sonexa Hype Master", level: 4, next: 999, badge: "👑" };
  };

  const rank = getRankInfo();
  const progressPercent = Math.min(100, (hypePoints / rank.next) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Invite Friends
        </h3>
        <p className="text-muted-foreground mt-1">Share the vibe with your friends and boost your hype score</p>
      </div>

      {/* Hype Meter Card */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur relative overflow-hidden shadow-glow">
        <div className="absolute top-3 right-3 text-2xl">{rank.badge}</div>
        
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4 animate-spin-slow" /> Hype Meter
        </div>
        
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-3xl font-black text-foreground">{hypePoints} <span className="text-xs text-muted-foreground font-normal">pts</span></div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{rank.name} (Lvl {rank.level})</div>
        </div>

        <div className="mt-3 relative h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-purple-500 to-green-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {rank.next !== 999 && (
          <div className="mt-2 text-[10px] text-muted-foreground text-right font-medium">
            {rank.next - hypePoints} points to level up
          </div>
        )}
      </div>

      {/* Invite Link */}
      <div className="p-6 rounded-2xl border border-border bg-card/45 backdrop-blur">
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Your Unique Invite Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground text-sm"
            />
            <button
              onClick={copyInviteLink}
              className="px-4 py-3 rounded-xl bg-primary text-background font-semibold hover:bg-primary/90 transition-colors"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="flex items-center gap-3 mt-5">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Share:</span>
          <button
            onClick={() => shareOnSocial("whatsapp")}
            className="p-2.5 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareOnSocial("twitter")}
            className="p-2.5 rounded-full bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareOnSocial("facebook")}
            className="p-2.5 rounded-full bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Email Invite */}
      <div className="p-6 rounded-2xl border border-border bg-card/45 backdrop-blur">
        <h4 className="font-semibold text-foreground text-sm mb-3">Invite via Email</h4>
        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground text-sm"
          />
          <button
            onClick={sendEmailInvite}
            className="px-6 py-3 rounded-xl bg-primary text-background font-semibold hover:bg-primary/90 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}