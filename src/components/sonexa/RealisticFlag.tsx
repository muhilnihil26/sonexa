import { useState } from "react";
import { Flag, Play, Pause } from "lucide-react";

export function RealisticFlag() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100 shadow-lg">
      {/* Sky background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100" />
      
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-800 to-green-600" />
      
      {/* Flag pole */}
      <div className="absolute bottom-16 left-8 w-3 h-80 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-400 rounded-t shadow-xl" />
      
      {/* Flag lying on the ground */}
      <div className="absolute bottom-20 left-12 right-8 h-24 rounded-lg shadow-2xl overflow-hidden">
        {/* Saffron stripe */}
        <div className="h-1/3 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 w-full" />
        {/* White stripe */}
        <div className="h-1/3 bg-gradient-to-r from-white via-gray-100 to-white w-full" />
        {/* Green stripe */}
        <div className="h-1/3 bg-gradient-to-r from-green-500 via-green-400 to-green-500 w-full" />
        
        {/* Ashoka Chakra */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border-2 border-blue-900 rounded-full" />
            <div className="absolute inset-1 border border-blue-900 rounded-full" />
            {/* 24 spokes */}
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-blue-900 origin-bottom"
                style={{ 
                  transform: `rotate(${i * 15}deg) translateY(-50%) translateX(-50%)`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Realistic folds */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-r from-transparent via-black/20 to-transparent" />
          <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-r from-transparent via-black/20 to-transparent" />
          <div className="absolute top-0 left-3/4 w-2 h-full bg-gradient-to-r from-transparent via-black/20 to-transparent" />
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-800">🇮🇳 Independence Day</p>
        <p className="text-xs text-gray-600">Flag ready for hoisting</p>
      </div>
      
      {/* Play button for anthem */}
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-full hover:bg-blue-800 transition-colors shadow-lg"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span className="text-sm font-semibold">National Anthem</span>
      </button>
    </div>
  );
}