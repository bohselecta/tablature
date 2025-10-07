// Global type definitions for the application
import { StorageManager } from '../core/database/Database';

// Export storage manager for use throughout the app
export { StorageManager };

export interface SoundData {
  id: string;
  name: string;
  category: string;
  bank: number;
  program: number;
}

export interface SoundDatabase {
  sounds: SoundData[];
}

export interface GenreTemplate {
  genreName: string;
  tempo: {
    min: number;
    max: number;
    default: number;
  };
  timeSignature: string;
  soundPalette: Record<string, string[]>;
  patterns: Record<string, Record<string, PatternDefinition>>;
  songStructure: Record<string, SectionDefinition>;
}

export interface PatternDefinition {
  steps: number;
  pattern: number[];
  velocity: number[];
  triplet?: boolean;
}

export interface SectionDefinition {
  length: number;
  tracks: string[];
  patterns: Record<string, string>;
}

export interface GeneratedSong {
  tempo: number;
  tracks: Track[];
  sections: Section[];
  arrangement: number[];
}

export interface Track {
  id: number;
  name: string;
  soundId: string;
  clips: Clip[];
}

export interface Clip {
  id: number;
  pattern: Pattern;
  effect?: string;
}

export interface Section {
  id: number;
  name: string;
  length: number;
  clipAssignments: Record<number, number>;
}

export interface Pattern {
  steps: number;
  notes: (Note | null)[];
  triplet?: boolean;
}

export interface Note {
  pitch: number | string;
  velocity: number;
  duration?: number;
}
