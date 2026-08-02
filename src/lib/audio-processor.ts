/**
 * Audio processing and masking utilities for Sonexa
 * Handles Web Audio API, sound extraction, and native audio controls
 */

export type AudioAnalytics = {
  frequency: number[];
  amplitude: number;
  bass: number;
  mid: number;
  treble: number;
};

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  private isRunning = false;

  constructor() {
    if (typeof window !== "undefined" && window.AudioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn("Web Audio API not supported", e);
      }
    }
  }

  /**
   * Initialize analyzer for audio visualization
   */
  initialize(audioElement: HTMLAudioElement) {
    if (!this.audioContext) return false;

    try {
      // Create source from audio element
      this.source = this.audioContext.createMediaElementAudioSource(audioElement);

      // Create analyzer
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      // Connect nodes
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      return true;
    } catch (e) {
      console.error("Audio initialization failed:", e);
      return false;
    }
  }

  /**
   * Get real-time audio analytics
   */
  getAnalytics(): AudioAnalytics | null {
    if (!this.analyser || !this.dataArray) return null;

    this.analyser.getByteFrequencyData(this.dataArray);

    const length = this.dataArray.length;
    const bass = this.dataArray.slice(0, length / 4).reduce((a, b) => a + b) / (length / 4);
    const mid = this.dataArray.slice(length / 4, (length / 4) * 3).reduce((a, b) => a + b) / (length / 2);
    const treble = this.dataArray.slice((length / 4) * 3).reduce((a, b) => a + b) / (length / 4);
    const amplitude = (bass + mid + treble) / 3 / 255;

    return {
      frequency: Array.from(this.dataArray),
      amplitude,
      bass: bass / 255,
      mid: mid / 255,
      treble: treble / 255,
    };
  }

  /**
   * Start continuous audio analysis
   */
  startMonitoring(callback: (analytics: AudioAnalytics) => void) {
    if (this.isRunning) return;
    this.isRunning = true;

    const monitor = () => {
      const analytics = this.getAnalytics();
      if (analytics) {
        callback(analytics);
      }
      this.animationId = requestAnimationFrame(monitor);
    };

    monitor();
  }

  /**
   * Stop audio monitoring
   */
  stopMonitoring() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isRunning = false;
  }

  /**
   * Extract audio buffer from media element
   */
  async extractAudioBuffer(audioElement: HTMLAudioElement): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;

    try {
      const response = await fetch(audioElement.src);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error("Audio extraction failed:", e);
      return null;
    }
  }

  /**
   * Apply audio masking/filtering
   */
  createEqualizer(): { bass: GainNode; mid: GainNode; treble: GainNode } | null {
    if (!this.audioContext || !this.source) return null;

    const bass = this.audioContext.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 200;
    bass.gain.value = 0;

    const mid = this.audioContext.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 2000;
    mid.gain.value = 0;

    const treble = this.audioContext.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 6000;
    treble.gain.value = 0;

    this.source.connect(bass);
    bass.connect(mid);
    mid.connect(treble);
    treble.connect(this.audioContext.destination);

    return {
      bass: bass as any,
      mid: mid as any,
      treble: treble as any,
    };
  }

  /**
   * Get audio context
   */
  getContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Resume audio context (required after user interaction)
   */
  resume() {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }
}

/**
 * Global audio processor instance
 */
let processorInstance: AudioProcessor | null = null;

export function getAudioProcessor(): AudioProcessor {
  if (!processorInstance) {
    processorInstance = new AudioProcessor();
  }
  return processorInstance;
}

/**
 * Create audio visualization bars
 */
export function getVisualizerBars(
  analytics: AudioAnalytics,
  barCount: number = 30
): number[] {
  if (!analytics.frequency || analytics.frequency.length === 0) {
    return Array(barCount).fill(0);
  }

  const bars: number[] = [];
  const step = Math.floor(analytics.frequency.length / barCount);

  for (let i = 0; i < barCount; i++) {
    const start = i * step;
    const end = start + step;
    const slice = analytics.frequency.slice(start, end);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length / 255;
    bars.push(Math.max(0, Math.min(1, avg)));
  }

  return bars;
}

/**
 * Detect music genre/mood from audio characteristics
 */
export function detectAudioMood(analytics: AudioAnalytics): string {
  const { bass, mid, treble } = analytics;

  if (bass > 0.7) return "Heavy/Bass-heavy";
  if (treble > 0.7) return "Bright/Energetic";
  if (mid > 0.7) return "Warm/Vocal-focused";
  if (bass < 0.3 && treble < 0.3) return "Calm/Ambient";
  return "Balanced";
}
