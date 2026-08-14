import { useState } from "react";
import { Flag, Play, Pause } from "lucide-react";
import { isIndependenceEnabled } from "@/lib/feature-config";

export function RealisticFlag({ className = "" }: { className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isIndependenceEnabled()) return null;

  return (
    <div className={`relative w-full h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 shadow-2xl ${className}`}>
      {/* Sky background with clouds */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200" />
      
      {/* Sun */}
      <div className="absolute top-8 right-12 w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg shadow-yellow-400/50" />
      
      {/* Clouds */}
      <div className="absolute top-12 left-16 w-32 h-12 bg-white/80 rounded-full blur-md" />
      <div className="absolute top-20 left-32 w-24 h-8 bg-white/60 rounded-full blur-md" />
      
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-800 via-green-700 to-green-600" />
      
      {/* Grass details */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-green-600 to-green-500" />
      
      {/* Flag pole */}
      <div className="absolute bottom-20 left-12 w-4 h-96 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 rounded-t shadow-2xl" />
      
      {/* Pole decorations */}
      <div className="absolute bottom-24 left-12 w-6 h-2 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded shadow" />
      
      {/* Flag lying on the ground - more realistic */}
      <div className="absolute bottom-24 left-20 right-12 h-32 rounded-lg shadow-2xl overflow-hidden transform -rotate-12">
        {/* Realistic fabric texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-green-500/20" />
        
        {/* Saffron stripe with fabric texture */}
        <div className="h-1/3 bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 w-full relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-orange-300/30 to-transparent" />
            <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-r from-transparent via-orange-400/20 to-transparent" />
            <div className="absolute top-0 left-2/4 w-2 h-full bg-gradient-to-r from-transparent via-orange-400/20 to-transparent" />
          </div>
        </div>
        
        {/* White stripe with fabric texture */}
        <div className="h-1/3 bg-gradient-to-br from-white via-gray-50 to-gray-100 w-full relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-gray-200/20 to-transparent" />
            <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-r from-transparent via-gray-300/20 to-transparent" />
            <div className="absolute top-0 left-2/4 w-2 h-full bg-gradient-to-r from-transparent via-gray-300/20 to-transparent" />
          </div>
        </div>
        
        {/* Green stripe with fabric texture */}
        <div className="h-1/3 bg-gradient-to-br from-green-600 via-green-500 to-green-700 w-full relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-green-300/30 to-transparent" />
            <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
            <div className="absolute top-0 left-2/4 w-2 h-full bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
          </div>
        </div>
        
        {/* Ashoka Chakra - more realistic */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border-3 border-blue-900 rounded-full shadow-inner" />
            <div className="absolute inset-1 border-2 border-blue-900 rounded-full" />
            {/* 24 spokes */}
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-3 bg-blue-900 origin-bottom"
                style={{ 
                  transform: `rotate(${i * 15}deg) translateY(-50%) translateX(-50%)`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Shadow */}
        <div className="absolute -bottom-4 left-8 right-8 h-4 bg-black/20 rounded-full blur-md" />
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <p className="text-sm font-bold text-gray-800">🇮🇳 Independence Day</p>
        <p className="text-xs text-gray-600">Flag ready for hoisting ceremony</p>
      </div>
      
      {/* Play button for anthem */}
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-white font-semibold hover:scale-105 transition-transform shadow-lg"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        <span className="text-sm">National Anthem</span>
      </button>
    </div>
  );
}