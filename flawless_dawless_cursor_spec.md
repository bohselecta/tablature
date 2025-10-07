# FLAWLESS DAWLESS - BUILD SPECIFICATION FOR CURSOR

## PROJECT OVERVIEW

**Goal:** Build a desktop application that provides intelligent, genre-based control of hardware grooveboxes via MIDI/SysEx, starting with the Roland Verselab MV-1.

**Architecture:** Modular, device-agnostic core with device-specific plugins for MV-1, Electribe, etc.

**Tech Stack:**
- Electron (desktop app framework)
- React + TypeScript (UI)
- Tailwind CSS (styling)
- node-midi (MIDI communication)
- SQLite (local database for sounds/patterns)

---

## PHASE 1 INSTRUCTIONS FOR CURSOR

### STEP 1: Parse the Sound List PDF

**File Location:** `root/[sound_list_filename.pdf]`

**Task:**
1. Extract all sound names, categories, and bank/program numbers from the PDF
2. Create a JSON database structure: `src/data/mv1-sounds.json`

**Expected JSON Structure:**
```json
{
  "sounds": [
    {
      "id": 1,
      "name": "808 Kick Deep",
      "category": "Drum Kits",
      "subcategory": "Kicks",
      "bank": 0,
      "program": 1,
      "type": "tone",
      "genreTags": ["trap", "hip-hop", "electronic"],
      "description": ""
    }
  ],
  "drumKits": [
    {
      "id": 1,
      "name": "TR-808 Kit",
      "bank": 0,
      "program": 1,
      "sounds": {
        "kick": "808 Kick",
        "snare": "808 Snare",
        "hihat": "808 HH Closed"
      }
    }
  ]
}
```

**Cursor Instructions:**
```
@sound_list.pdf Parse this PDF and extract:
1. All sound/patch names
2. Bank and program numbers (MSB/LSB/PC if applicable)
3. Categories and subcategories
4. Any genre or style indicators mentioned

Create a JSON file at src/data/mv1-sounds.json with the structure shown above.
Use a PDF parsing library like pdf-parse or pdfjs-dist.
```

---

### STEP 2: Set Up Project Structure

**Create this folder structure:**

```
flawless-dawless/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts
│   │   └── preload.ts
│   ├── renderer/                # React UI
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── GenreSelector.tsx
│   │   │   ├── TrackView.tsx
│   │   │   ├── SoundBrowser.tsx
│   │   │   └── HardwareMirror.tsx
│   │   └── styles/
│   │       └── index.css
│   ├── core/                    # Core logic (device-agnostic)
│   │   ├── midi/
│   │   │   ├── MIDIManager.ts
│   │   │   ├── CommandQueue.ts
│   │   │   └── SysExBuilder.ts
│   │   ├── pattern/
│   │   │   ├── PatternGenerator.ts
│   │   │   └── GenreEngine.ts
│   │   └── database/
│   │       └── Database.ts
│   ├── devices/                 # Device-specific implementations
│   │   ├── DeviceInterface.ts   # Abstract interface
│   │   ├── mv1/
│   │   │   ├── MV1Device.ts
│   │   │   ├── MV1SysEx.ts
│   │   │   └── mv1-config.json
│   │   └── electribe/
│   │       └── ElectribeDevice.ts
│   ├── data/
│   │   ├── mv1-sounds.json      # Generated from PDF
│   │   └── genres/
│   │       ├── trap.json
│   │       └── techno.json
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Cursor Instructions:**
```
Create the project structure shown above using these commands:

npm create vite@latest flawless-dawless -- --template react-ts
cd flawless-dawless
npm install
npm install electron electron-builder --save-dev
npm install node-midi better-sqlite3 --save
npm install -D @types/node-midi @types/better-sqlite3

Create all the folders and empty TypeScript files shown in the structure.
Set up Electron integration with Vite.
Configure Tailwind CSS.
```

---

### STEP 3: Implement Device Interface (Abstraction Layer)

**File:** `src/devices/DeviceInterface.ts`

**Purpose:** Define a generic interface that all devices must implement. This makes the software device-agnostic.

**Cursor Instructions:**
```typescript
// Create an abstract device interface that defines:
// 1. Connection/disconnection
// 2. Send MIDI/SysEx commands
// 3. Pattern/sound selection
// 4. Track control (mute, volume, pan)
// 5. Device capabilities query

