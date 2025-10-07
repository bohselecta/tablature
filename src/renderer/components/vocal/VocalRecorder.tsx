// Vocal recording component with pitch guide and auto-tune

import { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '../../../core/audio/AudioEngine';
import { PitchDetector } from '../../../core/audio/PitchDetector';

interface VocalRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  instrumentalUrl?: string;
  targetNotes?: { frequency: number; duration: number }[];
}

export function VocalRecorder({
  onRecordingComplete,
  instrumentalUrl,
  targetNotes = []
}: VocalRecorderProps) {
  const [audioEngine, setAudioEngine] = useState<AudioEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [pitchGuideActive, setPitchGuideActive] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(false);

  // Audio settings
  const [monitorVolume, setMonitorVolume] = useState(0.8);
  const [instrumentalVolume, setInstrumentalVolume] = useState(0.6);
  const [guideVolume, setGuideVolume] = useState(0.3);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    initializeAudio();

    return () => {
      if (audioEngine) {
        audioEngine.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioEngine && instrumentalUrl) {
      loadInstrumental();
    }
  }, [audioEngine, instrumentalUrl]);

  const initializeAudio = async () => {
    try {
      const engine = new AudioEngine({
        sampleRate: 44100,
        bufferSize: 256
      });

      await engine.initializeInput();
      analyserRef.current = engine.getAnalyser();
      setAudioEngine(engine);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const loadInstrumental = async () => {
    if (!audioEngine || !instrumentalUrl) return;

    try {
      await audioEngine.loadInstrumental(instrumentalUrl);
    } catch (error) {
      console.error('Failed to load instrumental:', error);
    }
  };

  const startMonitoring = () => {
    if (!audioEngine) return;

    audioEngine.setMonitorVolume(monitorVolume);
    audioEngine.setInstrumentalVolume(instrumentalVolume);
    audioEngine.setGuideVolume(guideVolume);

    audioEngine.startMonitoring(autoTuneEnabled);
    setIsMonitoring(true);

    // Start pitch detection loop
    const detectPitch = () => {
      if (audioEngine && analyserRef.current) {
        const pitch = audioEngine.getCurrentPitch();
        setCurrentPitch(pitch);

        if (pitch && !pitchGuideActive && targetNotes.length > 0) {
          // Start pitch guide for current note
          const currentNote = targetNotes[currentNoteIndex];
          if (currentNote) {
            audioEngine.startPitchGuide(currentNote.frequency);
            setPitchGuideActive(true);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectPitch);
    };

    detectPitch();
  };

  const stopMonitoring = () => {
    if (audioEngine) {
      audioEngine.stopMonitoring();
      audioEngine.stopPitchGuide();
      setIsMonitoring(false);
      setPitchGuideActive(false);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const startRecording = async () => {
    if (!audioEngine) return;

    try {
      await audioEngine.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!audioEngine) return;

    try {
      const audioBlob = await audioEngine.stopRecording();
      setIsRecording(false);

      if (onRecordingComplete) {
        onRecordingComplete(audioBlob);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const toggleAutoTune = () => {
    if (!audioEngine) return;

    if (autoTuneEnabled) {
      audioEngine.stopMonitoring();
      audioEngine.startMonitoring(false);
      setAutoTuneEnabled(false);
    } else {
      audioEngine.configureAutoTune({
        strength: 0.7,
        speed: 40,
        scale: 'minor',
        key: 'C'
      });
      audioEngine.stopMonitoring();
      audioEngine.startMonitoring(true);
      setAutoTuneEnabled(true);
    }
  };

  const playNote = (frequency: number) => {
    if (!audioEngine) return;

    audioEngine.startPitchGuide(frequency);
    setPitchGuideActive(true);

    // Auto-advance to next note after duration
    setTimeout(() => {
      setCurrentNoteIndex(prev => (prev + 1) % targetNotes.length);
      audioEngine.stopPitchGuide();
      setPitchGuideActive(false);
    }, 2000); // 2 seconds per note
  };

  return (
    <div className="vocal-recorder bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Vocal Recording Studio</h2>

      {/* Status Indicators */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">Audio: {isInitialized ? 'Ready' : 'Initializing'}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm">Monitor: {isMonitoring ? 'Active' : 'Off'}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm">Recording: {isRecording ? 'Active' : 'Ready'}</span>
        </div>
      </div>

      {/* Pitch Display */}
      {currentPitch && (
        <div className="mb-6 p-4 bg-gray-700 rounded">
          <div className="text-sm text-gray-300 mb-1">Current Pitch</div>
          <div className="text-lg font-mono">
            {Math.round(currentPitch)} Hz
          </div>
          <div className="text-sm text-gray-400">
            {new PitchDetector({} as any).frequencyToNoteName(currentPitch)}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        {!isMonitoring ? (
          <button
            onClick={startMonitoring}
            disabled={!isInitialized}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            🎧 Start Monitoring
          </button>
        ) : (
          <button
            onClick={stopMonitoring}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors font-semibold"
          >
            ⏹️ Stop Monitoring
          </button>
        )}

        <button
          onClick={toggleAutoTune}
          className={`px-6 py-3 rounded-lg transition-colors font-semibold ${
            autoTuneEnabled
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          ⚡ Auto-Tune: {autoTuneEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Recording Controls */}
      <div className="flex gap-3 mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={!isMonitoring}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            🔴 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      {/* Volume Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-2">Voice Monitor</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={monitorVolume}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setMonitorVolume(value);
              if (audioEngine) audioEngine.setMonitorVolume(value);
            }}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Instrumental</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={instrumentalVolume}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setInstrumentalVolume(value);
              if (audioEngine) audioEngine.setInstrumentalVolume(value);
            }}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Pitch Guide</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={guideVolume}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setGuideVolume(value);
              if (audioEngine) audioEngine.setGuideVolume(value);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Note Guide */}
      {targetNotes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Note Guide</h3>
          <div className="flex gap-2 flex-wrap">
            {targetNotes.map((note, index) => (
              <button
                key={index}
                onClick={() => playNote(note.frequency)}
                className={`px-3 py-2 rounded transition-colors ${
                  index === currentNoteIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {new PitchDetector({} as any).frequencyToNoteName(note.frequency)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-400 bg-gray-700 p-4 rounded">
        <h4 className="font-semibold mb-2">Recording Tips:</h4>
        <ul className="space-y-1">
          <li>• Start monitoring to hear yourself</li>
          <li>• Use pitch guide to match target notes</li>
          <li>• Enable auto-tune for pitch correction</li>
          <li>• Record in a quiet environment</li>
          <li>• Sing close to the microphone</li>
        </ul>
      </div>
    </div>
  );
}
