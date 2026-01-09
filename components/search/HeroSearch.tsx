'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeroSearchProps {
  placeholder?: string;
  universeId?: string;
  aiMode?: boolean;
  onSearch?: (query: string) => void;
}

export function HeroSearch({
  placeholder = 'Ask anything about your story universe...',
  universeId,
  aiMode: initialAiMode = true,
  onSearch,
}: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [aiMode, setAiMode] = useState(initialAiMode);

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return;

    if (onSearch) {
      onSearch(query);
    } else if (universeId) {
      const params = new URLSearchParams({ q: query });
      if (aiMode) params.append('ai', 'true');
      router.push(`/universe/${universeId}?${params.toString()}`);
    } else {
      router.push(`/dashboard?search=${encodeURIComponent(query)}`);
    }
  }, [query, universeId, aiMode, onSearch, router]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input Container */}
      <div
        className={`
          relative flex items-center gap-3 px-5 py-4
          bg-[#1a1a1a] rounded-2xl
          border transition-all duration-300
          ${isFocused
            ? 'border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.3)]'
            : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
          }
        `}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Search Icon */}
        <Search
          className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
            isFocused ? 'text-[#38bdf8]' : 'text-[#666]'
          }`}
        />

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-white text-lg placeholder:text-[#666] font-sans"
        />

        {/* AI Mode Toggle */}
        <button
          type="button"
          onClick={() => setAiMode(!aiMode)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-sm font-medium transition-all duration-200
            ${aiMode
              ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40'
              : 'bg-[#1f1f1f] text-[#888] border border-[#333] hover:border-[#444]'
            }
          `}
          title={aiMode ? 'AI-powered search enabled' : 'Enable AI-powered search'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI</span>
        </button>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!query.trim()}
          className={`
            p-2.5 rounded-xl transition-all duration-200
            ${query.trim()
              ? 'bg-[#38bdf8] text-[#0a0a0a] hover:bg-[#5ccfff] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]'
              : 'bg-[#1f1f1f] text-[#444] cursor-not-allowed'
            }
          `}
          aria-label="Search"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="mt-3 text-center">
        <span className="text-xs text-[#666]">
          Press{' '}
          <kbd className="px-1.5 py-0.5 mx-1 rounded bg-[#1f1f1f] border border-[#333] text-[#888] font-mono text-[10px]">
            Enter
          </kbd>{' '}
          to search
        </span>
      </div>
    </div>
  );
}
