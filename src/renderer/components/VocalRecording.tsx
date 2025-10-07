// src/renderer/components/VocalRecording.tsx
// Complete vocal recording interface with pitch guidance

import { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '../../core/audio/AudioEngine';

interface Lyric {
  text: string;
  syllables: string[];
  notes: number[]; // MIDI note numbers
  startTime: number; // seconds
  duration: number; // seconds
}

interface VocalRecordingProps {
  instrumentalTrack: AudioBuffer;
  lyrics?: Lyric[];
  onComplete: (recording: Blob) => void;
  onCancel: () => void;
}

export function VocalRecording({
  instrumentalTrack,
  lyrics,
  onComplete,
  onCancel
}: VocalRecordingProps) {
  // Audio engine
  const [audioEngine] = useState(() => new AudioEngine({ sampleRate: 44100, bufferSize: 256 }));
  const [initialized, setInitialized] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordedTakes, setRecordedTakes] = useState<Blob[]>([]);
  const [selectedTake, setSelectedTake] = useState(0);

  // Pitch guidance
  const [pitchGuideEnabled, setPitchGuideEnabled] = useState(true);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [targetPitch, setTargetPitch] = useState<number | null>(null);

  // Mix controls
  const [monitorVolume, setMonitorVolume] = useState(0.8);
  const [instrumentalVolume, setInstrumentalVolume] = useState(0.6);
  const [guideVolume, setGuideVolume] = useState(0.4);

  // Auto-tune
  const [autoTuneMode, setAutoTuneMode] = useState<'off' | 'light' | 'medium' | 'heavy'>('light');

  // Lyric display
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState(0);

  // Setup refs
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Initialize audio on mount
  useEffect(() => {
    const init = async () => {
      try {
        await audioEngine.initializeInput();
        setInitialized(true);

        // Calculate duration from instrumental
        setDuration(instrumentalTrack.duration);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        alert('Microphone access is required to record vocals.');
      }
    };

    init();

    return () => {
      audioEngine.dispose();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update pitch detection and guidance
  useEffect(() => {
    if (!isRecording || !pitchGuideEnabled) return;

    const updatePitch = () => {
      const detected = audioEngine.getCurrentPitch();
      setCurrentPitch(detected);

      // Update target pitch based on current position in lyrics
      if (lyrics && lyrics[currentLyricIndex]) {
        const lyric = lyrics[currentLyricIndex];
        const noteIndex = Math.min(currentSyllableIndex, lyric.notes.length - 1);
        const midiNote = lyric.notes[noteIndex];

        // Convert MIDI to frequency
        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
        setTargetPitch(freq);
        audioEngine.updatePitchGuide(freq);
      }

      animationFrameRef.current = requestAnimationFrame(updatePitch);
    };

    updatePitch();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, pitchGuideEnabled, currentLyricIndex, currentSyllableIndex]);

  // Handle recording countdown and timing
  const handleStartRecording = async () => {
    if (!initialized) return;

    // Countdown
    for (let i = 3; i > 0; i--) {
      // TODO: Show countdown UI
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Configure audio
    audioEngine.setMonitorVolume(monitorVolume);
    audioEngine.setInstrumentalVolume(instrumentalVolume);
    audioEngine.setGuideVolume(guideVolume);

    // Set auto-tune
    const autoTuneStrength = {
      'off': 0,
      'light': 0.3,
      'medium': 0.6,
      'heavy': 0.9
    }[autoTuneMode];

    audioEngine.configureAutoTune({
      strength: autoTuneStrength,
      speed: 40,
      scale: 'minor', // TODO: Detect from track
      key: 'C'
    });

    // Start monitoring with auto-tune if enabled
    audioEngine.startMonitoring(autoTuneMode !== 'off');

    // Start pitch guide
    if (pitchGuideEnabled && targetPitch) {
      audioEngine.startPitchGuide(targetPitch);
    }

    // Start recording
    await audioEngine.startRecording();
    setIsRecording(true);
    startTimeRef.current = Date.now();

    // Start playback animation
    animatePlayback();
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    audioEngine.stopMonitoring();
    audioEngine.stopPitchGuide();

    const blob = await audioEngine.stopRecording();
    setRecordedTakes([...recordedTakes, blob]);
    setSelectedTake(recordedTakes.length);
  };

  const animatePlayback = () => {
    const animate = () => {
      if (!isRecording) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setCurrentTime(elapsed);

      // Update lyric position
      if (lyrics) {
        // Find current lyric based on time
        for (let i = 0; i < lyrics.length; i++) {
          const lyric = lyrics[i];
          if (elapsed >= lyric.startTime && elapsed < lyric.startTime + lyric.duration) {
            setCurrentLyricIndex(i);

            // Calculate syllable position
            const lyricProgress = (elapsed - lyric.startTime) / lyric.duration;
            const syllableIndex = Math.floor(lyricProgress * lyric.syllables.length);
            setCurrentSyllableIndex(Math.min(syllableIndex, lyric.syllables.length - 1));
            break;
          }
        }
      }

      // Stop if reached end
      if (elapsed >= duration) {
        handleStopRecording();
        return;
      }

      requestAnimationFrame(animate);
    };

    animate();
  };

  const handlePlayback = async () => {
    if (recordedTakes.length === 0) return;

    setIsPreviewing(true);
    const audioContext = new AudioContext();
    const buffer = await audioContext.decodeAudioData(
      await recordedTakes[selectedTake].arrayBuffer()
    );

    audioEngine.playBuffer(buffer, () => {
      setIsPreviewing(false);
      audioContext.close();
    });
  };

  const handleKeepTake = () => {
    if (recordedTakes.length === 0) return;
    onComplete(recordedTakes[selectedTake]);
  };

  // Pitch deviation indicator
  const getPitchDeviation = () => {
    if (!currentPitch || !targetPitch) return 0;
    const cents = 1200 * Math.log2(currentPitch / targetPitch);
    return Math.max(-50, Math.min(50, cents)); // Clamp to ±50 cents
  };

  const getPitchColor = () => {
    const deviation = Math.abs(getPitchDeviation());
    if (deviation < 10) return '#10B981'; // Green - on pitch
    if (deviation < 25) return '#F59E0B'; // Amber - close
    return '#EF4444'; // Red - off
  };

  return (
    <div className="vocal-recording flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="header flex items-center justify-between p-6 bg-gray-800 border-b border-gray-700">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Studio
        </button>

        <h1 className="text-2xl font-bold">Vocal Recording Studio</h1>

        <div className="text-sm text-gray-400">
          Take {recordedTakes.length + 1} of 16
        </div>
      </div>

      {/* Main Recording Area */}
      <div className="main-area flex-1 flex flex-col items-center justify-center p-8">

        {/* Karaoke Display */}
        {lyrics && lyrics[currentLyricIndex] && (
          <div className="karaoke-display mb-12 text-center">
            <div className="text-4xl font-bold mb-4">
              {lyrics[currentLyricIndex].syllables.map((syllable, idx) => (
                <span
                  key={idx}
                  className={`mx-1 transition-all duration-200 ${
                    idx === currentSyllableIndex
                      ? 'text-blue-400 scale-110 inline-block'
                      : idx < currentSyllableIndex
                      ? 'text-gray-500'
                      : 'text-white'
                  }`}
                >
                  {syllable}
                  {idx === currentSyllableIndex && (
                    <span className="animate-bounce inline-block ml-1">●</span>
                  )}
                </span>
              ))}
            </div>

            {/* Pitch Guide Visual */}
            {pitchGuideEnabled && (
              <div className="pitch-guide mt-8">
                <div className="flex items-center justify-center gap-4 text-2xl font-mono">
                  {lyrics[currentLyricIndex].notes.map((note, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-2 rounded ${
                        idx === currentSyllableIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][note % 12]}
                      {Math.floor(note / 12) - 1}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="progress-bar w-full max-w-4xl mb-8">
          <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Pitch Indicator */}
        {isRecording && currentPitch && targetPitch && (
          <div className="pitch-indicator mb-8">
            <div className="text-center mb-2 text-sm text-gray-400">
              Pitch Accuracy
            </div>
            <div className="relative w-64 h-8 bg-gray-800 rounded-full overflow-hidden">
              {/* Center line (target) */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white" />

              {/* Current pitch indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-100"
                style={{
                  left: `calc(50% + ${getPitchDeviation() * 2}px)`,
                  backgroundColor: getPitchColor()
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Flat</span>
              <span style={{ color: getPitchColor() }}>
                {Math.abs(getPitchDeviation()).toFixed(0)} cents
              </span>
              <span>Sharp</span>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="controls flex items-center gap-4">
          {!isRecording ? (
            <>
              <button
                onClick={handleStartRecording}
                disabled={!initialized}
                className="record-button w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 flex items-center justify-center text-3xl transition-all hover:scale-110 active:scale-95"
              >
                🔴
              </button>

              {recordedTakes.length > 0 && (
                <>
                  <button
                    onClick={handlePlayback}
                    disabled={isPreviewing}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:bg-gray-700 transition-colors"
                  >
                    {isPreviewing ? '⏸ Playing...' : '▶️ Play Back'}
                  </button>

                  <button
                    onClick={handleKeepTake}
                    className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                  >
                    ✓ Keep Take
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={handleStopRecording}
              className="stop-button w-24 h-24 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-3xl transition-all"
            >
              ⏹
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="settings-panel p-6 bg-gray-800 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-8">

          {/* Mix Controls */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-400">MIX</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm">🎤 Your Voice</label>
                  <span className="text-sm text-gray-400">{Math.round(monitorVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={monitorVolume * 100}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value) / 100;
                    setMonitorVolume(vol);
                    audioEngine.setMonitorVolume(vol);
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm">🎹 Instrumental</label>
                  <span className="text-sm text-gray-400">{Math.round(instrumentalVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={instrumentalVolume * 100}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value) / 100;
                    setInstrumentalVolume(vol);
                    audioEngine.setInstrumentalVolume(vol);
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm">🎵 Pitch Guide</label>
                  <span className="text-sm text-gray-400">{Math.round(guideVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={guideVolume * 100}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value) / 100;
                    setGuideVolume(vol);
                    audioEngine.setGuideVolume(vol);
                  }}
                  disabled={!pitchGuideEnabled}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Pitch Guide Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-400">PITCH GUIDE</h3>

            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pitchGuideEnabled}
                  onChange={(e) => setPitchGuideEnabled(e.target.checked)}
                  className="w-5 h-5"
                />
                <span>Enable pitch guide tone</span>
              </label>

              <div className="text-sm text-gray-400">
                A subtle reference tone will play in your left ear to help you stay on pitch.
              </div>
            </div>
          </div>

          {/* Auto-Tune Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-400">AUTO-TUNE</h3>

            <div className="space-y-2">
              {(['off', 'light', 'medium', 'heavy'] as const).map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="autotune"
                    value={mode}
                    checked={autoTuneMode === mode}
                    onChange={() => setAutoTuneMode(mode)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{mode}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
