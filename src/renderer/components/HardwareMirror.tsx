// Hardware mirror component showing device connection status
interface HardwareMirrorProps {
  deviceName: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function HardwareMirror({ deviceName, connected, onConnect, onDisconnect }: HardwareMirrorProps) {
  return (
    <div className="hardware-mirror p-4">
      <h2 className="text-xl font-bold mb-4">Hardware Connection</h2>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">{deviceName}</span>
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          Status: {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="space-y-2">
        {connected ? (
          <button
            onClick={onDisconnect}
            className="w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect to Device
          </button>
        )}
      </div>
      
      {connected && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <div className="text-sm text-green-800">
            ✓ Device is ready to receive MIDI commands
          </div>
        </div>
      )}
    </div>
  );
}
