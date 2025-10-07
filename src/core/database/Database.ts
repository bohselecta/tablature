// Web-compatible storage manager using localStorage/IndexedDB
// For web-first deployment - no external dependencies

interface Project {
  id: string;
  name: string;
  genre: string;
  tempo: number;
  createdAt: string;
  updatedAt: string;
}

interface Track {
  id: string;
  projectId: string;
  trackNumber: number;
  soundId: string;
  volume: number;
  pan: number;
  muted: boolean;
}

interface Pattern {
  id: string;
  trackId: string;
  clipNumber: number;
  patternData: string;
}

export class StorageManager {
  private storageKey = 'tablature_projects';

  constructor() {
    // Initialize storage if needed
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // Project management
  createProject(name: string, genre: string, tempo: number): string {
    const projects = this.getProjectsFromStorage();
    const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const project: Project = {
      id,
      name,
      genre,
      tempo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(project);
    this.saveProjectsToStorage(projects);

    return id;
  }

  getProjects(): Project[] {
    return this.getProjectsFromStorage();
  }

  getProject(id: string): Project | null {
    const projects = this.getProjectsFromStorage();
    return projects.find(p => p.id === id) || null;
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const projects = this.getProjectsFromStorage();
    const index = projects.findIndex(p => p.id === id);

    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveProjectsToStorage(projects);
    }
  }

  deleteProject(id: string): void {
    const projects = this.getProjectsFromStorage().filter(p => p.id !== id);
    this.saveProjectsToStorage(projects);

    // Also delete associated tracks and patterns
    this.deleteTracksByProject(id);
  }

  // Track management
  addTrack(projectId: string, trackNumber: number, soundId: string): string {
    const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const track: Track = {
      id,
      projectId,
      trackNumber,
      soundId,
      volume: 100,
      pan: 64,
      muted: false
    };

    const tracksKey = `tablature_tracks_${projectId}`;
    const tracks = this.getTracksFromStorage(projectId);
    tracks.push(track);
    localStorage.setItem(tracksKey, JSON.stringify(tracks));

    return id;
  }

  getTracks(projectId: string): Track[] {
    return this.getTracksFromStorage(projectId);
  }

  updateTrack(trackId: string, updates: Partial<Track>): void {
    // Find which project this track belongs to
    const projects = this.getProjectsFromStorage();
    for (const project of projects) {
      const tracks = this.getTracksFromStorage(project.id);
      const trackIndex = tracks.findIndex(t => t.id === trackId);

      if (trackIndex !== -1) {
        tracks[trackIndex] = { ...tracks[trackIndex], ...updates };
        localStorage.setItem(`tablature_tracks_${project.id}`, JSON.stringify(tracks));
        break;
      }
    }
  }

  deleteTracksByProject(projectId: string): void {
    localStorage.removeItem(`tablature_tracks_${projectId}`);
    localStorage.removeItem(`tablature_patterns_${projectId}`);
  }

  // Pattern management
  savePattern(trackId: string, clipNumber: number, patternData: string): string {
    const id = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pattern: Pattern = {
      id,
      trackId,
      clipNumber,
      patternData
    };

    // Find project ID for this track
    const projects = this.getProjectsFromStorage();
    let projectId = '';

    for (const project of projects) {
      const tracks = this.getTracksFromStorage(project.id);
      if (tracks.some(t => t.id === trackId)) {
        projectId = project.id;
        break;
      }
    }

    if (projectId) {
      const patternsKey = `tablature_patterns_${projectId}`;
      const patterns = this.getPatternsFromStorage(projectId);
      patterns.push(pattern);
      localStorage.setItem(patternsKey, JSON.stringify(patterns));
    }

    return id;
  }

  getPatterns(trackId: string): Pattern[] {
    // Find project ID for this track
    const projects = this.getProjectsFromStorage();
    for (const project of projects) {
      const tracks = this.getTracksFromStorage(project.id);
      if (tracks.some(t => t.id === trackId)) {
        return this.getPatternsFromStorage(project.id);
      }
    }
    return [];
  }

  // Storage utilities
  private getProjectsFromStorage(): Project[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveProjectsToStorage(projects: Project[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  private getTracksFromStorage(projectId: string): Track[] {
    const tracksKey = `tablature_tracks_${projectId}`;
    const data = localStorage.getItem(tracksKey);
    return data ? JSON.parse(data) : [];
  }

  private getPatternsFromStorage(projectId: string): Pattern[] {
    const patternsKey = `tablature_patterns_${projectId}`;
    const data = localStorage.getItem(patternsKey);
    return data ? JSON.parse(data) : [];
  }

  // Export/Import for backup
  exportData(): string {
    const projects = this.getProjectsFromStorage();

    // Collect all tracks and patterns
    const allTracks: Track[] = [];
    const allPatterns: Pattern[] = [];

    projects.forEach(project => {
      allTracks.push(...this.getTracksFromStorage(project.id));
      allPatterns.push(...this.getPatternsFromStorage(project.id));
    });

    const data = {
      projects,
      tracks: allTracks,
      patterns: allPatterns,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.projects && Array.isArray(data.projects)) {
        // Clear existing data
        localStorage.removeItem(this.storageKey);

        // Import projects
        this.saveProjectsToStorage(data.projects);

        // Import tracks and patterns if available
        if (data.tracks && data.patterns) {
          data.projects.forEach((project: Project) => {
            const projectTracks = data.tracks.filter((t: Track) => t.projectId === project.id);
            const projectPatterns = data.patterns.filter((p: Pattern) =>
              projectTracks.some((t: Track) => t.id === p.trackId)
            );

            if (projectTracks.length > 0) {
              localStorage.setItem(`tablature_tracks_${project.id}`, JSON.stringify(projectTracks));
            }
            if (projectPatterns.length > 0) {
              localStorage.setItem(`tablature_patterns_${project.id}`, JSON.stringify(projectPatterns));
            }
          });
        }

        return true;
      }
    } catch (error) {
      console.error('Import failed:', error);
    }

    return false;
  }

  // Clear all data (for testing/reset)
  clearAllData(): void {
    const projects = this.getProjectsFromStorage();
    projects.forEach(project => {
      this.deleteTracksByProject(project.id);
    });
    localStorage.removeItem(this.storageKey);
  }
}
