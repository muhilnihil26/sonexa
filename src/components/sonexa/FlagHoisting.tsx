import { useState, useEffect } from "react";
import { ChevronUp, Flag, Music, Award, Share2, Download } from "lucide-react";

export function FlagHoisting() {
  const [flagHeight, setFlagHeight] = useState(0);
  const [isHoisting, setIsHoisting] = useState(false);
  const [isHoisted, setIsHoisted] = useState(false);
  const [userProgress, setUserProgress] = useState(0);

  const startHoisting = () => {
    setIsHoisting(true);
    const interval = setInterval(() => {
      setFlagHeight(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsHoisting(false);
          setIsHoisted(true);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const resetFlag = () => {
    setFlagHeight(0);
    setIsHoisted(false);
    setIsHoisting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-orange-500" />
            Flag Hoisting Ceremony
          </h3>
          <p className="text-muted-foreground mt-1">Hoist the flag and receive your certificate</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-semibold">
            {isHoisted ? "🎉 Completed" : "In Progress"}
          </div>
        </div>
      </div>

      {/* Flag Hoisting Area */}
      <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-green-700 shadow-lg">
        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200" />
        
        {/* Sun */}
        <div className="absolute top-8 right-12 w-16 h-16 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
        
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-800 to-green-600" />
        
        {/* Flag pole */}
        <div className="absolute bottom-24 left-16 w-4 h-96 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-400 rounded-t shadow-xl" />
        
        {/* Flag rope */}
        <div className="absolute bottom-24 left-20 w-1 h-96 bg-gray-400" />
        
        {/* Flag */}
        <div 
          className="absolute left-24 bottom-24 w-48 h-32 rounded transition-all duration-300 ease-out shadow-2xl overflow-hidden"
          style={{ 
            transform: `translateY(-${flagHeight * 2.5}px)`,
            opacity: flagHeight > 0 ? 1 : 0.8
          }}
        >
          {/* Saffron stripe */}
          <div className="h-1/3 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 w-full" />
          {/* White stripe */}
          <div className="h-1/3 bg-gradient-to-r from-white via-gray-100 to-white w-full relative">
            {/* Ashoka Chakra */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 border-2 border-blue-900 rounded-full" />
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
          </div>
          {/* Green stripe */}
          <div className="h-1/3 bg-gradient-to-r from-green-500 via-green-400 to-green-500 w-full" />
          
          {/* Realistic wave effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-r from-transparent via-black/30 to-transparent" />
            <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-r from-transparent via-black/30 to-transparent" />
            <div className="absolute top-0 left-3/4 w-2 h-full bg-gradient-to-r from-transparent via-black/30 to-transparent" />
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-2">
          <div className="text-sm font-semibold text-gray-700">{flagHeight}%</div>
          <div className="w-4 h-64 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="w-full bg-gradient-to-t from-orange-500 via-white to-green-500 transition-all duration-300"
              style={{ height: `${flagHeight}%` }}
            />
          </div>
        </div>

        {/* Crowd silhouettes */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-end gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-8 h-16 bg-gray-800 rounded-t-lg opacity-60"
              style={{ height: `${12 + Math.random() * 8}rem` }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHoisted ? (
            <button
              onClick={startHoisting}
              disabled={isHoisting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <ChevronUp className="h-5 w-5" />
              {isHoisting ? "Hoisting..." : "Hoist Flag"}
            </button>
          ) : (
            <button
              onClick={resetFlag}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
            >
              <Flag className="h-5 w-5" />
              Reset
            </button>
          )}
          
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-colors">
            <Music className="h-4 w-4" />
            Play Anthem
          </button>
        </div>

        {isHoisted && (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
              <Award className="h-4 w-4" />
              Get Certificate
            </button>
            <button className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Achievement message */}
      {isHoisted && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 via-white/10 to-green-500/20 border border-orange-500/30 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎉</div>
            <div>
              <h4 className="font-bold text-foreground">Congratulations!</h4>
              <p className="text-sm text-muted-foreground">You have successfully hoisted the flag. Download your certificate now!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}