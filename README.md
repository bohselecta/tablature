# tablature.io - The Flawless DAWless Experience 🎹

> **Revolutionizing hardware music production with intelligent, genre-based control of MIDI devices**

tablature.io is a desktop application that brings the power of algorithmic composition and intelligent device control to hardware grooveboxes and MIDI instruments. Built for musicians who love the tactile experience of hardware but want the creative possibilities of modern music production software.

## ✨ Features

### 🎵 Intelligent Genre Engine
- **Genre-based composition**: Generate complete songs from templates (Trap, Techno, House, Hip-Hop, D&B)
- **Pattern generation**: Algorithmic creation of drum patterns, bass lines, and melodic elements
- **Song structure**: Automatic arrangement with intro, verse, chorus, and breakdown sections
- **Tempo and complexity control**: Customize generated music to your preferences

### 🎛️ Hardware Device Control
- **Universal MIDI interface**: Works with any MIDI-compliant hardware
- **Device abstraction**: Clean API for adding support for new devices
- **Real-time parameter control**: Volume, pan, mute, effects for each track
- **Pattern synchronization**: Send generated patterns directly to hardware

### 🎹 MV-1 Integration
- **Complete sound database**: 4,852+ Roland MV-1 sounds with bank/program mapping
- **Track mapping**: Intelligent channel assignment (Kick=1, Snare=2, HiHat=3, etc.)
- **SysEx support**: Advanced MV-1 specific features via System Exclusive messages
- **Pattern recording**: Convert generated patterns to MV-1 clip slots

### 🔧 Developer-Friendly Architecture
- **Clean abstractions**: DeviceInterface for hardware-agnostic core logic
- **Extensible design**: Easy to add new devices and genres
- **TypeScript throughout**: Full type safety and excellent IDE support
- **Cross-platform**: Works on macOS, Windows, and Linux

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MIDI hardware (Roland MV-1, Korg Electribe, etc.) or virtual MIDI setup

### Installation

```bash
# Clone the repository
git clone https://github.com/bohselecta/tablature.git
cd tablature

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### First Run

1. **Open** http://localhost:5173 in your browser
2. **Connect MIDI device** - Select your hardware from the dropdown
3. **Choose genre** - Pick Trap, Techno, House, etc.
4. **Generate song** - Click "Generate Song" to create music
5. **Send to hardware** - Click "Send to MV-1" to control your device

## 📁 Project Structure

```
tablature/
├── src/
│   ├── core/
│   │   ├── midi/           # MIDI communication layer
│   │   ├── pattern/        # Genre engine and pattern generation
│   │   └── database/       # Local storage and caching
│   ├── devices/            # Hardware device implementations
│   │   ├── mv1/           # Roland MV-1 specific code
│   │   └── electribe/     # Korg Electribe support
│   ├── renderer/          # React UI components
│   └── data/              # Sound databases and genre templates
├── scripts/               # Build and utility scripts
├── public/               # Static assets
└── dist/                # Production build output
```

## 🎯 Supported Hardware

### Primary Targets
- **Roland Verselab MV-1** - Complete integration with sound selection and pattern control
- **Korg Electribe Series** - Pattern sending and parameter control

### Future Support
- **Akai MPC Series** - USB MIDI and pattern synchronization
- **Novation Circuit** - Groovebox control and sequencing
- **Arturia BeatStep Pro** - Advanced sequencing features

## 🔧 Technical Architecture

### Core Systems
- **MIDIManager**: Cross-platform MIDI communication using @julusian/midi
- **DeviceInterface**: Abstract interface for hardware control
- **GenreEngine**: Template-based music generation
- **PatternGenerator**: Algorithmic pattern creation

### Technology Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build System**: Vite 7 with HMR and code splitting
- **MIDI Library**: @julusian/midi (cross-platform)
- **Desktop**: Electron for native desktop app
- **Database**: SQLite for local sound/pattern storage

## 🧪 Testing & Development

### MIDI Testing Guide
See [MIDI_TESTING_GUIDE.md](./MIDI_TESTING_GUIDE.md) for detailed testing procedures with virtual MIDI and real hardware.

### Virtual MIDI Setup (macOS)
```bash
# Enable IAC Driver in Audio MIDI Setup app
# Window → Show MIDI Studio → Double-click IAC Driver → Enable
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run electron     # Run as desktop app
```

## 📊 Current Status

### ✅ Completed Features
- **MIDI Infrastructure**: Complete cross-platform MIDI communication
- **Device Detection**: Automatic MIDI device enumeration and connection
- **MV-1 Integration**: Full sound selection and pattern sending
- **Sound Database**: 4,852+ MV-1 sounds with proper bank/program mapping
- **UI Framework**: Modern React interface with device controls
- **Genre Templates**: Basic Trap and Techno pattern structures

### 🚧 In Development
- **Pattern Generation**: Advanced algorithmic pattern creation
- **Song Arrangement**: Multi-section composition engine
- **Multi-device Support**: Expand beyond MV-1
- **VST Integration**: Software instrument control

### 🎯 Roadmap
- **V2.0**: Complete genre engine with AI-assisted composition
- **V3.0**: Vocal recording and processing capabilities
- **V4.0**: Advanced mixing and effects automation

## 🤝 Contributing

We welcome contributions! tablature.io is built for the music technology community.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly (see testing guide)
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Adding New Devices
1. Implement the `DeviceInterface` in `/src/devices/`
2. Add device-specific MIDI mappings
3. Create sound database if needed
4. Add tests and documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Roland** for the incredible MV-1 hardware
- **@julusian** for the excellent MIDI library
- **React Team** for the amazing framework
- **Music tech community** for inspiration and support

## 📞 Support

- **Documentation**: [MIDI Testing Guide](./MIDI_TESTING_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/bohselecta/tablature/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bohselecta/tablature/discussions)

---

**tablature.io** - Because every musician deserves the perfect blend of hardware soul and software intelligence. 🎵✨
