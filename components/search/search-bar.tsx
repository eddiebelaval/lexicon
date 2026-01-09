'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';
import type { GraphSearchResult } from '@/lib/search';

interface SearchBarProps {
  universeId: string;
  onSearch: (query: string) => void;
  onResults: (results: GraphSearchResult & { query: string }) => void;
  className?: string;
}

/**
 * SearchBar - Enhanced search input with debouncing and loading states
 *
 * Features:
 * - Debounced search (300ms delay)
 * - Loading indicator
 * - Clear button
 * - Keyboard shortcut hint
 */
export function SearchBar({
  universeId,
  onSearch,
  onResults,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onResults({ query: '', entities: [], relationships: [] });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      onSearch(searchQuery);

      const response = await fetch(
        `/api/search?universeId=${encodeURIComponent(universeId)}&q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();

      if (result.success) {
        onResults({
          query: searchQuery,
          entities: result.data.entities,
          relationships: result.data.relationships,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      onResults({ query: searchQuery, entities: [], relationships: [] });
    } finally {
      setIsLoading(false);
    }
  }, [universeId, onSearch, onResults]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    onResults({ query: '', entities: [], relationships: [] });
    onSearch('');
  };

  // Keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('search-input');
        if (input) {
          input.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
        <input
          id="search-input"
          type="text"
          placeholder="Search entities, relationships..."
          value={query}
          onChange={handleChange}
          className="w-full h-10 pl-9 pr-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder:text-[#666] text-sm focus:outline-none focus:border-[#38bdf8] transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#666]" />
        )}
        {!isLoading && query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1 text-xs text-[#666]">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border border-[#333] bg-[#1f1f1f] px-1.5 font-mono text-[10px] font-medium text-[#888]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
