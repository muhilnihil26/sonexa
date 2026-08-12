import { useEffect, useState } from "react";

export function FlagAnimation() {
  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 0.5) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-2xl">
      {/* Indian Flag */}
      <div className="relative w-full h-full bg-gradient-to-b from-orange-500 via-white to-green-500">
        {/* Saffron stripe */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 animate-pulse" />
        
        {/* White stripe with Ashoka Chakra */}
        <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-gradient-to-r from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <div className="relative w-20 h-20 animate-ashoka-chakra">
            <div className="absolute inset-0 border-4 border-blue-900 rounded-full" />
            <div className="absolute inset-2 border-2 border-blue-900 rounded-full" />
            {/* 24 spokes */}
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-4 bg-blue-900 origin-bottom"
                style={{ 
                  transform: `rotate(${i * 15}deg) translateY(-50%) translateX(-50%)`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Green stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-r from-green-400 via-green-500 to-green-600 animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Wave effect overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(${90 + waveOffset}deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
            backgroundSize: '200% 200%',
            animation: 'tricolor-sweep 3s ease-in-out infinite'
          }}
        />
        
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            backgroundSize: '200% 200%',
            animation: 'tricolor-sweep 2s ease-in-out infinite',
            animationDelay: '1s'
          }}
        />
      </div>
      
      {/* Flag pole */}
      <div className="absolute left-4 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 rounded-l shadow-lg" />
      
      {/* Pole top decoration */}
      <div className="absolute left-2 top-0 w-6 h-6 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full shadow-lg" />
    </div>
  );
}