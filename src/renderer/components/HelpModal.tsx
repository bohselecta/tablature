// Help Modal Component with MV-1 Setup Instructions

import { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState('setup');

  if (!isOpen) return null;

  const sections = [
    { id: 'setup', title: 'MV-1 Setup', icon: '🔧' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔍' },
    { id: 'features', title: 'Features', icon: '✨' },
    { id: 'browser', title: 'Browser Support', icon: '🌐' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="modal-header">
          <h2 className="modal-title">tablature.io Help Center</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close help dialog"
          >
            ×
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-800 p-4 border-r border-gray-600">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'setup' && <SetupGuide />}
            {activeSection === 'troubleshooting' && <TroubleshootingGuide />}
            {activeSection === 'features' && <FeaturesGuide />}
            {activeSection === 'browser' && <BrowserGuide />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4">🎹 Roland MV-1 Setup Guide</h3>
        <p className="text-gray-300 mb-6">
          Follow these steps to get your Roland Verselab MV-1 working with tablature.io
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Step 1: Install Roland Drivers</h4>
          <div className="space-y-2 text-sm">
            <p>• Download the latest Roland USB driver from:</p>
            <a 
              href="https://www.roland.com/us/support/by_product/verselab_mv-1/updates_drivers/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Roland MV-1 Support Page
            </a>
            <p>• Install the driver before connecting your MV-1</p>
            <p>• Restart your computer after installation</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Step 2: Connect Your MV-1</h4>
          <div className="space-y-2 text-sm">
            <p>• Connect MV-1 to your computer via USB cable</p>
            <p>• Power on the MV-1</p>
            <p>• Wait for Windows/Mac to recognize the device</p>
            <p>• Check Device Manager (Windows) or Audio MIDI Setup (Mac) to verify connection</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Step 3: Configure MV-1 Settings</h4>
          <div className="space-y-2 text-sm">
            <p>• Press the MENU button on your MV-1</p>
            <p>• Navigate to SYSTEM → MIDI</p>
            <p>• Set MIDI OUT to USB</p>
            <p>• Set MIDI IN to USB</p>
            <p>• Ensure MIDI Clock is set to AUTO or INTERNAL</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Step 4: Connect in tablature.io</h4>
          <div className="space-y-2 text-sm">
            <p>• Open tablature.io in your browser</p>
            <p>• Click "Refresh" to scan for MIDI devices</p>
            <p>• Select "VERSELAB MV-1" from the dropdown</p>
            <p>• Click "Connect"</p>
            <p>• Test the connection with the "Test Note" button</p>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-600/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-blue-400">💡 Pro Tips</h4>
          <div className="space-y-2 text-sm">
            <p>• Keep your MV-1 firmware updated for best compatibility</p>
            <p>• Use a high-quality USB cable for reliable connection</p>
            <p>• Close other music software that might conflict with MIDI</p>
            <p>• If connection fails, try a different USB port</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TroubleshootingGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4">🔍 Troubleshooting Guide</h3>
        <p className="text-gray-300 mb-6">
          Common issues and solutions for MV-1 connection problems
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-red-900/30 border border-red-600/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-red-400">❌ "Device Not Found"</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Solutions:</strong></p>
            <p>• Install/update Roland USB drivers</p>
            <p>• Try a different USB cable or port</p>
            <p>• Restart your computer</p>
            <p>• Check if MV-1 appears in Device Manager (Windows) or Audio MIDI Setup (Mac)</p>
            <p>• Ensure MV-1 is powered on and in USB mode</p>
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-600/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-yellow-400">⚠️ "Connection Failed"</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Solutions:</strong></p>
            <p>• Close other music software (DAWs, MIDI controllers)</p>
            <p>• Check if another application is using the MV-1</p>
            <p>• Try disconnecting and reconnecting the USB cable</p>
            <p>• Restart the MV-1</p>
            <p>• Refresh the browser page and try again</p>
          </div>
        </div>

        <div className="bg-orange-900/30 border border-orange-600/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-orange-400">🔇 "No Sound from MV-1"</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Solutions:</strong></p>
            <p>• Check MV-1 volume levels</p>
            <p>• Ensure headphones/speakers are connected</p>
            <p>• Verify MIDI channels are set correctly</p>
            <p>• Check if MV-1 is in the correct mode (not in USB storage mode)</p>
            <p>• Try the "Test Note" button to verify MIDI is working</p>
          </div>
        </div>

        <div className="bg-purple-900/30 border border-purple-600/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-purple-400">🌐 "Web MIDI Not Supported"</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Solutions:</strong></p>
            <p>• Use Chrome, Firefox, Safari, or Edge (latest versions)</p>
            <p>• Enable Web MIDI in browser settings</p>
            <p>• Try incognito/private browsing mode</p>
            <p>• Disable browser extensions that might block MIDI</p>
            <p>• Update your browser to the latest version</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">📞 Still Having Issues?</h4>
          <div className="space-y-2 text-sm">
            <p>• Check the Roland MV-1 manual for additional troubleshooting</p>
            <p>• Visit the Roland support forums</p>
            <p>• Contact Roland technical support</p>
            <p>• Try using a different computer to isolate the issue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4">✨ tablature.io Features</h3>
        <p className="text-gray-300 mb-6">
          Discover all the powerful features available in tablature.io
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">🎵 AI-Powered Music Generation</h4>
          <div className="space-y-2 text-sm">
            <p>• Generate complete songs in multiple genres (Trap, Techno, House)</p>
            <p>• Intelligent pattern creation with realistic drum programming</p>
            <p>• Automatic song structure with intro, verse, chorus sections</p>
            <p>• Customizable tempo and complexity settings</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">🎛️ Real-Time Hardware Control</h4>
          <div className="space-y-2 text-sm">
            <p>• Send generated patterns directly to your MV-1</p>
            <p>• Control track volume, pan, and mute in real-time</p>
            <p>• Automatic sound selection and channel mapping</p>
            <p>• Pattern synchronization with your hardware</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">🎤 Professional Vocal Recording</h4>
          <div className="space-y-2 text-sm">
            <p>• Real-time pitch detection using advanced YIN algorithm</p>
            <p>• Professional auto-tune processing</p>
            <p>• Karaoke-style pitch guidance with reference tones</p>
            <p>• Multi-take recording with monitoring</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">🎹 Complete MV-1 Integration</h4>
          <div className="space-y-2 text-sm">
            <p>• Access to 4,852+ Roland MV-1 sounds</p>
            <p>• Intelligent track mapping (Kick=Channel 1, Snare=Channel 2, etc.)</p>
            <p>• Advanced SysEx control for deep hardware integration</p>
            <p>• Pattern recording to MV-1 clip slots</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">🌐 Web-Based Convenience</h4>
          <div className="space-y-2 text-sm">
            <p>• No software installation required</p>
            <p>• Works on any device with a modern browser</p>
            <p>• Cross-platform compatibility (Windows, Mac, Linux)</p>
            <p>• Automatic updates and improvements</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4">🌐 Browser Compatibility</h3>
        <p className="text-gray-300 mb-6">
          tablature.io works best with modern browsers that support Web MIDI API
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-green-900/30 border border-green-600/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-green-400">✅ Fully Supported Browsers</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Chrome 80+</strong> - Complete feature support, recommended</p>
            <p><strong>Firefox 75+</strong> - Full MIDI and audio capabilities</p>
            <p><strong>Safari 14+</strong> - Web MIDI API support</p>
            <p><strong>Edge 80+</strong> - Full compatibility</p>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-600/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-blue-400">📱 Mobile Support</h4>
          <div className="space-y-2 text-sm">
            <p><strong>iOS Safari</strong> - Web MIDI API support (iOS 14.5+)</p>
            <p><strong>Android Chrome</strong> - Full feature set</p>
            <p><strong>Note:</strong> MIDI requires USB OTG adapter on mobile devices</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">🔧 Browser Settings</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Enable Web MIDI:</strong></p>
            <p>• Chrome: chrome://flags/#enable-web-midi</p>
            <p>• Firefox: about:config → dom.webmidi.enabled = true</p>
            <p>• Safari: Automatically enabled in supported versions</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">⚠️ Known Limitations</h4>
          <div className="space-y-2 text-sm">
            <p>• Internet Explorer is not supported</p>
            <p>• Older browser versions may have limited functionality</p>
            <p>• Some corporate firewalls may block Web MIDI</p>
            <p>• Mobile browsers require USB OTG for MIDI devices</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">💡 Performance Tips</h4>
          <div className="space-y-2 text-sm">
            <p>• Close unnecessary browser tabs for better performance</p>
            <p>• Use hardware acceleration if available</p>
            <p>• Ensure stable internet connection</p>
            <p>• Disable browser extensions that might interfere</p>
          </div>
        </div>
      </div>
    </div>
  );
}
