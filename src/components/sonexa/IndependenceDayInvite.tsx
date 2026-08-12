import { useState } from "react";
import { Share2, Copy, Check, Gift, Users, Flame, Star, Sparkles, Mail, MessageCircle, Send } from "lucide-react";

interface InvitationOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  features: string[];
  thumbnail: string;
  popular: boolean;
}

const independenceOffers: InvitationOffer[] = [
  {
    id: "1",
    title: "Freedom Premium",
    description: "Share freedom with friends - 3 months premium for you both!",
    discount: "3 MONTHS FREE",
    features: [
      "Ad-free music streaming",
      "Unlimited skips",
      "High-quality audio",
      "Offline downloads",
      "Exclusive patriotic playlists"
    ],
    thumbnail: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop",
    popular: true
  },
  {
    id: "2",
    title: "Patriotic Duo",
    description: "Celebrate together - 50% off for you and a friend",
    discount: "50% OFF",
    features: [
      "Share premium account",
      "Family plan access",
      "Multi-device streaming",
      "Patriotic music library",
      "Priority support"
    ],
    thumbnail: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=300&fit=crop",
    popular: false
  },
  {
    id: "3",
    title: "Independence Special",
    description: "Limited time offer - Free trial extended to 2 months",
    discount: "2 MONTHS FREE",
    features: [
      "Extended free trial",
      "Full premium access",
      "All music genres",
      "Radio stations",
      "No credit card required"
    ],
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    popular: false
  }
];

export function IndependenceDayInvite() {
  const [selectedOffer, setSelectedOffer] = useState<InvitationOffer | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState("https://sonexa.app/invite/independence-2026");
  const [email, setEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<string[]>([]);

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
    const shareText = "🇮🇳 Celebrate Independence Day with me on Sonexa! Get exclusive patriotic music and special offers. Join the freedom celebration! #IndependenceDay2026 #Sonexa";
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
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 via-white/10 to-green-500/20 text-orange-400 text-sm font-semibold mb-4">
          <Flame className="h-4 w-4 animate-pulse" />
          Independence Day Special
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
        <h3 className="text-3xl font-bold mb-2">
          <span className="text-orange-400">Invite Friends</span>, <span className="text-white">Share Freedom</span>
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Celebrate India's independence by sharing the gift of music with your friends. 
          Exclusive Independence Day offers when you invite friends to join Sonexa.
        </p>
      </div>

      {/* Invitation Link */}
      <div className="p-6 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-white/5 to-green-500/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-semibold text-foreground mb-2 block">Your Invitation Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground text-sm"
              />
              <button
                onClick={copyInviteLink}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 text-blue-900 font-semibold hover:scale-105 transition-transform"
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
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 text-blue-900 font-semibold hover:scale-105 transition-transform"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Special Offers */}
      <div>
        <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-orange-400" />
          Independence Day Special Offers
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          {independenceOffers.map((offer) => (
            <div
              key={offer.id}
              className={`relative p-4 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                selectedOffer?.id === offer.id
                  ? "border-orange-500/50 bg-orange-500/10 shadow-glow"
                  : offer.popular
                  ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-green-500/10"
                  : "border-border bg-card/40 hover:bg-card"
              }`}
            >
              {offer.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-blue-900 text-xs font-bold shadow-glow animate-pulse">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Thumbnail */}
              <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                <img
                  src={offer.thumbnail}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
                    {offer.discount}
                  </div>
                </div>
              </div>

              {/* Offer Details */}
              <h5 className="font-bold text-foreground mb-2">{offer.title}</h5>
              <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {offer.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select Button */}
              <button
                onClick={() => setSelectedOffer(offer)}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  selectedOffer?.id === offer.id
                    ? "bg-gradient-to-r from-orange-500 to-green-500 text-blue-900 shadow-glow"
                    : "bg-card/60 text-foreground hover:bg-card border border-border"
                }`}
              >
                {selectedOffer?.id === offer.id ? "Selected" : "Choose Offer"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl text-center bg-card/40 border border-border">
          <div className="text-2xl font-bold text-orange-">{sentInvites.length}</div>
          <div className="text-xs text-muted-foreground">Invites Sent</div>
        </div>
        <div className="p-4 rounded-xl text-center bg-card/40 border border-border">
          <div className="text-2xl font-bold text-green-400">0</div>
          <div className="text-xs text-muted-foreground">Friends Joined</div>
        </div>
        <div className="p-4 rounded-xl text-center bg-card/40 border border-border">
          <div className="text-2xl font-bold text-yellow-400">0</div>
          <div className="text-xs text-muted-foreground">Rewards Earned</div>
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