import { useState } from "react";
import { TrendingUp, Users, Share2, Award, Flame, Zap } from "lucide-react";

interface UserStats {
  invitesSent: number;
  friendsJoined: number;
  totalShares: number;
  hypeLevel: number;
  badges: string[];
}

export function HypeInviteTracker() {
  const [stats, setStats] = useState<UserStats>({
    invitesSent: 0,
    friendsJoined: 0,
    totalShares: 0,
    hypeLevel: 1,
    badges: []
  });

  const [inviteLink] = useState("https://sonexa.app/invite");

  const increaseHype = () => {
    setStats(prev => ({
      ...prev,
      totalShares: prev.totalShares + 1,
      hypeLevel: Math.min(10, Math.floor((prev.totalShares + 1) / 5) + 1)
    }));
  };

  const shareInvite = () => {
    increaseHype();
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: "Join Sonexa - Tamil Music Streaming",
        text: "🎵 Check out Sonexa - the best Tamil music streaming app! Join me and earn rewards!",
        url: inviteLink
      });
    }
  };

  const getBadgeForLevel = (level: number) => {
    const badges = {
      1: "🎵 Music Explorer",
      2: "🌟 Rising Star",
      3: "🔥 Trending",
      4: "⭐ Super Sharer",
      5: "💎 Gem Collector",
      6: "👑 Hype Master",
      7: "🚀 Social Butterfly",
      8: "🎭 Influencer",
      9: "🌟 Legendary",
      10: "🏆 Ultimate"
    };
    return badges[level] || "🎵 Music Explorer";
  };

  const getProgressPercent = () => {
    return Math.min(100, (stats.hypeLevel / 10) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
            Hype & Invite Tracker
          </h3>
          <p className="text-muted-foreground mt-1">Share to increase your hype level and unlock rewards</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-white text-sm font-bold">
            Level {stats.hypeLevel}
          </div>
        </div>
      </div>

      {/* Hype Level Progress */}
      <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-orange-500/10 via-background to-green-500/10 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getBadgeForLevel(stats.hypeLevel)}</div>
            <div>
              <h4 className="font-bold text-foreground">Hype Level {stats.hypeLevel}</h4>
              <p className="text-sm text-muted-foreground">{getBadgeForLevel(stats.hypeLevel)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{getProgressPercent()}%</div>
            <div className="text-xs text-muted-foreground">to next level</div>
          </div>
        </div>
        
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
            style={{ width: `${getProgressPercent()}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/40 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{stats.invitesSent}</span>
          </div>
          <div className="text-xs text-muted-foreground">Invites Sent</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/40 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold text-foreground">{stats.friendsJoined}</span>
          </div>
          <div className="text-xs text-muted-foreground">Friends Joined</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/40 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold text-foreground">{stats.totalShares}</span>
          </div>
          <div className="text-xs text-muted-foreground">Total Shares</div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Share to Increase Hype
        </h4>
        
        <button
          onClick={shareInvite}
          className="w-full p-4 rounded-xl border border-border bg-card/40 hover:bg-card transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Share on Social Media</div>
              <div className="text-sm text-muted-foreground">+10 hype points per share</div>
            </div>
          </div>
          <Award className="h-5 w-5 text-yellow-500" />
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(inviteLink);
            increaseHype();
          }}
          className="w-full p-4 rounded-xl border border-border bg-card/40 hover:bg-card transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Copy Invite Link</div>
              <div className="text-sm text-muted-foreground">+5 hype points per copy</div>
            </div>
          </div>
          <Zap className="h-5 w-5 text-yellow-500" />
        </button>
      </div>

      {/* Hype Rewards */}
      <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-yellow-500/10 via-background to-orange-500/10">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Hype Rewards
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/60">
            <span className="text-sm text-foreground">Level 5 Unlock</span>
            <span className="text-sm font-semibold text-primary">Premium features</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/60">
            <span className="text-sm text-foreground">Level 8 Unlock</span>
            <span className="text-sm font-semibold text-primary">Exclusive playlists</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/60">
            <span className="text-sm text-foreground">Level 10 Unlock</span>
            <span className="text-sm font-semibold text-primary">VIP status</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="p-4 rounded-xl border border-border bg-card/40">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Top Hype Leaders
        </h4>
        <div className="space-y-2">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className="flex items-center gap-3 p-2 rounded-lg bg-background/60">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                {rank}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">User {rank}</div>
                <div className="text-xs text-muted-foreground">Level {10 - rank + 1}</div>
              </div>
              <div className="text-sm text-primary font-semibold">{(10 - rank + 1) * 1000} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}