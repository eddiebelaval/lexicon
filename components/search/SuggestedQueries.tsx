'use client';

import { Sparkles, Users, MapPin, Calendar, Link2, BookOpen } from 'lucide-react';

interface SuggestedQuery {
  id: string;
  text: string;
  icon: React.ReactNode;
}

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  suggestions?: SuggestedQuery[];
}

const DEFAULT_SUGGESTIONS: SuggestedQuery[] = [
  {
    id: 'characters',
    text: 'Who are the main characters?',
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    id: 'conflicts',
    text: 'What conflicts exist?',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  {
    id: 'locations',
    text: 'Map the key locations',
    icon: <MapPin className="w-3.5 h-3.5" />,
  },
  {
    id: 'events',
    text: 'What major events shaped the story?',
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
  {
    id: 'relationships',
    text: 'Show character relationships',
    icon: <Link2 className="w-3.5 h-3.5" />,
  },
  {
    id: 'lore',
    text: 'Summarize the lore',
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
];

export function SuggestedQueries({
  onSelect,
  suggestions = DEFAULT_SUGGESTIONS,
}: SuggestedQueriesProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <p className="text-sm text-[#666] mb-3 text-center">Try asking:</p>

      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.text)}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
            className="group flex items-center gap-2 px-4 py-2 bg-[#141414] hover:bg-[#1a1a1a] border border-[#252525] hover:border-[#38bdf8]/30 rounded-xl text-sm text-[#999] hover:text-white transition-all duration-200 hover:-translate-y-0.5 animate-fade-in-up"
          >
            <span className="text-[#555] group-hover:text-[#38bdf8] transition-colors duration-200">
              {suggestion.icon}
            </span>
            <span>{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
