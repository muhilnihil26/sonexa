import { useState, useEffect } from "react";
import { Play, Pause, Volume2, Maximize, SkipForward } from "lucide-react";

export function SonexaAdVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 0.5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const skipAd = () => {
    setProgress(100);
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
      {/* Video placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-white to-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-3xl font-bold text-white mb-2">Sonexa</h2>
          <p className="text-white/80">Listen Beyond Limits</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm">Independence Day Special</span>
          </div>
        </div>
      </div>

      {/* Play button overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          >
            <Play className="h-8 w-8 text-gray-900 ml-1" />
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white ml-0.5" />}
          </button>
          
          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <span className="text-white text-sm">{Math.floor(progress)}%</span>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Volume2 className="h-5 w-5 text-white" />
          </button>
          
          <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <Maximize className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Ad skip button */}
        {progress > 50 && (
          <button
            onClick={skipAd}
            className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors"
          >
            Skip Ad
          </button>
        )}

        {/* Ad badge */}
        <div className="absolute top-4 left-4 px-2 py-1 rounded bg-yellow-500 text-black text-xs font-bold">
          AD
        </div>
      </div>

      {/* Independence Day branding */}
      <div className="absolute top-4 right-16 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-500 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-900">🇮🇳</span>
        </div>
      </div>
    </div>
  );
}