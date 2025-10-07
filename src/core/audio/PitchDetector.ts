// Pitch detection using autocorrelation (YIN algorithm)

export class PitchDetector {
  private threshold: number = 0.1;

  constructor(_audioContext: AudioContext) {
    // AudioContext not currently used but kept for future extensions
  }

  /**
   * Detect pitch using autocorrelation
   * Returns frequency in Hz, or null if no pitch detected
   */
  detectPitch(buffer: Float32Array, sampleRate: number): number | null {
    // Step 1: Calculate difference function
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    const yinBuffer = new Float32Array(MAX_SAMPLES);

    // Difference function
    for (let tau = 0; tau < MAX_SAMPLES; tau++) {
      let sum = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    // Step 2: Cumulative mean normalized difference
    yinBuffer[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < MAX_SAMPLES; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / runningSum;
    }

    // Step 3: Absolute threshold
    const tauMin = Math.floor(sampleRate / 1000); // Min ~1000 Hz
    const tauMax = Math.floor(sampleRate / 50);   // Max ~50 Hz

    let tau = tauMin;
    while (tau < tauMax) {
      if (yinBuffer[tau] < this.threshold) {
        // Found a minimum below threshold
        while (tau + 1 < tauMax && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }

        // Parabolic interpolation for better precision
        const betterTau = this.parabolicInterpolation(yinBuffer, tau);
        const frequency = sampleRate / betterTau;

        // Sanity check
        if (frequency > 50 && frequency < 1000) {
          return frequency;
        }
      }
      tau++;
    }

    return null; // No pitch detected
  }

  /**
   * Parabolic interpolation for sub-sample precision
   */
  private parabolicInterpolation(buffer: Float32Array, tau: number): number {
    const x0 = tau < 1 ? tau : tau - 1;
    const x2 = tau + 1 < buffer.length ? tau + 1 : tau;

    if (x0 === tau) return tau;
    if (x2 === tau) return tau;

    const s0 = buffer[x0];
    const s1 = buffer[tau];
    const s2 = buffer[x2];

    return tau + 0.5 * (s2 - s0) / (2 * s1 - s2 - s0);
  }

  /**
   * Convert frequency to MIDI note number
   */
  frequencyToMidi(frequency: number): number {
    return 69 + 12 * Math.log2(frequency / 440);
  }

  /**
   * Convert MIDI note to frequency
   */
  midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Get note name from frequency
   */
  frequencyToNoteName(frequency: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midi = Math.round(this.frequencyToMidi(frequency));
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}${octave}`;
  }
}
