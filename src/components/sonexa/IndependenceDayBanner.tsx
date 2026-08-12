import { useState, useEffect } from "react";
import { Play, Flame, Calendar, Music, Flag, Sparkles } from "lucide-react";

export function IndependenceDayBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Calculate countdown to August 15
    const calculateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      let independenceDay = new Date(currentYear, 7, 15); // August 15 (month is 0-indexed)
      
      if (now > independenceDay) {
        independenceDay = new Date(currentYear + 1, 7, 15);
      }
      
      const diff = independenceDay.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const patrioticSongs = [
    "Vande Mataram",
    "Maa Tujhe Salaam", 
    "Aye Mere Watan Ke Logo",
    "Jana Gana Mana",
    "Sare Jahan Se Achha"
  ];

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-orange-500/20 via-white/10 to-green-500/20 backdrop-blur-xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-green-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400/60 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Ashoka Chakra wheel animation */}
      <div className="absolute top-4 right-4 w-16 h-16 opacity-20">
        <div className="relative w-full h-full animate-spin-slow">
          <div className="absolute inset-0 border-4 border-blue-900 rounded-full" />
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1 h-3 bg-blue-900 origin-bottom transform -translate-x-1/2 -translate-y-full"
              style={{ transform: `rotate(${i * 15}deg) translateY(-50%)` }}
            />
          ))}
        </div>
      </div>

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-500 animate-pulse">
                <Flag className="h-5 w-5 text-blue-900" />
              </div>
              <span className="text-sm font-semibold text-orange-400">Special Feature</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black mb-2">
              <span className="text-orange-400">Independence</span>
              <span className="text-white"> Day</span>
              <span className="text-green-400"> Special</span>
            </h2>
            
            <p className="text-muted-foreground mb-4 max-w-lg">
              Celebrate the spirit of freedom with our curated collection of patriotic Tamil songs and timeless classics.
            </p>

            {/* Countdown timer */}
            <div className="flex items-center gap-4 mb-4">
              <Calendar className="h-4 w-4 text-orange-400" />
              <div className="flex gap-3">
                {Object.entries(countdown).map(([unit, value]) => (
                  <div key={unit} className="text-center">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-muted-foreground capitalize">{unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrolling patriotic songs */}
            <div className="relative overflow-hidden h-8 mb-4">
              <div className="flex gap-8 animate-marquee-left whitespace-nowrap">
                {[...patrioticSongs, ...patrioticSongs].map((song, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Music className="h-3 w-3 text-orange-400" />
                    {song}
                  </div>
                ))}
              </div>
            </div>

            <button className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 via-white to-green-500 text-blue-900 font-bold hover:scale-105 transition-all duration-300 shadow-glow">
              <Play className="h-4 w-4 group-hover:animate-play-pulse" />
              Listen Now
              <Sparkles className="h-4 w-4 animate-pulse" />
            </button>
          </div>

          {/* Right decorative elements */}
          <div className="hidden md:block">
            <div className="relative w-48 h-48">
              {/* Tricolor stripes */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl animate-pulse" />
              <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-gradient-to-r from-white to-gray-100" />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-r from-green-500 to-green-600 rounded-b-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              
              {/* Center decoration */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center animate-float">
                <Flame className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-green-500 animate-gradient-pan" />
    </div>
  );
}