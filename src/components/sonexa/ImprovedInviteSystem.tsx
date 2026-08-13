import { useState } from "react";
import { Share2, Copy, Check, Users, Music, Mail, MessageCircle, Send, Gift } from "lucide-react";

export function ImprovedInviteSystem() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [inviteLink] = useState("https://sonexa.app/invite");

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmailInvite = () => {
    if (email) {
      setSentInvites([...sentInvites, email]);
      setEmail("");
    }
  };

  const shareOnSocial = (platform: string) => {
    const shareText = "🎵 Join me on Sonexa - the best Tamil music streaming app! Listen to unlimited Tamil songs, podcasts, and more. #Sonexa #TamilMusic";
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
    
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Invite Friends
          </h3>
          <p className="text-muted-foreground mt-1">Share Sonexa with your friends and family</p>
        </div>
      </div>

      {/* Invite Link */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-semibold text-foreground mb-2 block">Your Invite Link</label>
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
        </div>

        {/* Social Share Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm text-muted-foreground">Share via:</span>
          <button
            onClick={() => shareOnSocial("whatsapp")}
            className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareOnSocial("twitter")}
            className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareOnSocial("facebook")}
            className="p-2 rounded-full bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Email Invite */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Send Email Invitation</h4>
            <p className="text-sm text-muted-foreground">Invite friends directly via email</p>
          </div>
        </div>
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

      {/* Invite Benefits */}
      <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-primary/10">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="h-6 w-6 text-primary" />
          <h4 className="font-semibold text-foreground">Why Invite Friends?</h4>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-background/60">
            <Music className="h-5 w-5 text-primary mb-2" />
            <h5 className="font-semibold text-foreground text-sm mb-1">Share Music</h5>
            <p className="text-xs text-muted-foreground">Create and share playlists together</p>
          </div>
          <div className="p-4 rounded-xl bg-background/60">
            <Users className="h-5 w-5 text-primary mb-2" />
            <h5 className="font-semibold text-foreground text-sm mb-1">Build Community</h5>
            <p className="text-xs text-muted-foreground">Connect with music lovers</p>
          </div>
          <div className="p-4 rounded-xl bg-background/60">
            <Gift className="h-5 w-5 text-primary mb-2" />
            <h5 className="font-semibold text-foreground text-sm mb-1">Exclusive Features</h5>
            <p className="text-xs text-muted-foreground">Unlock special features together</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl text-center bg-card/40 border border-border">
          <div className="text-2xl font-bold text-primary">{sentInvites.length}</div>
          <div className="text-xs text-muted-foreground">Invites Sent</div>
        </div>
        <div className="p-4 rounded-xl text-center bg-card/40 border border-border">
          <div className="text-2xl font-bold text-green-400">0</div>
          <div className="text-xs text-muted-foreground">Friends Joined</div>
        </div>
        <div className="p-4 rounded-xl text-center bg-card/40 border border-border">
          <div className="text-2xl font-bold text-yellow-400">0</div>
          <div className="text-xs text-muted-foreground">Playlists Shared</div>
        </div>
      </div>

      {/* Sent Invites List */}
      {sentInvites.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-card/40">
          <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Recently Invited
          </h5>
          <div className="space-y-2">
            {sentInvites.map((email, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-background/40">
                <span className="text-sm text-foreground">{email}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Pending</span>
                  <Check className="h-4 w-4 text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}