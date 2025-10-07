// Track visualization component
import type { Track } from '../../core/pattern/GenreEngine';

interface TrackViewProps {
  tracks: Track[];
}

export function TrackView({ tracks }: TrackViewProps) {
  return (
    <div className="track-view p-4">
      <h2 className="text-xl font-bold mb-4">Tracks</h2>
      <div className="grid grid-cols-1 gap-2">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="track-row flex items-center gap-4 p-3 bg-gray-100 rounded-lg"
          >
            <div className="track-label font-semibold w-24">
              Track {index + 1}
            </div>
            <div className="track-name flex-1">
              {track.name}
            </div>
            <div className="clips-indicator flex gap-1">
              {track.clips.map(clip => (
                <div
                  key={clip.id}
                  className="w-8 h-8 bg-blue-500 rounded"
                  title={`Clip ${clip.id}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
