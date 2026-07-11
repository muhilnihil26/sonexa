import React from 'react';

export function LoadingAnimation({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute w-12 h-12 rounded-full border-2 border-primary/20" />
        {/* Spinning gradient ring */}
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spinner" />
        {/* Inner pulsing core */}
        <div className="absolute w-4 h-4 rounded-full bg-primary/80 shadow-[0_0_15px_rgba(30,215,96,0.5)] animate-pulse" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}
