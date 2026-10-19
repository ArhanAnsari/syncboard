"use client";

const MUTE_KEY = "syncboard:sound-muted";

type OscillatorType = OscillatorNode["type"];

class SoundManager {
  private context: AudioContext | null = null;
  private muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = window.localStorage.getItem(MUTE_KEY) === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.context) return this.context;
    const AudioContextConstructor = window.AudioContext ?? (
      window as typeof window & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;
    if (!AudioContextConstructor) return null;
    this.context = new AudioContextConstructor();
    return this.context;
  }

  private scheduleTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    startOffset = 0,
    volume = 0.045,
  ) {
    if (this.muted) return;
    try {
      const context = this.getContext();
      if (!context) return;
      if (context.state === "suspended") void context.resume().catch(() => undefined);
      const start = context.currentTime + startOffset;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch {
      // Browser autoplay and unavailable audio devices should never interrupt UX.
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTE_KEY, String(this.muted));
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playClaim() {
    this.scheduleTone(480, 0.08, "sine", 0, 0.05);
  }

  playComplete() {
    this.scheduleTone(523, 0.18, "triangle", 0, 0.04);
    this.scheduleTone(659, 0.22, "triangle", 0.16, 0.04);
  }

  playSOS() {
    this.scheduleTone(880, 0.12, "sawtooth", 0, 0.055);
    this.scheduleTone(880, 0.12, "sawtooth", 0.2, 0.055);
  }

  playClick() {
    this.scheduleTone(600, 0.03, "sine", 0, 0.018);
  }

  stop() {
    try {
      if (this.context) {
        void this.context.close().catch(() => undefined);
        this.context = null;
      }
    } catch {
      // Audio cleanup must never interrupt session termination.
    }
  }
}

export const soundManager = new SoundManager();

// Compatibility exports for existing consumers.
export const isSoundMuted = () => soundManager.isMuted();
export const setSoundMuted = (value: boolean) => {
  if (soundManager.isMuted() !== value) soundManager.toggleMute();
};
export const playClaimSound = () => soundManager.playClaim();
export const playCompleteSound = () => soundManager.playComplete();
export const playSOSSound = () => soundManager.playSOS();
