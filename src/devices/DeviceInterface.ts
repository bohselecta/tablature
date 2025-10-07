// Device interface that all devices must implement
export interface DeviceInterface {
  // Connection
  connect(deviceName?: string): Promise<boolean>;
  disconnect(): void;
  isConnected(): boolean;
  
  // Device info
  getDeviceName(): string;
  getTrackCount(): number;
  getMaxClipsPerTrack(): number;
  
  // Sound control
  selectSound(trackId: number, soundId: string): Promise<void>;
  getSoundList(): Sound[];
  
  // Pattern control
  sendPattern(trackId: number, clipId: number, pattern: Pattern): Promise<void>;
  clearClip(trackId: number, clipId: number): Promise<void>;
  
  // Track control
  setTrackVolume(trackId: number, volume: number): Promise<void>;
  setTrackPan(trackId: number, pan: number): Promise<void>;
  setTrackMute(trackId: number, muted: boolean): Promise<void>;
  
  // Section/song control
  activateSection(sectionId: number): Promise<void>;
  
  // Effect control (if supported)
  setEffect(trackId: number, effectType: string, params?: any): Promise<void>;
}

// Define types
export interface Sound {
  id: string;
  name: string;
  category: string;
  bank?: number;
  program?: number;
  deviceSpecific?: any;
}

export interface Pattern {
  steps: number;
  notes: (Note | null)[];
  triplet?: boolean;
}

export interface Note {
  pitch: number | string;  // MIDI note number or chord name
  velocity: number;
  duration?: number;
}
