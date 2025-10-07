// src/App.tsx - Updated with device selection

import { useState, useEffect } from 'react';
import { GenreSelector } from './renderer/components/GenreSelector';
import { TrackView } from './renderer/components/TrackView';
import { VocalRecording } from './renderer/components/VocalRecording';
import { MV1Device } from './devices/mv1/MV1Device';
import { GenreEngine, type GeneratedSong } from './core/pattern/GenreEngine';
import { type MIDIDevice, MIDIManager } from './core/midi/MIDIManager';

function App() {
  const [device] = useState(() => new MV1Device());
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [midiManagerInstance] = useState(() => new MIDIManager());
  const [availableDevices, setAvailableDevices] = useState<MIDIDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [genreEngine] = useState(() => new GenreEngine());
  const [currentSong, setCurrentSong] = useState<GeneratedSong | null>(null);
  const [status, setStatus] = useState<string>('Not connected');
  const [showVocalRecording, setShowVocalRecording] = useState(false);
  const [browserCompatibility, setBrowserCompatibility] = useState<any>(null);

  // Load available MIDI devices and check browser compatibility on mount
  useEffect(() => {
    // Check browser compatibility
    const compatibility = midiManagerInstance.getCompatibilityInfo();
    setBrowserCompatibility(compatibility);

    if (compatibility.webMidiSupported) {
      refreshDevices();
    } else {
      setStatus(`Web MIDI not supported. ${compatibility.recommendedBrowser} recommended.`);
    }

    // Load genres
    genreEngine.loadGenre('trap').catch(console.error);
    genreEngine.loadGenre('techno').catch(console.error);
    genreEngine.loadGenre('house').catch(console.error);
  }, [genreEngine]);

  const refreshDevices = () => {
    const devices = midiManagerInstance.listAvailableDevices();
    setAvailableDevices(devices);

    // Auto-select MV-1 if found
    const mv1Device = devices.find((d: MIDIDevice) =>
      d.name.toLowerCase().includes('verselab') ||
      d.name.toLowerCase().includes('mv-1') ||
      d.name.toLowerCase().includes('mv1')
    );

    if (mv1Device) {
      setSelectedDeviceId(mv1Device.id);
      setStatus(`Found: ${mv1Device.name}`);
    } else if (devices.length > 0) {
      setStatus(`${devices.length} MIDI device(s) found`);
    } else {
      setStatus('No MIDI devices found');
    }
  };

  const handleConnect = async () => {
    if (!selectedDeviceId) {
      setStatus('Please select a device');
      return;
    }

    setConnecting(true);
    setStatus('Connecting...');

    try {
      const success = await device.connectById(selectedDeviceId);
      setConnected(success);

      if (success) {
        const deviceName = midiManagerInstance.getConnectedDeviceName();
        setStatus(`Connected to ${deviceName}`);

        // Test the connection
        const testResult = await device.testConnection();
        if (testResult) {
          setStatus(`Connected and tested successfully!`);
        } else {
          setStatus(`Connected (test note failed - check audio)`);
        }
      } else {
        setStatus('Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(`Error: ${error}`);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    device.disconnect();
    setConnected(false);
    setStatus('Disconnected');
  };

  const handleGenreSelect = (genre: string) => {
    try {
      const song = genreEngine.generateSong(genre);
      setCurrentSong(song);
      setStatus(`Generated ${genre} song`);
    } catch (error) {
      console.error('Generation error:', error);
      setStatus(`Error generating song: ${error}`);
    }
  };

  const handleSendToDevice = async () => {
    if (!device || !currentSong || !connected) {
      setStatus('Cannot send: not connected or no song loaded');
      return;
    }

    setStatus('Sending to device...');

    try {
      // Send all tracks and patterns to device
      for (const track of currentSong.tracks) {
        setStatus(`Sending track ${track.id}: ${track.name}...`);

        // Select sound
        await device.selectSound(track.id, track.soundId);

        // Send patterns
        for (const clip of track.clips) {
          await device.sendPattern(track.id, clip.id, clip.pattern);
        }
      }

      setStatus('Song sent successfully!');
    } catch (error) {
      console.error('Send error:', error);
      setStatus(`Error sending to device: ${error}`);
    }
  };

  const handleTestNote = async () => {
    if (!connected) {
      setStatus('Not connected');
      return;
    }

    setStatus('Playing test note...');
    try {
      await device.testConnection();
      setStatus('Test note sent');
    } catch (error) {
      setStatus(`Test failed: ${error}`);
    }
  };

  // Create a simple test instrumental track
  const createTestInstrumental = (): AudioBuffer => {
    // Create a simple 30-second audio buffer with silence for testing
    const audioContext = new AudioContext();
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * 30, audioContext.sampleRate);

    // Fill with silence (for testing)
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      // Could add a simple test tone here if needed
    }

    return buffer;
  };

  // Sample lyrics for testing
  const sampleLyrics = [
    {
      text: "Started from the bottom now I'm climbing",
      syllables: ["Start", "ed", "from", "the", "bot", "tom", "now", "I'm", "climb", "ing"],
      notes: [60, 60, 62, 64, 65, 64, 62, 60, 59, 60], // C4, D4, E4, F4, E4, D4, C4, B3, C4
      startTime: 5.0,
      duration: 4.0
    },
    {
      text: "Every setback just perfect timing",
      syllables: ["Ev", "er", "y", "set", "back", "just", "per", "fect", "ti", "ming"],
      notes: [62, 64, 65, 64, 62, 60, 59, 60, 62, 64], // D4, E4, F4, E4, D4, C4, B3, C4, D4, E4
      startTime: 10.0,
      duration: 3.5
    }
  ];

  return (
    <div className="app flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="sidebar w-80 bg-gray-800 p-6 flex flex-col">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Flawless DAWless
        </h1>

        {/* Connection Section */}
        <div className="connection-section mb-8">
          <h2 className="text-lg font-semibold mb-4">Device Connection</h2>

          {/* Device Selection Dropdown */}
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={connected}
            className="w-full mb-3 p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select MIDI Device...</option>
            {availableDevices.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name} {dev.type === 'input' ? '(Input)' : '(Output)'}
              </option>
            ))}
          </select>

          {/* Connection Buttons */}
          <div className="flex gap-2 mb-3">
            {!connected ? (
              <>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !selectedDeviceId || !browserCompatibility?.webMidiSupported}
                  className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  onClick={refreshDevices}
                  disabled={connecting}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  title="Refresh device list"
                >
                  🔄
                </button>
              </>
            ) : (
              <button
                onClick={handleDisconnect}
                className="flex-1 p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Browser Compatibility Info */}
          {!browserCompatibility?.webMidiSupported && (
            <div className="mb-3 p-3 bg-amber-900/50 border border-amber-600 rounded text-sm">
              <div className="text-amber-400 font-semibold">Browser Compatibility</div>
              <div className="text-gray-300">
                Web MIDI requires {browserCompatibility?.recommendedBrowser || 'Chrome/Edge'}
              </div>
              {browserCompatibility?.limitations && (
                <ul className="text-gray-400 mt-1">
                  {browserCompatibility.limitations.map((limitation: string, idx: number) => (
                    <li key={idx}>• {limitation}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Test Button */}
          {connected && (
            <button
              onClick={handleTestNote}
              className="w-full p-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors mb-3"
            >
              🎵 Test Note
            </button>
          )}

          {/* Status Display */}
          <div className={`p-3 rounded text-sm ${
            connected ? 'bg-green-900/50 border border-green-600' :
            connecting ? 'bg-blue-900/50 border border-blue-600' :
            'bg-gray-700 border border-gray-600'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-400 animate-pulse' :
                connecting ? 'bg-blue-400 animate-pulse' :
                'bg-gray-400'
              }`} />
              <span className="font-mono">{status}</span>
            </div>
          </div>
        </div>

        {/* Genre Selection */}
        <div className="genre-section flex-1 overflow-auto">
          <GenreSelector onGenreSelect={handleGenreSelect} />
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          v1.0.0-alpha • Roland MV-1
        </div>
      </div>

      {/* Main content */}
      <div className="main-content flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Action Bar */}
          <div className="action-bar mb-8 flex gap-4">
            <button
              onClick={() => {
                if (currentSong) {
                  // Regenerate current genre
                  const genre = 'trap'; // TODO: track current genre
                  handleGenreSelect(genre);
                }
              }}
              disabled={!currentSong}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              🎲 Generate New
            </button>

            <button
              onClick={handleSendToDevice}
              disabled={!connected || !currentSong}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              ▶️ Send to MV-1
            </button>

            <button
              onClick={() => setShowVocalRecording(true)}
              disabled={!currentSong}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              🎙️ Record Vocals
            </button>

            <button
              disabled={!currentSong}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              💾 Save Project
            </button>
          </div>

          {/* Main Content Area */}
          {showVocalRecording ? (
            <VocalRecording
              instrumentalTrack={createTestInstrumental()}
              lyrics={sampleLyrics}
              onComplete={(recording) => {
                console.log('Vocal recording complete:', recording);
                setShowVocalRecording(false);
                setStatus('Vocal recording saved!');
              }}
              onCancel={() => setShowVocalRecording(false)}
            />
          ) : currentSong ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Current Song</h2>
                <div className="text-gray-400">
                  Tempo: {currentSong.tempo} BPM • {currentSong.tracks.length} Tracks
                </div>
              </div>
              <TrackView tracks={currentSong.tracks} />
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🎵</div>
                <div className="text-xl mb-2">No song loaded</div>
                <div className="text-sm">Select a genre to generate a song</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
