// EmptyState Component - Engaging welcome screen when nothing is connected

import { useState, useEffect } from 'react';

interface EmptyStateProps {
  connected: boolean;
  hasDevices: boolean;
  onConnect: () => void;
  onShowHelp: () => void;
}

export function EmptyState({ connected, hasDevices, onConnect, onShowHelp }: EmptyStateProps) {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    "Connect your Roland MV-1 to start creating music instantly",
    "Generate complete songs in Trap, Techno, or House genres",
    "Record professional vocals with real-time auto-tune",
    "Control your hardware directly from your browser",
    "No software installation required - works anywhere!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  if (connected) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-8">
        {/* Connected State */}
        <div className="text-center">
          <div className="text-8xl mb-6 animate-pulse">🎹</div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Device Connected!
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Ready to make music? Select a genre to generate your first song.
          </p>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full border border-gray-700">
          <h3 className="text-xl font-semibold mb-6 text-center">🚀 Quick Start</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎵</div>
              <h4 className="font-semibold mb-2">1. Choose Genre</h4>
              <p className="text-sm text-gray-400">Pick Trap, Techno, or House from the sidebar</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎲</div>
              <h4 className="font-semibold mb-2">2. Generate Song</h4>
              <p className="text-sm text-gray-400">Click "Generate New" to create a complete arrangement</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">▶️</div>
              <h4 className="font-semibold mb-2">3. Send to MV-1</h4>
              <p className="text-sm text-gray-400">Click "Send to MV-1" to load patterns on your hardware</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-8">
      {/* Main Welcome */}
      <div className="text-center">
        <div className="text-8xl mb-6 animate-bounce">🎵</div>
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Welcome to tablature.io
        </h2>
        <p className="text-xl text-gray-300 mb-2">
          The future of hardware music production
        </p>
        <p className="text-lg text-gray-400 mb-8">
          Connect your MIDI device to start creating music with AI
        </p>
      </div>

      {/* Rotating Tips */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 max-w-2xl w-full border border-gray-700">
        <div className="text-center">
          <div className="text-2xl mb-3">💡</div>
          <h3 className="text-lg font-semibold mb-3">Did you know?</h3>
          <p className="text-gray-300 transition-all duration-500 ease-in-out">
            {tips[currentTip]}
          </p>
          <div className="flex justify-center mt-4 space-x-2">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentTip ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 max-w-2xl w-full border border-gray-700">
        <div className="text-center">
          <div className="text-4xl mb-4">
            {hasDevices ? '🔌' : '🔍'}
          </div>
          <h3 className="text-xl font-semibold mb-3">
            {hasDevices ? 'MIDI Device Found!' : 'Looking for MIDI Devices...'}
          </h3>
          <p className="text-gray-300 mb-6">
            {hasDevices 
              ? 'Select your device from the dropdown and click Connect to get started.'
              : 'Make sure your MIDI device is connected and try refreshing the device list.'
            }
          </p>
          
          {hasDevices && (
            <button
              onClick={onConnect}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Connect Device
            </button>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 max-w-2xl w-full border border-blue-600/30">
        <div className="text-center">
          <div className="text-3xl mb-3">❓</div>
          <h3 className="text-lg font-semibold mb-3">Need Help Getting Started?</h3>
          <p className="text-gray-300 mb-4">
            Check out our comprehensive setup guide for Roland MV-1 and other MIDI devices.
          </p>
          <button
            onClick={onShowHelp}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Open Help Guide
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-700">
          <div className="text-4xl mb-3">🤖</div>
          <h4 className="font-semibold mb-2">AI-Powered</h4>
          <p className="text-sm text-gray-400">Generate complete songs with intelligent algorithms</p>
        </div>
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-700">
          <div className="text-4xl mb-3">🌐</div>
          <h4 className="font-semibold mb-2">Web-Based</h4>
          <p className="text-sm text-gray-400">No downloads required, works in any browser</p>
        </div>
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-700">
          <div className="text-4xl mb-3">🎛️</div>
          <h4 className="font-semibold mb-2">Hardware Control</h4>
          <p className="text-sm text-gray-400">Direct MIDI control of your music hardware</p>
        </div>
      </div>
    </div>
  );
}
