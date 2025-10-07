# Contributing to tablature.io

🎵 **Welcome to the tablature.io community!** We're excited to have you contribute to this project that brings together hardware music production and intelligent software control.

## 🚀 Quick Start for Contributors

### 1. Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/tablature.git
cd tablature

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Testing Setup

Before making changes, ensure you can test MIDI functionality:

```bash
# On macOS: Enable IAC Driver for virtual MIDI testing
# Applications → Utilities → Audio MIDI Setup
# Window → Show MIDI Studio → IAC Driver → Enable

# On Windows: Install loopMIDI for virtual MIDI
# https://www.tobias-erichsen.de/software/loopmidi.html

# On Linux: Use snd-virmidi kernel module
# sudo modprobe snd-virmidi
```

## 🛠️ Development Workflow

### Branch Strategy

```bash
# Create a feature branch
git checkout -b feature/amazing-new-feature

# Or for bug fixes
git checkout -b fix/bug-description

# Or for documentation
git checkout -b docs/update-readme
```

### Code Standards

- **TypeScript**: Strict mode enabled, use proper types
- **React**: Functional components with hooks
- **MIDI**: Use the MIDIManager abstraction, not direct MIDI calls
- **Testing**: Test with both virtual and real MIDI devices when possible

### Commit Messages

```
feat: add new genre template for house music
fix: resolve MIDI connection timeout issue
docs: update MIDI testing guide for Windows
refactor: extract pattern generation logic
test: add MIDI device detection tests
```

## 🎹 Adding New Device Support

### 1. Implement DeviceInterface

Create a new device class in `/src/devices/`:

```typescript
import type { DeviceInterface, Sound, Pattern } from '../DeviceInterface';

export class YourDevice implements DeviceInterface {
  async connect(deviceName?: string): Promise<boolean> {
    // Implement connection logic
  }

  async selectSound(trackId: number, soundId: string): Promise<void> {
    // Implement sound selection for your device
  }

  // Implement all other required methods...
}
```

### 2. Add Device-Specific MIDI Mappings

- Research your device's MIDI implementation
- Map tracks to MIDI channels
- Document bank select and program change formats
- Add SysEx support if available

### 3. Create Sound Database (if needed)

- Parse device manuals or use MIDI dumps
- Create JSON structure matching existing format
- Include bank, program, and category information

### 4. Add Tests

- Test device detection and connection
- Verify sound selection works
- Test pattern sending (when implemented)

## 🎵 Adding New Genres

### 1. Create Genre Template

Add a new JSON file in `/src/data/genres/`:

```json
{
  "genreName": "Your Genre",
  "tempo": { "min": 120, "max": 140, "default": 128 },
  "timeSignature": "4/4",
  "soundPalette": {
    "kick": ["deep-kick", "punchy-kick"],
    "snare": ["crisp-snare", "vintage-snare"]
  },
  "patterns": {
    "basicBeat": {
      "kick": [1, 0, 0, 0, 1, 0, 0, 0],
      "snare": [0, 0, 1, 0, 0, 0, 1, 0]
    }
  },
  "songStructure": {
    "intro": ["basicBeat"],
    "verse": ["basicBeat", "variation1"],
    "chorus": ["basicBeat", "buildUp"]
  }
}
```

### 2. Update GenreEngine

Add your genre to the available options in `GenreEngine.ts`.

### 3. Test Generation

- Generate songs with your new genre
- Verify patterns sound good
- Test with different complexity levels

## 🧪 Testing Guidelines

### MIDI Testing

1. **Always test with virtual MIDI first** (IAC Driver, loopMIDI, etc.)
2. **Test with real hardware** when possible
3. **Document device-specific quirks** in comments
4. **Include troubleshooting steps** in pull requests

### Code Testing

```bash
# Run tests (when implemented)
npm test

# Check TypeScript compilation
npm run build

# Run linting
npm run lint
```

## 📝 Documentation

### Required Documentation Updates

- **README.md**: Update feature lists and supported devices
- **MIDI_TESTING_GUIDE.md**: Add device-specific testing procedures
- **API Documentation**: Document new public interfaces
- **Changelog**: Add entry for your changes

### Code Documentation

```typescript
/**
 * Selects a sound on the specified track
 * @param trackId - Track number (0-based)
 * @param soundId - Unique sound identifier from database
 * @returns Promise that resolves when sound selection is complete
 * @throws Error if device not connected or sound not found
 */
async selectSound(trackId: number, soundId: string): Promise<void>
```

## 🚨 Before Submitting

### Checklist

- [ ] **Code compiles**: `npm run build` passes
- [ ] **Tests pass**: All existing tests still work
- [ ] **MIDI tested**: Works with virtual MIDI and real hardware
- [ ] **Documentation updated**: README and guides reflect changes
- [ ] **TypeScript types**: All new code is properly typed
- [ ] **Error handling**: Proper error messages and fallbacks
- [ ] **Code style**: Follows project conventions

### Pull Request Template

```markdown
## Description
Brief description of what this PR does

## Changes
- Added support for [Device Name]
- Implemented [Feature]
- Fixed [Bug]

## Testing
- Tested with IAC Driver on macOS
- Tested with real [Device Name] hardware
- Verified sound selection works
- Confirmed pattern sending functions

## Documentation
- Updated README with new device support
- Added MIDI testing guide for [Device Name]
- Documented any device-specific quirks

## Screenshots
[Add screenshots if UI changes were made]
```

## 🎯 Areas for Contribution

### High Priority
- **Additional Device Support**: Electribe, MPC, Circuit Tracks
- **Pattern Generation**: Advanced algorithmic patterns
- **Genre Templates**: More music styles and variations
- **Testing**: Comprehensive test suite

### Medium Priority
- **UI Improvements**: Better visualization of patterns
- **Performance**: Optimize MIDI communication
- **Audio Features**: VST plugin support
- **Mobile App**: iOS/Android companion app

### Nice to Have
- **Cloud Sync**: Save patterns and songs online
- **Collaboration**: Share patterns with other users
- **AI Integration**: Machine learning for pattern suggestions
- **Plugin System**: Extensible architecture for third-party devices

## 💬 Getting Help

- **GitHub Issues**: [Report bugs and request features](https://github.com/bohselecta/tablature/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/bohselecta/tablature/discussions)
- **Documentation**: [MIDI Testing Guide](./MIDI_TESTING_GUIDE.md)

## 🌟 Recognition

Contributors who add significant features or device support will be:
- Featured in the README acknowledgments
- Mentioned in release notes
- Given early access to new features

---

**Thank you for contributing to tablature.io!** 🎵 Your work helps musicians around the world create amazing music with their hardware. Let's build something incredible together!
