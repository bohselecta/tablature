// Reference pitch tone generator

export class PitchGuide {
  private audioContext: AudioContext;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode;
  private targetFrequency: number = 440; // A4
  private isPlaying: boolean = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.3; // Subtle
  }

  /**
   * Set target pitch frequency
   */
  setTargetPitch(frequency: number): void {
    this.targetFrequency = frequency;

    if (this.oscillator && this.isPlaying) {
      // Smooth frequency transition
      this.oscillator.frequency.setTargetAtTime(
        frequency,
        this.audioContext.currentTime,
        0.05 // 50ms glide
      );
    }
  }

  /**
   * Start pitch guide tone
   */
  start(): void {
    if (this.isPlaying) return;

    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine'; // Pure tone
    this.oscillator.frequency.value = this.targetFrequency;

    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
    this.isPlaying = true;
  }

  /**
   * Stop pitch guide tone
   */
  stop(): void {
    if (!this.isPlaying || !this.oscillator) return;

    // Fade out smoothly
    this.gainNode.gain.setTargetAtTime(
      0,
      this.audioContext.currentTime,
      0.05
    );

    setTimeout(() => {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      this.gainNode.gain.value = 0.3; // Reset for next time
      this.isPlaying = false;
    }, 100);
  }

  /**
   * Connect to destination
   */
  connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.gainNode.gain.setTargetAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime,
      0.05
    );
  }
}
