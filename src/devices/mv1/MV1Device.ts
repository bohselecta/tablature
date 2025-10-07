// MV-1 Device implementation
import type { DeviceInterface, Sound, Pattern } from '../DeviceInterface';
import { MIDIManager, type MIDIDevice } from '../../core/midi/MIDIManager';
import { MV1SysEx } from './MV1SysEx';
import mv1Sounds from '../../data/mv1-sounds.json';

export class MV1Device implements DeviceInterface {
  private midi: MIDIManager;
  private sysex: MV1SysEx;
  private connected: boolean = false;
  
  // MV-1 specific constants
  private readonly TRACK_CHANNELS = {
    KICK: 1,
    SNARE: 2,
    HIHAT: 3,
    KIT: 4,
    BASS: 5,
    INST1: 6,
    INST2: 7
  };
  
  constructor() {
    this.midi = new MIDIManager();
    this.sysex = new MV1SysEx();
  }
  
  async connect(deviceName: string): Promise<boolean> {
    // Use the MIDIManager to connect to the specified device
    const success = await this.midi.connect(deviceName);
    this.connected = success;

    if (success) {
      console.log(`MV1Device connected to: ${this.midi.getConnectedDeviceName()}`);

      // Test the connection by sending a test note
      try {
        await this.midi.testConnection(1);
        console.log('MIDI connection test successful');
      } catch (error) {
        console.warn('MIDI connection test failed:', error);
      }
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
      console.log(`MV1Device connected to: ${this.midi.getConnectedDeviceName()}`);

      // Test the connection by sending a test note
      try {
        await this.midi.testConnection(1);
        console.log('MIDI connection test successful');
      } catch (error) {
        console.warn('MIDI connection test failed:', error);
      }
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
    return 'Roland Verselab MV-1';
  }
  
  getTrackCount(): number {
    return 7; // KICK, SNARE, HIHAT, KIT, BASS, INST1, INST2
  }
  
  getMaxClipsPerTrack(): number {
    return 8; // MV-1 has 8 clips per track
  }
  
  async selectSound(trackId: number, soundId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MIDI device');
    }
    
    const sound = mv1Sounds.sounds.find(s => s.id === soundId);
    if (!sound) {
      throw new Error(`Sound ${soundId} not found`);
    }
    
    const channel = this.getChannelForTrack(trackId);
    
    console.log(`Selecting sound: ${sound.name} (Bank: ${sound.bank}, Program: ${sound.program}) on channel ${channel}`);
    
    try {
      // Send bank select if needed
      if (sound.bank !== undefined && sound.bank > 0) {
        // For MV-1, bank select is typically CC #0 (MSB) and CC #32 (LSB)
        // Bank 0 = MSB=0, LSB=0
        // Bank 1 = MSB=0, LSB=1
        // etc.
        const msb = Math.floor(sound.bank / 128);
        const lsb = sound.bank % 128;
        
        if (msb > 0) {
          await this.midi.sendCC(channel, 0, msb);
          await this.delay(10); // Small delay between messages
        }
        
        if (lsb > 0) {
          await this.midi.sendCC(channel, 32, lsb);
          await this.delay(10);
        }
      }
      
      // Send program change (convert from 1-based to 0-based)
      const program = Math.max(0, sound.program - 1);
      await this.midi.sendPC(channel, program);
      
      console.log(`Sound selection complete: ${sound.name}`);
      
    } catch (error) {
      console.error('Error selecting sound:', error);
      throw error;
    }
  }
  
  getSoundList(): Sound[] {
    return mv1Sounds.sounds.map(sound => ({
      id: sound.id,
      name: sound.name,
      category: sound.category,
      bank: sound.bank,
      program: sound.program
    }));
  }
  
  async sendPattern(trackId: number, clipId: number, pattern: Pattern): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MIDI device');
    }
    
    const channel = this.getChannelForTrack(trackId);
    console.log(`Sending pattern to track ${trackId} (channel ${channel}), clip ${clipId}`);
    
    // For now, just send a simple test pattern
    // This will be expanded to send actual pattern data
    try {
      // Send a simple kick pattern (note 36 = C1)
      for (let step = 0; step < pattern.steps; step += 4) {
        await this.midi.sendNote(channel, 36, 100, 50);
        await this.delay(100); // Quarter note timing at 120 BPM
      }
    } catch (error) {
      console.error('Error sending pattern:', error);
      throw error;
    }
  }
  
  async clearClip(trackId: number, clipId: number): Promise<void> {
    console.log(`Clearing track ${trackId}, clip ${clipId}`);
    // Implementation for clearing clips
  }
  
  async setTrackVolume(trackId: number, volume: number): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MIDI device');
    }
    
    const sysexMessage = this.sysex.setTrackVolume(trackId, volume);
    await this.midi.sendSysEx(sysexMessage);
  }
  
  async setTrackPan(trackId: number, pan: number): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MIDI device');
    }
    
    const sysexMessage = this.sysex.setTrackPan(trackId, pan);
    await this.midi.sendSysEx(sysexMessage);
  }
  
  async setTrackMute(trackId: number, muted: boolean): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MIDI device');
    }
    
    const sysexMessage = this.sysex.muteTrack(trackId, muted);
    await this.midi.sendSysEx(sysexMessage);
  }
  
  async activateSection(sectionId: number): Promise<void> {
    console.log(`Activating section ${sectionId}`);
    // Implementation for section activation
  }
  
  async setEffect(trackId: number, effectType: string, _params?: any): Promise<void> {
    console.log(`Setting effect ${effectType} on track ${trackId}`);
    // Implementation for effect control
  }
  
  private getChannelForTrack(trackId: number): number {
    const trackMap = [
      this.TRACK_CHANNELS.KICK,
      this.TRACK_CHANNELS.SNARE,
      this.TRACK_CHANNELS.HIHAT,
      this.TRACK_CHANNELS.KIT,
      this.TRACK_CHANNELS.BASS,
      this.TRACK_CHANNELS.INST1,
      this.TRACK_CHANNELS.INST2
    ];
    
    return trackMap[trackId] || 1;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
