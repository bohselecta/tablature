// Database manager for local SQLite storage
import Database from 'better-sqlite3';

export class DatabaseManager {
  private db: Database.Database;
  
  constructor(dbPath: string = 'flawless-dawless.db') {
    this.db = new Database(dbPath);
    this.initializeTables();
  }
  
  private initializeTables(): void {
    // Create projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        genre TEXT NOT NULL,
        tempo INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create tracks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        track_number INTEGER NOT NULL,
        sound_id TEXT NOT NULL,
        volume INTEGER DEFAULT 100,
        pan INTEGER DEFAULT 64,
        muted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `);
    
    // Create patterns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        clip_number INTEGER NOT NULL,
        pattern_data TEXT NOT NULL,
        FOREIGN KEY (track_id) REFERENCES tracks (id)
      )
    `);
  }
  
  // Project management
  createProject(name: string, genre: string, tempo: number): number {
    const stmt = this.db.prepare(`
      INSERT INTO projects (name, genre, tempo) 
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(name, genre, tempo);
    return result.lastInsertRowid as number;
  }
  
  getProjects(): any[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    return stmt.all();
  }
  
  // Track management
  addTrack(projectId: number, trackNumber: number, soundId: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO tracks (project_id, track_number, sound_id) 
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(projectId, trackNumber, soundId);
    return result.lastInsertRowid as number;
  }
  
  getTracks(projectId: number): any[] {
    const stmt = this.db.prepare('SELECT * FROM tracks WHERE project_id = ? ORDER BY track_number');
    return stmt.all(projectId);
  }
  
  // Pattern management
  savePattern(trackId: number, clipNumber: number, patternData: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO patterns (track_id, clip_number, pattern_data) 
      VALUES (?, ?, ?)
    `);
    stmt.run(trackId, clipNumber, patternData);
  }
  
  getPatterns(trackId: number): any[] {
    const stmt = this.db.prepare('SELECT * FROM patterns WHERE track_id = ? ORDER BY clip_number');
    return stmt.all(trackId);
  }
  
  close(): void {
    this.db.close();
  }
}
