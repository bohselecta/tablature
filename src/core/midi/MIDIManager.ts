// src/core/midi/MIDIManager.ts - Web MIDI API implementation

// Use browser's built-in Web MIDI API types

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer?: string;
  type: 'input' | 'output';
}

export class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private output: MIDIOutput | null = null;
  private input: MIDIInput | null = null;
  private connectedDeviceId: string | null = null;
  private messageCallbacks: ((deltaTime: number, message: number[]) => void)[] = [];

  // Browser compatibility check
  get isSupported(): boolean {
    return 'requestMIDIAccess' in navigator;
  }

  constructor() {
    // Web MIDI API doesn't need initialization in constructor
  }
  
  /**
   * List all available MIDI output devices
   */
  listAvailableDevices(): MIDIDevice[] {
    if (!this.isSupported) {
      return [];
    }

    const devices: MIDIDevice[] = [];

    if (this.midiAccess) {
      // List outputs
      for (const output of this.midiAccess.outputs.values()) {
        devices.push({
          id: output.id || `output-${output.name}`,
          name: output.name || 'Unknown Device',
          manufacturer: output.manufacturer || undefined,
          type: 'output'
        });
      }

      // List inputs (for future MIDI input support)
      for (const input of this.midiAccess.inputs.values()) {
        devices.push({
          id: input.id || `input-${input.name}`,
          name: input.name || 'Unknown Device',
          manufacturer: input.manufacturer || undefined,
          type: 'input'
        });
      }
    }

    return devices;
  }
  
  /**
   * Request MIDI access and prepare for device connection
   * Must be called before any device operations
   */
  async requestAccess(): Promise<boolean> {
    if (!this.isSupported) {
      console.error('Web MIDI API not supported in this browser');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('MIDI access granted');
      return true;
    } catch (error) {
      console.error('MIDI access denied:', error);
      return false;
    }
  }

  /**
   * Connect to device by name (fuzzy matching)
   * @param deviceName - Full or partial device name
   * @returns true if connected successfully
   */
  async connect(deviceName: string): Promise<boolean> {
    try {
      // Ensure we have MIDI access
      if (!this.midiAccess) {
        const accessGranted = await this.requestAccess();
        if (!accessGranted) {
          return false;
        }
      }

      // Close existing connections
      this.disconnect();

      // Find matching output device
      if (this.midiAccess) {
        for (const output of this.midiAccess.outputs.values()) {
          if (output.name && output.name.toLowerCase().includes(deviceName.toLowerCase())) {
            this.output = output;
            this.connectedDeviceId = output.id || output.name || 'unknown';
            console.log(`Connected to MIDI device: ${output.name}`);
            return true;
          }
        }
      }

      console.error(`Device "${deviceName}" not found`);
      console.log('Available devices:', this.listAvailableDevices());
      return false;

    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }
  
  /**
   * Connect to device by ID
   */
  async connectById(deviceId: string): Promise<boolean> {
    try {
      // Ensure we have MIDI access
      if (!this.midiAccess) {
        const accessGranted = await this.requestAccess();
        if (!accessGranted) {
          return false;
        }
      }

      // Close existing connections
      this.disconnect();

      // Find device by ID
      if (this.midiAccess) {
        const output = this.midiAccess.outputs.get(deviceId);
        if (output) {
          this.output = output;
          this.connectedDeviceId = deviceId;
          console.log(`Connected to MIDI device: ${output.name}`);
          return true;
        }
      }

      console.error(`Device with ID "${deviceId}" not found`);
      return false;

    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }

  /**
   * Disconnect from current device
   */
  disconnect(): void {
    this.output = null;
    this.input = null;
    this.connectedDeviceId = null;
  }

  /**
   * Check if connected to a device
   */
  isConnected(): boolean {
    return this.output !== null && this.connectedDeviceId !== null;
  }

  /**
   * Get the name of the connected device
   */
  getConnectedDeviceName(): string {
    if (!this.isConnected() || !this.output) {
      return 'Not connected';
    }
    return this.output.name || 'Unknown Device';
  }
  
  /**
   * Send a MIDI note
   * @param channel - MIDI channel (1-16)
   * @param note - MIDI note number (0-127)
   * @param velocity - Velocity (0-127)
   * @param duration - Duration in milliseconds (optional)
   */
  async sendNote(channel: number, note: number, velocity: number, duration?: number): Promise<void> {
    if (!this.isConnected() || !this.output) {
      throw new Error('Not connected to MIDI device');
    }

    // Validate inputs
    const ch = Math.max(1, Math.min(16, channel)) - 1; // Convert to 0-15
    const n = Math.max(0, Math.min(127, note));
    const v = Math.max(0, Math.min(127, velocity));

    // Note On
    this.output.send([0x90 | ch, n, v]);

    // If duration specified, send Note Off after delay
    if (duration !== undefined && duration > 0) {
      await this.delay(duration);
      this.output.send([0x80 | ch, n, 0]);
    }
  }

  /**
   * Send Note Off
   */
  sendNoteOff(channel: number, note: number): void {
    if (!this.isConnected() || !this.output) {
      throw new Error('Not connected to MIDI device');
    }

    const ch = Math.max(1, Math.min(16, channel)) - 1;
    const n = Math.max(0, Math.min(127, note));

    this.output.send([0x80 | ch, n, 0]);
  }

  /**
   * Send Control Change message
   * @param channel - MIDI channel (1-16)
   * @param cc - CC number (0-127)
   * @param value - CC value (0-127)
   */
  async sendCC(channel: number, cc: number, value: number): Promise<void> {
    if (!this.isConnected() || !this.output) {
      throw new Error('Not connected to MIDI device');
    }

    const ch = Math.max(1, Math.min(16, channel)) - 1;
    const c = Math.max(0, Math.min(127, cc));
    const v = Math.max(0, Math.min(127, value));

    this.output.send([0xB0 | ch, c, v]);
  }

  /**
   * Send Program Change message
   * @param channel - MIDI channel (1-16)
   * @param program - Program number (0-127)
   */
  async sendPC(channel: number, program: number): Promise<void> {
    if (!this.isConnected() || !this.output) {
      throw new Error('Not connected to MIDI device');
    }

    const ch = Math.max(1, Math.min(16, channel)) - 1;
    const p = Math.max(0, Math.min(127, program));

    this.output.send([0xC0 | ch, p]);
  }

  /**
   * Send System Exclusive message
   * @param bytes - Array of SysEx bytes (should start with 0xF0 and end with 0xF7)
   */
  async sendSysEx(bytes: number[]): Promise<void> {
    if (!this.isConnected() || !this.output) {
      throw new Error('Not connected to MIDI device');
    }

    // Validate SysEx format
    if (bytes[0] !== 0xF0) {
      console.warn('SysEx message should start with 0xF0');
    }
    if (bytes[bytes.length - 1] !== 0xF7) {
      console.warn('SysEx message should end with 0xF7');
    }

    // Web MIDI API expects Uint8Array
    const uint8Array = new Uint8Array(bytes);
    this.output.send(uint8Array);
  }

  /**
   * Send raw MIDI message
   */
  async sendRaw(bytes: number[]): Promise<void> {
    if (!this.isConnected() || !this.output) {
      throw new Error('Not connected to MIDI device');
    }

    const uint8Array = new Uint8Array(bytes);
    this.output.send(uint8Array);
  }
  
  /**
   * Register callback for incoming MIDI messages (future use)
   */
  onMessage(callback: (deltaTime: number, message: number[]) => void): void {
    this.messageCallbacks.push(callback);

    // Setup MIDI input callback if not already done
    this.setupInputCallback();
  }

  /**
   * Remove message callback
   */
  removeMessageCallback(callback: (deltaTime: number, message: number[]) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  /**
   * Setup input callback handling for MIDI input (future feature)
   */
  private setupInputCallback(): void {
    if (!this.midiAccess || !this.input) return;

    // Web MIDI API input handling
    this.input.onmidimessage = (event: MIDIMessageEvent) => {
      const deltaTime = 0; // Web MIDI doesn't provide delta time like node-midi
      const message = event.data ? Array.from(event.data) : [];

      // Call all registered callbacks
      this.messageCallbacks.forEach(callback => {
        try {
          callback(deltaTime, message);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    };
  }

  /**
   * Utility: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection by sending a test note
   */
  async testConnection(channel: number = 1): Promise<boolean> {
    try {
      // Send middle C for 100ms
      await this.sendNote(channel, 60, 80, 100);
      return true;
    } catch (error) {
      console.error('Test connection failed:', error);
      return false;
    }
  }

  /**
   * Get browser compatibility information
   */
  getCompatibilityInfo(): {
    webMidiSupported: boolean;
    recommendedBrowser?: string;
    limitations?: string[];
  } {
    const info = {
      webMidiSupported: this.isSupported,
      recommendedBrowser: 'Chrome or Edge',
      limitations: [] as string[]
    };

    if (!this.isSupported) {
      info.limitations.push('Web MIDI API not supported');
      info.limitations.push('MIDI features require Chrome, Edge, or Opera');
    } else {
      info.limitations.push('MIDI access requires user permission');
      info.limitations.push('May have higher latency than native apps');
      info.limitations.push('Limited SysEx support in some browsers');
    }

    return info;
  }
}