export interface DeviceInterface {
  // Connection
  connect(): Promise<boolean>;
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
```

---

### STEP 4: Implement MV-1 Device Driver

**File:** `src/devices/mv1/MV1Device.ts`

**Cursor Instructions:**
```typescript
// Implement the DeviceInterface for Roland MV-1
// Use the research from the technical documentation:

import { DeviceInterface, Sound, Pattern } from '../DeviceInterface';
import { MIDIManager } from '../../core/midi/MIDIManager';
import { MV1SysEx } from './MV1SysEx';
import mv1Sounds from '../../data/mv1-sounds.json';

export class MV1Device implements DeviceInterface {
  private midi: MIDIManager;
  private sysex: MV1SysEx;
  
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
  
  async connect(): Promise<boolean> {
    // Look for "VERSELAB MV-1" in MIDI device list
    // Connect via node-midi
    return this.midi.connect('VERSELAB MV-1');
  }
  
  // Implement all interface methods
  // Use MIDI Program Change for sound selection
  // Use SysEx for advanced control (volume, pan, effects)
  
  async selectSound(trackId: number, soundId: string): Promise<void> {
    const sound = mv1Sounds.sounds.find(s => s.id === soundId);
    if (!sound) throw new Error(`Sound ${soundId} not found`);
    
    const channel = this.getChannelForTrack(trackId);
    
    // Send bank select if needed (CC#0 for MSB, CC#32 for LSB)
    if (sound.bank !== undefined) {
      await this.midi.sendCC(channel, 0, sound.bank >> 7);
      await this.midi.sendCC(channel, 32, sound.bank & 0x7F);
    }
    
    // Send program change
    await this.midi.sendPC(channel, sound.program);
  }
  
  // ... implement other methods
}
```

**File:** `src/devices/mv1/MV1SysEx.ts`

**Cursor Instructions:**
```typescript
// Create SysEx message builders for MV-1
// Based on the technical documentation:

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
```

---

### STEP 5: Implement MIDI Manager

**File:** `src/core/midi/MIDIManager.ts`

**Cursor Instructions:**
```typescript
// Create MIDI communication layer using node-midi

import midi from 'node-midi';

export class MIDIManager {
  private input: midi.Input;
  private output: midi.Output;
  private connectedPort: number = -1;
  
  constructor() {
    this.input = new midi.Input();
    this.output = new midi.Output();
  }
  
  // Find and connect to device by name
  async connect(deviceName: string): Promise<boolean> {
    const portCount = this.output.getPortCount();
    
    for (let i = 0; i < portCount; i++) {
      const portName = this.output.getPortName(i);
      if (portName.includes(deviceName)) {
        this.output.openPort(i);
        this.connectedPort = i;
        console.log(`Connected to ${portName}`);
        return true;
      }
    }
    
    console.error(`Device ${deviceName} not found`);
    return false;
  }
  
  disconnect(): void {
    if (this.connectedPort >= 0) {
      this.output.closePort();
      this.connectedPort = -1;
    }
  }
  
  // Send MIDI messages
  async sendNote(channel: number, note: number, velocity: number, duration: number = 100): Promise<void> {
    // Note On
    this.output.sendMessage([0x90 | (channel - 1), note, velocity]);
    
    // Note Off after duration
    await this.delay(duration);
    this.output.sendMessage([0x80 | (channel - 1), note, 0]);
  }
  
  async sendCC(channel: number, cc: number, value: number): Promise<void> {
    this.output.sendMessage([0xB0 | (channel - 1), cc, value]);
  }
  
  async sendPC(channel: number, program: number): Promise<void> {
    this.output.sendMessage([0xC0 | (channel - 1), program]);
  }
  
  async sendSysEx(bytes: number[]): Promise<void> {
    this.output.sendMessage(bytes);
  }
  
