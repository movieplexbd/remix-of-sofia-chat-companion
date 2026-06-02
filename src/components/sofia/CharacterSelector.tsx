import { SofiaCharacter } from '../../types/sofia';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { HeartHandshake, Users, Heart, Star, Sparkles } from 'lucide-react';

interface CharacterSelectorProps {
  characters: SofiaCharacter[];
  selectedId: string | null;
  onSelect: (character: SofiaCharacter) => void;
}

const getIcon = (name: string) => {
  if (name.includes('বান্ধবী')) return <Users className="w-5 h-5" />;
  if (name.includes('বউ')) return <Heart className="w-5 h-5 text-red-500" />;
  if (name.includes('গার্লফ্রেন্ড')) return <HeartHandshake className="w-5 h-5 text-pink-500" />;
  if (name.includes('মামি')) return <Star className="w-5 h-5 text-yellow-500" />;
  return <Sparkles className="w-5 h-5" />;
};

export default function CharacterSelector({ characters, selectedId, onSelect }: CharacterSelectorProps) {
  return (
    <div className="px-4 py-3 border-b bg-secondary/20 overflow-x-auto no-scrollbar">
      <div className="flex gap-3 min-w-max">
        {characters.map((char) => (
          <Button
            key={char.id}
            variant={selectedId === char.id ? "default" : "outline"}
            className={`flex items-center gap-2 rounded-full px-5 py-2 transition-all ${
              selectedId === char.id ? 'shadow-md scale-105' : 'hover:bg-secondary'
            }`}
            onClick={() => onSelect(char)}
          >
            {getIcon(char.name)}
            <span className="font-medium">{char.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
