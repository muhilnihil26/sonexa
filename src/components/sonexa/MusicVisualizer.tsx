import { useEffect, useRef, useState } from "react";

interface MusicVisualizerProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
  className?: string;
  barCount?: number;
}

export function MusicVisualizer({ 
  isPlaying, 
  audioElement, 
  className = "",
  barCount = 32 
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize audio context on first play
    if (!isInitialized) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize audio context:", error);
        return;
      }
    }

    const analyser = analyserRef.current;
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / barCount) * 0.8;
      const gap = (width / barCount) * 0.2;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * (bufferLength / barCount));
        const value = dataArray[dataIndex];
        const barHeight = (value / 255) * height;

        const x = i * (barWidth + gap) + gap / 2;
        const y = height - barHeight;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, height, x, y);
        gradient.addColorStop(0, "oklch(0.68 0.18 150)");
        gradient.addColorStop(0.5, "oklch(0.78 0.18 60)");
        gradient.addColorStop(1, "oklch(0.7 0.24 350)");

        ctx.fillStyle = gradient;
        
        // Draw rounded bar
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = "oklch(0.68 0.18 150)";
        ctx.shadowBlur = 10;
      }
      
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioElement, isInitialized, barCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