  // Register callback for incoming MIDI
  onMessage(callback: (deltaTime: number, message: number[]) => void): void {
    this.input.on('message', callback);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**File:** `src/core/midi/CommandQueue.ts`

**Cursor Instructions:**
```typescript
// Implement command queue to prevent MIDI buffer overflow

export class CommandQueue {
  private queue: (() => Promise<void>)[] = [];
  private processing: boolean = false;
  private delayBetweenCommands: number = 10; // milliseconds
  
  add(command: () => Promise<void>): void {
    this.queue.push(command);
    if (!this.processing) {
      this.process();
    }
  }
  
  private async process(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const command = this.queue.shift();
      if (command) {
        try {
          await command();
          await this.delay(this.delayBetweenCommands);
        } catch (error) {
          console.error('Command failed:', error);
        }
      }
    }
    
    this.processing = false;
  }
  
  clear(): void {
    this.queue = [];
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

### STEP 6: Create Genre Template System

**File:** `src/data/genres/trap.json`

**Cursor Instructions:**
```json
// Create genre template based on specification
// This will be loaded by the Genre Engine

{
  "genreName": "Trap",
  "tempo": {
    "min": 130,
    "max": 170,
    "default": 140
  },
  "timeSignature": "4/4",
  "soundPalette": {
    "kick": ["808_Kick_01", "808_Kick_Deep", "Trap_Kick_Sub"],
    "snare": ["Trap_Snare_01", "Trap_Clap", "Rim_Shot"],
    "hihat": ["HH_Closed_Trap", "HH_Open_Trap", "HH_Roll"],
    "bass": ["808_Bass_Long", "Sub_Bass", "Saw_Bass_Trap"],
    "lead": ["Bell_Melodic", "Synth_Pluck", "Vocal_Chop"],
    "pad": ["Dark_Pad", "String_Pad", "Atmospheric_Pad"]
  },
  "patterns": {
    "kick": {
      "basic": {
        "steps": 16,
        "pattern": [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
        "velocity": [100,0,0,0, 0,0,95,0, 100,0,0,0, 0,0,95,0]
      }
    },
    "snare": {
      "basic": {
        "steps": 16,
        "pattern": [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        "velocity": [0,0,0,0, 100,0,0,0, 0,0,0,0, 100,0,0,0]
      }
    },
    "hihat": {
      "sixteenths": {
        "steps": 16,
        "pattern": [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        "velocity": [80,70,80,70, 80,70,80,70, 80,70,80,70, 80,70,80,70]
      }
    }
  },
  "songStructure": {
    "intro": {
      "length": 8,
      "tracks": ["hihat", "pad"],
      "patterns": {
        "hihat": "sixteenths",
        "pad": "sustained"
      }
    },
    "verse": {
      "length": 16,
      "tracks": ["kick", "snare", "hihat", "bass", "pad"],
      "patterns": {
        "kick": "basic",
        "snare": "basic",
        "hihat": "sixteenths"
      }
    }
  }
}
```

**File:** `src/core/pattern/GenreEngine.ts`

**Cursor Instructions:**
```typescript
// Genre engine that generates songs from templates

import { Pattern } from '../../devices/DeviceInterface';

interface GenreTemplate {
  genreName: string;
  tempo: {
    min: number;
    max: number;
    default: number;
  };
  soundPalette: Record<string, string[]>;
  patterns: Record<string, Record<string, PatternDefinition>>;
  songStructure: Record<string, SectionDefinition>;
}

interface PatternDefinition {
  steps: number;
  pattern: number[];
  velocity: number[];
  triplet?: boolean;
}

interface SectionDefinition {
  length: number;
  tracks: string[];
  patterns: Record<string, string>;
}

export class GenreEngine {
  private templates: Map<string, GenreTemplate> = new Map();
  
  async loadGenre(genreName: string): Promise<void> {
    // Load genre template JSON
    const template = await import(`../../data/genres/${genreName.toLowerCase()}.json`);
    this.templates.set(genreName, template);
  }
  
  generateSong(genreName: string, options?: {
    tempo?: number;
    complexity?: 'simple' | 'medium' | 'complex';
  }): GeneratedSong {
    const template = this.templates.get(genreName);
    if (!template) throw new Error(`Genre ${genreName} not loaded`);
    
    // Generate complete song structure
    const song: GeneratedSong = {
      tempo: options?.tempo || template.tempo.default,
      tracks: this.generateTracks(template),
      sections: this.generateSections(template),
      arrangement: this.generateArrangement(template)
    };
    
    return song;
  }
  
  private generateTracks(template: GenreTemplate): Track[] {
    // For each track type (kick, snare, etc.), generate patterns
    const tracks: Track[] = [];
    
    // Implementation here
    
    return tracks;
  }
  
  // ... more generation methods
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
  clipAssignments: Record<number, number>; // trackId -> clipId
}
```

---

### STEP 7: Create React UI Components

**File:** `src/renderer/components/GenreSelector.tsx`

**Cursor Instructions:**
```tsx
// Create genre selection dropdown

import { useState } from 'react';

interface GenreSelectorProps {
  onGenreSelect: (genre: string) => void;
}

export function GenreSelector({ onGenreSelect }: GenreSelectorProps) {
  const [selectedGenre, setSelectedGenre] = useState('trap');
  
  const genres = ['Trap', 'Techno', 'House', 'Hip-Hop', 'D&B'];
  
  const handleSelect = (genre: string) => {
    setSelectedGenre(genre.toLowerCase());
    onGenreSelect(genre.toLowerCase());
  };
  
  return (
    <div className="genre-selector p-4">
      <h2 className="text-xl font-bold mb-4">Select Genre</h2>
      <div className="space-y-2">
        {genres.map(genre => (
          <button
            key={genre}
            onClick={() => handleSelect(genre)}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              selectedGenre === genre.toLowerCase()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**File:** `src/renderer/components/TrackView.tsx`

**Cursor Instructions:**
```tsx
// Create track visualization component

import { Track } from '../../core/pattern/GenreEngine';

interface TrackViewProps {
  tracks: Track[];
}

export function TrackView({ tracks }: TrackViewProps) {
  return (
    <div className="track-view p-4">
      <h2 className="text-xl font-bold mb-4">Tracks</h2>
      <div className="grid grid-cols-1 gap-2">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="track-row flex items-center gap-4 p-3 bg-gray-100 rounded-lg"
          >
            <div className="track-label font-semibold w-24">
              Track {index + 1}
            </div>
            <div className="track-name flex-1">
              {track.name}
            </div>
            <div className="clips-indicator flex gap-1">
              {track.clips.map(clip => (
                <div
                  key={clip.id}
                  className="w-8 h-8 bg-blue-500 rounded"
                  title={`Clip ${clip.id}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### STEP 8: Main Application Integration

**File:** `src/renderer/App.tsx`

**Cursor Instructions:**
```tsx
// Main application component that ties everything together

import { useState, useEffect } from 'react';
import { GenreSelector } from './components/GenreSelector';
import { TrackView } from './components/TrackView';
import { MV1Device } from '../devices/mv1/MV1Device';
import { GenreEngine, GeneratedSong } from '../core/pattern/GenreEngine';

function App() {
  const [device, setDevice] = useState<MV1Device | null>(null);
  const [connected, setConnected] = useState(false);
  const [genreEngine] = useState(() => new GenreEngine());
  const [currentSong, setCurrentSong] = useState<GeneratedSong | null>(null);
  
  useEffect(() => {
    // Initialize device
    const mv1 = new MV1Device();
    setDevice(mv1);
    
    // Load genres
    genreEngine.loadGenre('trap');
    genreEngine.loadGenre('techno');
    genreEngine.loadGenre('house');
  }, []);
  
  const handleConnect = async () => {
    if (device) {
      const success = await device.connect();
      setConnected(success);
    }
  };
  
  const handleGenreSelect = (genre: string) => {
    const song = genreEngine.generateSong(genre);
    setCurrentSong(song);
  };
  
  const handleSendToDevice = async () => {
    if (!device || !currentSong || !connected) return;
    
    // Send all tracks and patterns to device
    for (const track of currentSong.tracks) {
      // Select sound
      await device.selectSound(track.id, track.soundId);
      
      // Send patterns
      for (const clip of track.clips) {
        await device.sendPattern(track.id, clip.id, clip.pattern);
      }
    }
    
    alert('Song sent to device!');
  };
  
  return (
    <div className="app flex h-screen">
      {/* Sidebar */}
      <div className="sidebar w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">Flawless DAWless</h1>
        
        <div className="mb-6">
          <button
            onClick={handleConnect}
            className={`w-full p-2 rounded ${
              connected ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {connected ? 'Connected' : 'Connect to MV-1'}
          </button>
        </div>
        
        <GenreSelector onGenreSelect={handleGenreSelect} />
      </div>
      
      {/* Main content */}
      <div className="main-content flex-1 p-8">
        <div className="mb-6">
          <button
            onClick={handleSendToDevice}
            disabled={!connected || !currentSong}
            className="px-6 py-3 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
          >
            Send to MV-1
          </button>
        </div>
        
        {currentSong && <TrackView tracks={currentSong.tracks} />}
      </div>
    </div>
  );
}

export default App;
```

---

## BUILD SEQUENCE FOR CURSOR

**Execute these prompts to Cursor in order:**

### 1. Parse Sound List
```
Read the PDF file in the root directory and extract all sound names, categories, and MIDI bank/program numbers. Create a JSON database at src/data/mv1-sounds.json with this structure:
{
  "sounds": [
    { "id": string, "name": string, "category": string, "bank": number, "program": number }
  ]
}
```

### 2. Project Setup
```
Set up an Electron + React + TypeScript project with:
- Vite for bundling
- Tailwind CSS for styling
- node-midi for MIDI communication
- SQLite for local database

Create the folder structure shown in the specification.
```

### 3. MIDI Communication
```
Implement src/core/midi/MIDIManager.ts with methods to:
- Connect to MIDI devices by name
- Send MIDI notes, CC, PC, and SysEx messages
- Handle incoming MIDI messages

Then implement src/core/midi/CommandQueue.ts to queue commands with delays.
```

### 4. Device Interface
```
Create src/devices/DeviceInterface.ts as an abstract interface that all devices implement.
Include methods for connection, sound selection, pattern sending, and track control.
```

### 5. MV-1 Device Driver
```
Implement src/devices/mv1/MV1Device.ts that implements DeviceInterface.
Use the MIDIManager to send commands.
Reference the mv1-sounds.json for sound selection.

Also implement src/devices/mv1/MV1SysEx.ts to build SysEx messages for:
- Track mute/unmute
- Volume control
- Pan control
- Effect selection
```

### 6. Genre Engine
```
Create src/core/pattern/GenreEngine.ts that:
- Loads genre templates from JSON files
- Generates complete songs from templates
- Returns song structure with tracks, clips, and patterns

Create src/data/genres/trap.json as the first genre template.
```

### 7. React UI
```
Build these React components:
1. GenreSelector - dropdown to select genres
2. TrackView - display all tracks and clips
3. SoundBrowser - browse and filter sounds
4. HardwareMirror - show device connection status

Then create src/renderer/App.tsx to tie everything together with:
- Device connection button
- Genre selection
- "Generate Song" button
- "Send to Device" button
```

### 8. Integration & Testing
```
Wire up the full flow:
1. Connect to MV-1
2. Load genre template
3. Generate song
4. Send patterns to device via MIDI

Add error handling and user feedback.
```

---

## CRITICAL NOTES FOR CURSOR

1. **Sound List is Key:** The PDF parsing is critical. All sound selection depends on knowing bank/program numbers.

2. **Device Abstraction:** Keep the core logic device-agnostic so we can add Electribe later. Only MV-1-specific code goes in `src/devices/mv1/`.

3. **MIDI Timing:** Always use the CommandQueue for sending multiple MIDI messages. Never flood the MIDI buffer.

4. **Pattern Format:** Keep patterns as simple arrays of 0s and 1s (or note objects) that can be translated to any device's format.

5. **Testing Without Hardware:** You can test MIDI communication using virtual MIDI ports (like loopMIDI on Windows).

---

## NEXT STEPS AFTER MVP

Once the basic MV-1 implementation works:

1. Add more genre templates
2. Implement manual pattern editing UI
3. Add Electribe device driver
4. Create project save/load functionality
5. Add sound library search/filter
6. Implement effect parameter control

But start with: **Parse PDF → Setup project → MIDI communication → One genre → Send to device**

That's your MVP. Everything else is iteration.
