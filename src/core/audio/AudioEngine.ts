// Main audio engine that handles all audio processing

import { PitchDetector } from './PitchDetector';
import { AutoTune, type AutoTuneSettings } from './AutoTune';
import { PitchGuide } from './PitchGuide';

interface AudioEngineConfig {
  sampleRate: number;
  bufferSize: number;
  inputDevice?: string;
  outputDevice?: string;
}

export class AudioEngine {
  private audioContext: AudioContext;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode;
  private gainNode: GainNode;
  private pitchDetector: PitchDetector;
  private autoTune: AutoTune;
  private pitchGuide: PitchGuide;

  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Monitoring
  private monitorGain: GainNode;
  private instrumentalGain: GainNode;
  private guideGain: GainNode;

  constructor(config: AudioEngineConfig) {
    this.audioContext = new AudioContext({
      sampleRate: config.sampleRate || 44100,
      latencyHint: 'interactive' // Low latency for monitoring
    });

    // Create audio nodes
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 4096; // Higher for better pitch detection
    this.analyserNode.smoothingTimeConstant = 0.3;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    // Monitoring gains
    this.monitorGain = this.audioContext.createGain();
    this.monitorGain.gain.value = 0.8; // Slightly lower than unity

    this.instrumentalGain = this.audioContext.createGain();
    this.instrumentalGain.gain.value = 0.8;

    this.guideGain = this.audioContext.createGain();
    this.guideGain.gain.value = 0.4; // Subtle guide tone

    // Initialize processing modules
    this.pitchDetector = new PitchDetector(this.audioContext);
    this.autoTune = new AutoTune(this.audioContext);
    this.pitchGuide = new PitchGuide(this.audioContext);
  }

  /**
   * Initialize audio input (microphone)
   */
  async initializeInput(deviceId?: string): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false, // We want raw vocal
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.audioContext.sampleRate
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Connect for analysis only (not to output yet)
      this.sourceNode.connect(this.analyserNode);

      console.log('Audio input initialized');
    } catch (error) {
      console.error('Failed to initialize audio input:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  /**
   * Start monitoring (hear yourself with optional processing)
   */
  startMonitoring(withAutoTune: boolean = false): void {
    if (!this.sourceNode) {
      throw new Error('Audio input not initialized');
    }

    // Disconnect previous routing
    this.sourceNode.disconnect();

    if (withAutoTune) {
      // Route through auto-tune
      this.sourceNode
        .connect(this.analyserNode)
        .connect(this.autoTune.getInputNode())
        .connect(this.monitorGain)
        .connect(this.audioContext.destination);
    } else {
      // Direct monitoring (lowest latency)
      this.sourceNode
        .connect(this.analyserNode)
        .connect(this.monitorGain)
        .connect(this.audioContext.destination);
    }

    console.log('Monitoring started', withAutoTune ? 'with auto-tune' : 'direct');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      // Reconnect to analyser only
      this.sourceNode.connect(this.analyserNode);
    }
  }

  /**
   * Start recording vocals
   */
  async startRecording(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('Audio input not initialized');
    }

    this.recordedChunks = [];

    // Create MediaRecorder with high quality settings
    const options: MediaRecorderOptions = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    };

    this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms

    console.log('Recording started');
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current pitch from microphone input
   */
  getCurrentPitch(): number | null {
    const buffer = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(buffer);
    return this.pitchDetector.detectPitch(buffer, this.audioContext.sampleRate);
  }

  /**
   * Start pitch guide tone
   */
  startPitchGuide(targetFrequency: number): void {
    this.pitchGuide.setTargetPitch(targetFrequency);
    this.pitchGuide.start();
    this.pitchGuide.connect(this.guideGain);
    this.guideGain.connect(this.audioContext.destination);
  }

  /**
   * Stop pitch guide tone
   */
  stopPitchGuide(): void {
    this.pitchGuide.stop();
  }

  /**
   * Update pitch guide to new frequency
   */
  updatePitchGuide(targetFrequency: number): void {
    this.pitchGuide.setTargetPitch(targetFrequency);
  }

  /**
   * Configure auto-tune settings
   */
  configureAutoTune(settings: {
    strength?: number;
    speed?: number;
    scale?: string;
    key?: string;
  }): void {
    this.autoTune.configure(settings);
  }

  /**
   * Process recorded audio with auto-tune
   */
  async processRecording(
    audioBlob: Blob,
    settings: AutoTuneSettings
  ): Promise<AudioBuffer> {
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Process with auto-tune
    return this.autoTune.processBuffer(audioBuffer, settings);
  }

  /**
   * Play audio buffer
   */
  playBuffer(buffer: AudioBuffer, onEnded?: () => void): AudioBufferSourceNode {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    if (onEnded) {
      source.onended = onEnded;
    }

    source.start();
    return source;
  }

  /**
   * Load and play instrumental track
   */
  async loadInstrumental(url: string): Promise<AudioBufferSourceNode> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.instrumentalGain);
    this.instrumentalGain.connect(this.audioContext.destination);

    return source;
  }

  /**
   * Set monitoring volume
   */
  setMonitorVolume(volume: number): void {
    this.monitorGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set instrumental volume
   */
  setInstrumentalVolume(volume: number): void {
    this.instrumentalGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set pitch guide volume
   */
  setGuideVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get analyser for visualization
   */
  getAnalyser(): AnalyserNode {
    return this.analyserNode;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopMonitoring();
    this.stopPitchGuide();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
