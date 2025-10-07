// Sound browser component
import { useState } from 'react';

interface Sound {
  id: string;
  name: string;
  category: string;
  bank: number;
  program: number;
}

interface SoundBrowserProps {
  sounds: Sound[];
  onSoundSelect: (sound: Sound) => void;
}

export function SoundBrowser({ sounds, onSoundSelect }: SoundBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', ...new Set(sounds.map(s => s.category))];
  
  const filteredSounds = sounds.filter(sound => {
    const matchesSearch = sound.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || sound.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="sound-browser p-4">
      <h2 className="text-xl font-bold mb-4">Sound Browser</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search sounds..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-lg mb-2"
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {filteredSounds.map(sound => (
          <button
            key={sound.id}
            onClick={() => onSoundSelect(sound)}
            className="text-left p-2 hover:bg-gray-200 rounded"
          >
            <div className="font-medium">{sound.name}</div>
            <div className="text-sm text-gray-600">{sound.category}</div>
            <div className="text-xs text-gray-500">Bank: {sound.bank}, Program: {sound.program}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
