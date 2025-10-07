// SysEx message builder for generic MIDI devices
export class SysExBuilder {
  // Build generic SysEx messages
  buildSysEx(manufacturerId: number[], deviceId: number[], data: number[]): number[] {
    return [
      0xF0, // SysEx start
      ...manufacturerId,
      ...deviceId,
      ...data,
      0xF7  // SysEx end
    ];
  }
  
  // Calculate checksum for SysEx messages
  calculateChecksum(data: number[]): number {
    let sum = 0;
    for (const byte of data) {
      sum += byte;
    }
    return (128 - (sum % 128)) % 128;
  }
}
