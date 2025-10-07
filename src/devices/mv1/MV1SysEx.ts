// MV-1 SysEx message builders
export class MV1SysEx {
  // MV-1 SysEx header: F0 41 10 00 00 00 6F 12
  private readonly HEADER = [0xF0, 0x41, 0x10, 0x00, 0x00, 0x00, 0x6F, 0x12];
  private readonly FOOTER = [0xF7];
  
  // Build SysEx messages for various parameters
  
  muteTrack(trackId: number, muted: boolean): number[] {
    // Formula: 10 00 tr 0D mu cs F7
    // tr = 07 + trackId (hex)
    const tr = 0x07 + trackId;
    const mu = muted ? 0x00 : 0x01;
    
    return [
      ...this.HEADER,
      0x10, 0x00, tr, 0x0D, mu,
      0x00, // checksum placeholder
      ...this.FOOTER
    ];
  }
  
  setTrackVolume(trackId: number, volume: number): number[] {
    // Formula: 10 00 tr 31 v1 cs F7
    const tr = 0x07 + trackId;
    const v1 = Math.floor(volume * 127 / 100); // Convert 0-100 to 0-127
    
    return [
      ...this.HEADER,
      0x10, 0x00, tr, 0x31, v1,
      0x00, // checksum
      ...this.FOOTER
    ];
  }
  
  setTrackPan(trackId: number, pan: number): number[] {
    // Formula: 10 00 tr 32 v1 v2 cs F7
    // Convert pan (0-127, 64=center) to split bytes
    const tr = 0x07 + trackId;
    const v1 = pan >> 4;      // Upper nibble
    const v2 = pan & 0x0F;    // Lower nibble
    
    return [
      ...this.HEADER,
      0x10, 0x00, tr, 0x32, v1, v2,
      0x00, // checksum
      ...this.FOOTER
    ];
  }
  
  setEffect(effectType: number): number[] {
    // Formula: 10 00 18 00 [effect_type] cs F7
    return [
      ...this.HEADER,
      0x10, 0x00, 0x18, 0x00, effectType,
      0x00, // checksum
      ...this.FOOTER
    ];
  }
  
  // Add more SysEx builders as needed
}
