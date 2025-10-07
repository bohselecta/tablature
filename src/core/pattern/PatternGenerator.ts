// Pattern generator for creating musical patterns
import type { Pattern, Note } from '../../devices/DeviceInterface';

export class PatternGenerator {
  // Generate a basic kick pattern
  static generateKickPattern(steps: number = 16): Pattern {
    const notes: (Note | null)[] = new Array(steps).fill(null);
    
    // Basic kick on 1, 5, 9, 13 (every 4th step)
    notes[0] = { pitch: 36, velocity: 100 }; // C1
    notes[4] = { pitch: 36, velocity: 95 };
    notes[8] = { pitch: 36, velocity: 100 };
    notes[12] = { pitch: 36, velocity: 95 };
    
    return {
      steps,
      notes
    };
  }
  
  // Generate a basic snare pattern
  static generateSnarePattern(steps: number = 16): Pattern {
    const notes: (Note | null)[] = new Array(steps).fill(null);
    
    // Basic snare on 4, 12 (backbeat)
    notes[4] = { pitch: 38, velocity: 100 }; // D1
    notes[12] = { pitch: 38, velocity: 100 };
    
    return {
      steps,
      notes
    };
  }
  
  // Generate a basic hihat pattern
  static generateHihatPattern(steps: number = 16): Pattern {
    const notes: (Note | null)[] = new Array(steps).fill(null);
    
    // Hihat on every step
    for (let i = 0; i < steps; i++) {
      notes[i] = { pitch: 42, velocity: 70 }; // F#1
    }
    
    return {
      steps,
      notes
    };
  }
  
  // Generate a random pattern
  static generateRandomPattern(steps: number = 16, density: number = 0.3): Pattern {
    const notes: (Note | null)[] = new Array(steps).fill(null);
    
    for (let i = 0; i < steps; i++) {
      if (Math.random() < density) {
        notes[i] = {
          pitch: 36 + Math.floor(Math.random() * 12), // Random note in octave
          velocity: 60 + Math.floor(Math.random() * 40) // Random velocity
        };
      }
    }
    
    return {
      steps,
      notes
    };
  }
}
