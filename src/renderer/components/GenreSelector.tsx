// Genre selection component
import { useState } from 'react';

interface GenreSelectorProps {
  onGenreSelect: (genre: string) => void;
}

export function GenreSelector({ onGenreSelect }: GenreSelectorProps) {
  const [selectedGenre, setSelectedGenre] = useState('trap');
  
  const genres = ['Trap', 'Techno', 'House', 'Hip-Hop', 'D&B'];
  
  const handleSelect = (genre: string) => {
    setSelectedGenre(genre.toLowerCase());
    onGenreSelect(genre.toLowerCase());
  };
  
  return (
    <div className="genre-selector p-4">
      <h2 className="text-xl font-bold mb-4">Select Genre</h2>
      <div className="space-y-2">
        {genres.map(genre => (
          <button
            key={genre}
            onClick={() => handleSelect(genre)}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              selectedGenre === genre.toLowerCase()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
