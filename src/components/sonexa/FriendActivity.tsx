import { useState } from "react";
import { Users, Music2, Clock, Share2, Heart, MessageCircle, UserPlus } from "lucide-react";

interface FriendActivity {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: "listening" | "liked" | "shared" | "added";
  track?: {
    title: string;
    artist: string;
    cover: string;
  };
  timestamp: string;
}

const MOCK_ACTIVITIES: FriendActivity[] = [
  {
    id: "1",
    user: { name: "Priya", avatar: "" },
    action: "listening",
    track: { title: "Naa Ready", artist: "Anirudh Ravichander", cover: "" },
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    user: { name: "Karthik", avatar: "" },
    action: "liked",
    track: { title: "Aradhya", artist: "Hesham Abdul Wahab", cover: "" },
    timestamp: "5 minutes ago",
  },
  {
    id: "3",
    user: { name: "Sneha", avatar: "" },
    action: "shared",
    track: { title: "Kalaavathi", artist: "S. Thaman", cover: "" },
    timestamp: "10 minutes ago",
  },
  {
    id: "4",
    user: { name: "Rahul", avatar: "" },
    action: "added",
    track: { title: "Halamathi Habibo", artist: "A.R. Rahman", cover: "" },
    timestamp: "15 minutes ago",
  },
];

export function FriendActivity() {
  const [activities] = useState<FriendActivity[]>(MOCK_ACTIVITIES);
  const [showAll, setShowAll] = useState(false);

  const getActionIcon = (action: FriendActivity["action"]) => {
    switch (action) {
      case "listening":
        return <Music2 className="h-4 w-4 text-primary" />;
      case "liked":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "shared":
        return <Share2 className="h-4 w-4 text-blue-500" />;
      case "added":
        return <UserPlus className="h-4 w-4 text-green-500" />;
    }
  };

  const getActionText = (action: FriendActivity["action"]) => {
    switch (action) {
      case "listening":
        return "is listening to";
      case "liked":
        return "liked";
      case "shared":
        return "shared";
      case "added":
        return "added to playlist";
    }
  };

  return (
    <div className="p-4 rounded-xl bg-card/40 border border-border/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Friend Activity</h3>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline"
        >
          {showAll ? "Show less" : "See all"}
        </button>
      </div>

      <div className="space-y-3">
        {activities.slice(0, showAll ? activities.length : 3).map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-card/50 transition"
          >
            <div className="h-10 w-10 rounded-full bg-brand-gradient flex items-center justify-center text-background font-bold shrink-0">
              {activity.user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{activity.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {getActionText(activity.action)}
                </span>
              </div>
              {activity.track && (
                <div className="text-sm text-muted-foreground truncate">
                  {activity.track.title} - {activity.track.artist}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                {activity.timestamp}
              </div>
            </div>
            <div className="shrink-0">{getActionIcon(activity.action)}</div>
          </div>
        ))}
      </div>

      {/* Social Sharing Buttons */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Share your music</span>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm hover:bg-blue-500/20 transition">
            <MessageCircle className="h-4 w-4" />
            Message
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-500 text-sm hover:bg-green-500/20 transition">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-500 text-sm hover:bg-purple-500/20 transition">
            <UserPlus className="h-4 w-4" />
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}
