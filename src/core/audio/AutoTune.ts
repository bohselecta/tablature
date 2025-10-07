// Pitch correction (auto-tune) using phase vocoder

interface AutoTuneSettings {
  strength: number;      // 0-1, how much correction
  speed: number;         // in ms, retune speed
  scale: string;         // 'chromatic', 'major', 'minor', etc.
  key: string;           // 'C', 'D', 'E', etc.
  formantPreserve: number; // 0-1, preserve voice character
}

export class AutoTune {
  private audioContext: AudioContext;
  private settings: AutoTuneSettings = {
    strength: 0.5,
    speed: 40,
    scale: 'chromatic',
    key: 'C',
    formantPreserve: 0.7
  };

  private workletNode: AudioWorkletNode | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Initialize auto-tune worklet processor
   */
  async initialize(): Promise<void> {
    try {
      await this.audioContext.audioWorklet.addModule('/audio-worklets/auto-tune-processor.js');
      this.workletNode = new AudioWorkletNode(this.audioContext, 'auto-tune-processor');
      console.log('Auto-tune worklet initialized');
    } catch (error) {
      console.error('Failed to initialize auto-tune worklet:', error);
      throw error;
    }
  }

  /**
   * Configure auto-tune settings
   */
  configure(settings: Partial<AutoTuneSettings>): void {
    this.settings = { ...this.settings, ...settings };

    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'configure',
        settings: this.settings
      });
    }
  }

  /**
   * Get input node for audio routing
   */
  getInputNode(): AudioNode {
    if (!this.workletNode) {
      throw new Error('Auto-tune not initialized');
    }
    return this.workletNode;
  }

  /**
   * Connect to destination
   */
  connect(destination: AudioNode): void {
    if (this.workletNode) {
      this.workletNode.connect(destination);
    }
  }

  /**
   * Process an audio buffer offline (for recorded audio)
   */
  async processBuffer(
    buffer: AudioBuffer,
    settings: AutoTuneSettings
  ): Promise<AudioBuffer> {
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Load worklet in offline context
    await offlineContext.audioWorklet.addModule('/audio-worklets/auto-tune-processor.js');
    const processor = new AudioWorkletNode(offlineContext, 'auto-tune-processor');

    // Configure
    processor.port.postMessage({
      type: 'configure',
      settings: settings
    });

    // Connect and render
    source.connect(processor);
    processor.connect(offlineContext.destination);
    source.start();

    return await offlineContext.startRendering();
  }

}

export type { AutoTuneSettings };
