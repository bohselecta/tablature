import * as fs from 'fs';
import * as path from 'path';
const pdf = require('pdf-parse');

interface SoundData {
  id: string;
  name: string;
  category: string;
  bank: number;
  program: number;
}

interface SoundDatabase {
  sounds: SoundData[];
}

async function parseMV1Sounds(): Promise<void> {
  try {
    console.log('Reading MV-1-sounds-list.pdf...');
    
    // Read the PDF file
    const pdfPath = path.join(__dirname, '..', 'MV-1-sounds-list.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Parse PDF
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;
    
    console.log('PDF parsed successfully. Extracting sound data...');
    
    // Split text into lines for processing
    const lines: string[] = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
    
    const sounds: SoundData[] = [];
    let currentBank = 0;
    let soundId = 1;
    
    // Parse the text to extract sound information
    for (let i = 0; i < lines.length; i++) {
      const line: string = lines[i];
      
      // Look for bank headers (Bank A, Bank B, etc.)
      const bankMatch = line.match(/Bank\s+([A-Z])/i);
      if (bankMatch) {
        currentBank = bankMatch[1].charCodeAt(0) - 'A'.charCodeAt(0); // Convert A=0, B=1, etc.
        continue;
      }
      
      // Look for sound entries with format: "No. Tone Name Category"
      // Skip header lines
      if (line.includes('No. Tone Name Category') || line.includes('Tone Name Category')) {
        continue;
      }
      
      // Look for sound entries (number followed by name and category)
      const soundMatch = extractSoundInfo(line, currentBank);
      if (soundMatch) {
        const sound: SoundData = {
          id: `sound_${soundId.toString().padStart(3, '0')}`,
          name: soundMatch.name,
          category: soundMatch.category,
          bank: soundMatch.bank,
          program: soundMatch.program
        };
        
        sounds.push(sound);
        soundId++;
        console.log(`Found sound: ${sound.name} (Bank: ${sound.bank}, Program: ${sound.program})`);
      }
    }
    
    // Create the database structure
    const database: SoundDatabase = {
      sounds: sounds
    };
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write JSON file
    const outputPath = path.join(dataDir, 'mv1-sounds.json');
    fs.writeFileSync(outputPath, JSON.stringify(database, null, 2));
    
    console.log(`\nSuccessfully parsed ${sounds.length} sounds`);
    console.log(`Output written to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
    process.exit(1);
  }
}

function isCategoryHeader(line: string): boolean {
  // Category headers are typically:
  // - All caps
  // - Short phrases
  // - Not containing numbers
  // - Common music categories
  
  const commonCategories = [
    'DRUM KITS', 'DRUMS', 'KICKS', 'SNARES', 'HIHATS', 'CYMBALS',
    'BASS', 'BASSES', 'LEAD', 'LEADS', 'PAD', 'PADS', 'STRINGS',
    'BRASS', 'WOODWIND', 'PERCUSSION', 'VOCAL', 'VOCALS',
    'SYNTH', 'SYNTHS', 'KEYS', 'KEYBOARD', 'ORGAN', 'PIANO',
    'GUITAR', 'GUITARS', 'BASS GUITAR', 'ELECTRIC', 'ACOUSTIC',
    'EFFECTS', 'FX', 'AMBIENT', 'ATMOSPHERIC', 'LOOPS'
  ];
  
  const upperLine = line.toUpperCase();
  
  // Check if it's a common category
  if (commonCategories.some(cat => upperLine.includes(cat))) {
    return true;
  }
  
  // Check if it's all caps and short (likely a category)
  if (line === upperLine && line.length < 30 && !/\d/.test(line)) {
    return true;
  }
  
  return false;
}

function extractSoundInfo(line: string, bank: number): { name: string; bank: number; program: number; category: string } | null {
  // Pattern: "No. Tone Name Category"
  // Example: "1 Sat.808+SynthBD1 Drums"
  // Example: "2 Sat.808+SynthBD2 Drums"
  
  const match = line.match(/^(\d+)\s+(.+?)\s+(.+)$/);
  if (match) {
    const program = parseInt(match[1]);
    const name = match[2].trim();
    const category = match[3].trim();
    
    return {
      name: name,
      bank: bank,
      program: program,
      category: category
    };
  }
  
  return null;
}

// Run the parser
parseMV1Sounds();
