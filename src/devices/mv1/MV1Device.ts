// MV-1 Device implementation
import type { DeviceInterface, Sound, Pattern } from "../DeviceInterface";
import { MIDIManager, type MIDIDevice } from "../../core/midi/MIDIManager";
import mv1Sounds from "../../data/mv1-sounds.json";

export class MV1Device implements DeviceInterface {
  private midi: MIDIManager;
  private connected: boolean = false;

  // MV-1 specific constants
  private readonly TRACK_CHANNELS = {
    KICK: 1,
    SNARE: 2,
    HIHAT: 3,
    KIT: 4,
    BASS: 5,
    INST1: 6,
    INST2: 7,
  };

  constructor() {
    this.midi = new MIDIManager();
  }

  async connect(deviceName: string): Promise<boolean> {
    // Use the MIDIManager to connect to the specified device
    const success = await this.midi.connect(deviceName);
    this.connected = success;

    if (success) {
      console.log(
        `MV1Device connected to: ${this.midi.getConnectedDeviceName()}`,
      );
    }

    return success;
  }

  /**
   * Connect to device by ID (used by UI)
   */
  async connectById(deviceId: string): Promise<boolean> {
    const success = await this.midi.connectById(deviceId);
    this.connected = success;

    if (success) {
      console.log(
        `MV1Device connected to: ${this.midi.getConnectedDeviceName()}`,
      );
    }

    return success;
  }

  /**
   * Get available MIDI devices (used by UI)
   */
  getAvailableDevices(): MIDIDevice[] {
    return this.midi.listAvailableDevices();
  }

  /**
   * Test the connection by sending a test note
   */
  async testConnection(channel: number = 1): Promise<boolean> {
    return await this.midi.testConnection(channel);
  }

  disconnect(): void {
    this.midi.disconnect();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.midi.isConnected();
  }

  getDeviceName(): string {
    return "Roland Verselab MV-1";
  }

  getTrackCount(): number {
    return 7; // KICK, SNARE, HIHAT, KIT, BASS, INST1, INST2
  }

  getMaxClipsPerTrack(): number {
    return 16; // Sixteen sections/clip positions
  }

  async selectSound(_trackId: number, _soundId: string): Promise<void> {
    throw new Error(
      `Automatic MV-1 patch selection is not verified (track ${_trackId}, sound ${_soundId}). Select the sound on the hardware; the recovered catalogue is a search reference, not a proven bank/program map.`,
    );
  }

  getSoundList(): Sound[] {
    return mv1Sounds.sounds.map((sound) => ({
      id: sound.id,
      name: sound.name,
      category: sound.category,
      bank: sound.bank,
      program: sound.program,
    }));
  }

  async sendPattern(
    _trackId: number,
    _clipId: number,
    _pattern: Pattern,
  ): Promise<void> {
    throw new Error(
      `Direct MV-1 clip writing is not implemented (track ${_trackId}, clip ${_clipId}, ${_pattern.steps} steps). Use Live Canvas to play real notes, or export MIDI for manual clip import. No placeholder pattern was sent.`,
    );
  }

  async clearClip(_trackId: number, _clipId: number): Promise<void> {
    throw new Error(
      `Hardware clip clearing is not verified (track ${_trackId}, clip ${_clipId}); no command sent.`,
    );
  }

  async setTrackVolume(trackId: number, volume: number): Promise<void> {
    if (!Number.isFinite(volume) || volume < 0 || volume > 100)
      throw new Error("Volume must be 0–100.");
    await this.midi.sendCC(
      this.getChannelForTrack(trackId),
      7,
      Math.round(volume * 1.27),
    );
  }

  async setTrackPan(trackId: number, pan: number): Promise<void> {
    if (!Number.isFinite(pan) || pan < 0 || pan > 127)
      throw new Error("Pan must be 0–127.");
    await this.midi.sendCC(
      this.getChannelForTrack(trackId),
      10,
      Math.round(pan),
    );
  }

  async setTrackMute(_trackId: number, _muted: boolean): Promise<void> {
    throw new Error(
      `MV-1 internal track ${_trackId} ${_muted ? "mute" : "unmute"} requires an unverified SysEx path. Live Canvas mutes its outgoing note lanes without changing device memory.`,
    );
  }

  async activateSection(_sectionId: number): Promise<void> {
    throw new Error(
      `Hardware section ${_sectionId} activation is mode-dependent and not verified; no command sent.`,
    );
  }

  async setEffect(
    _trackId: number,
    _effectType: string,
    _params?: Record<string, unknown>,
  ): Promise<void> {
    throw new Error(
      `MV-1 MFX writes require hardware verification (track ${_trackId}, effect ${_effectType}, ${Object.keys(_params ?? {}).length} parameters); no command sent.`,
    );
  }

  private getChannelForTrack(trackId: number): number {
    const trackMap = [
      this.TRACK_CHANNELS.KICK,
      this.TRACK_CHANNELS.SNARE,
      this.TRACK_CHANNELS.HIHAT,
      this.TRACK_CHANNELS.KIT,
      this.TRACK_CHANNELS.BASS,
      this.TRACK_CHANNELS.INST1,
      this.TRACK_CHANNELS.INST2,
    ];

    if (!Number.isInteger(trackId) || trackId < 0 || trackId >= trackMap.length)
      throw new Error("Track index must be 0–6.");
    return trackMap[trackId];
  }
}
