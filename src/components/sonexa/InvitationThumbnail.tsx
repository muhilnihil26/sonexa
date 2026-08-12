import { Flag, Music, Sparkles, Users, Gift, Flame } from "lucide-react";

export function InvitationThumbnail({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const sizeClasses = {
    small: "w-32 h-24",
    medium: "w-64 h-48", 
    large: "w-full h-64"
  };

  return (
    <div className={`${sizeClasses[size]} relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-white to-green-500 shadow-glow`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 w-8 h-8 border-2 border-blue-900 rounded-full animate-spin-slow" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-blue-900 rounded-full animate-spin-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Tricolor stripes */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-r from-orange-400 to-orange-600" />
      <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-gradient-to-r from-gray-50 to-white" />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-r from-green-400 to-green-600" />

      {/* Ashoka Chakra */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16">
        <div className="relative w-full h-full animate-ashoka-chakra">
          <div className="absolute inset-0 border-4 border-blue-900 rounded-full" />
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-blue-900 origin-bottom"
              style={{ 
                transform: `rotate(${i * 15}deg) translateY(-50%) translateX(-50%)`
              }}
            />
          ))}
        </div>
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
        <div className="flex items-center gap-2 mb-2">
          <Flag className="h-6 w-6 text-orange-400" />
          <span className="text-white font-bold text-lg">Independence Day</span>
        </div>
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-green-400" />
          <span className="text-white text-sm">Special Offer</span>
        </div>
        <div className="mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-blue-900 text-xs font-bold">
          3 MONTHS FREE
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-2 right-2">
        <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
      </div>
      <div className="absolute bottom-2 left-2">
        <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
      </div>
    </div>
  );
}

export function PromotionalBanner() {
  return (
    <div className="relative w-full h-48 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-white to-green-500 shadow-glow">
      {/* Animated background */}
      <div className="absolute inset-0 animate-tricolor-sweep" style={{ backgroundSize: '200% 200%' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Decorative particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-independence-float opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ['#FF9933', '#FFFFFF', '#138808'][i % 3],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}

      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="h-6 w-6 text-orange-400" />
            <span className="text-white font-bold text-xl">Independence Day</span>
          </div>
          <p className="text-white/90 text-sm mb-3">Invite friends & get 3 months premium free!</p>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-green-400" />
            <span className="text-white text-sm font-semibold">Limited Time Offer</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">3</div>
            <div className="text-xs text-white/80">MONTHS FREE</div>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50%</div>
            <div className="text-xs text-white/80">OFF FOR FRIENDS</div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="absolute bottom-4 right-4">
        <button className="px-4 py-2 rounded-full bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-lg">
          Invite Now
        </button>
      </div>
    </div>
  );
}

export function SocialShareCard() {
  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-white to-green-500 shadow-glow">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse" />
        <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-gradient-to-r from-gray-50 to-white" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-r from-green-400 to-green-600 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4">
          <Flag className="h-12 w-12 text-orange-400 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Independence Day</h3>
        <p className="text-white/90 text-sm mb-4">Music Celebration</p>
        
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-green-400" />
          <span className="text-white text-sm">Invite Friends</span>
        </div>

        <div className="px-4 py-2 rounded-full bg-blue-900 text-white text-sm font-bold mb-4">
          3 MONTHS FREE
        </div>

        <div className="flex items-center gap-2 text-white/80 text-xs">
          <Music className="h-3 w-3" />
          <span>Sonexa.app</span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-blue-900 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-blue-900 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-blue-900 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-blue-900 rounded-br-lg" />
    </div>
  );
}