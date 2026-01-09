'use client';

import { useEffect, useState } from 'react';
import {
  Clock,
  Bookmark,
  Search,
  MapPin,
  Users,
  Calendar,
  Package,
  Star,
} from 'lucide-react';

interface RecentEntity {
  id: string;
  name: string;
  type: 'character' | 'location' | 'event' | 'object' | 'faction';
  viewedAt: Date;
  description?: string;
}

interface SavedSearch {
  id: string;
  query: string;
  resultCount: number;
  savedAt: Date;
}

interface DiscoverPanelProps {
  universeId: string;
  onEntityClick: (entityId: string) => void;
}

/**
 * Discovery features:
 * - Recent entities (auto-tracked from views)
 * - Saved searches (bookmarked queries)
 * - Quick entity type filters
 *
 * Features:
 * - Auto-refresh recent entities
 * - Click to navigate
 * - Type badges with colors
 * - Time formatting
 *
 * @example
 * <DiscoverPanel
 *   universeId="universe-123"
 *   onEntityClick={(id) => router.push(`/entity/${id}`)}
 * />
 */
export function DiscoverPanel({ universeId, onEntityClick }: DiscoverPanelProps) {
  const [recentEntities, setRecentEntities] = useState<RecentEntity[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoverData();
  }, [universeId]);

  const fetchDiscoverData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const [entitiesRes, searchesRes] = await Promise.all([
      //   fetch(`/api/entities/recent?universeId=${universeId}`),
      //   fetch(`/api/searches/saved?universeId=${universeId}`),
      // ]);

      // Mock data for now
      setRecentEntities([
        {
          id: 'entity-1',
          name: "D'Artagnan",
          type: 'character',
          viewedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          description: 'Young Gascon nobleman',
        },
        {
          id: 'entity-2',
          name: 'Paris',
          type: 'location',
          viewedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          id: 'entity-3',
          name: 'The Siege of La Rochelle',
          type: 'event',
          viewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
      ]);

      setSavedSearches([
        {
          id: 'search-1',
          query: 'Cardinal Richelieu schemes',
          resultCount: 15,
          savedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
        {
          id: 'search-2',
          query: 'Musketeers relationships',
          resultCount: 23,
          savedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
        },
      ]);
    } catch (err) {
      console.error('Error fetching discover data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (type: RecentEntity['type']) => {
    switch (type) {
      case 'character':
        return Users;
      case 'location':
        return MapPin;
      case 'event':
        return Calendar;
      case 'object':
        return Package;
      case 'faction':
        return Star;
      default:
        return Package;
    }
  };

  const getEntityColor = (type: RecentEntity['type']) => {
    switch (type) {
      case 'character':
        return 'text-graph-character';
      case 'location':
        return 'text-graph-location';
      case 'event':
        return 'text-graph-event';
      case 'object':
        return 'text-graph-object';
      case 'faction':
        return 'text-graph-faction';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vhs"></div>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-4">
      {/* Recent Entities */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300">
          <Clock className="w-4 h-4" />
          <span>Recent</span>
        </div>

        {recentEntities.length === 0 ? (
          <div className="px-2 py-4 text-xs text-gray-500 text-center">
            No recent entities
          </div>
        ) : (
          <div className="space-y-1">
            {recentEntities.map((entity) => {
              const Icon = getEntityIcon(entity.type);
              const color = getEntityColor(entity.type);

              return (
                <button
                  key={entity.id}
                  onClick={() => onEntityClick(entity.id)}
                  className="w-full flex items-start gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-sidebar-hover rounded transition-colors group text-left"
                >
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{entity.name}</div>
                    {entity.description && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {entity.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 capitalize">
                        {entity.type}
                      </span>
                      <span className="text-xs text-gray-700">•</span>
                      <span className="text-xs text-gray-600">
                        {formatTimeAgo(entity.viewedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved Searches */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300">
          <Bookmark className="w-4 h-4" />
          <span>Saved Searches</span>
        </div>

        {savedSearches.length === 0 ? (
          <div className="px-2 py-4 text-xs text-gray-500 text-center">
            No saved searches
          </div>
        ) : (
          <div className="space-y-1">
            {savedSearches.map((search) => (
              <button
                key={search.id}
                className="w-full flex items-start gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-sidebar-hover rounded transition-colors group text-left"
              >
                <Search className="w-4 h-4 mt-0.5 flex-shrink-0 text-vhs" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{search.query}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">
                      {search.resultCount} results
                    </span>
                    <span className="text-xs text-gray-700">•</span>
                    <span className="text-xs text-gray-600">
                      {formatTimeAgo(search.savedAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="space-y-2 pt-2 border-t border-sidebar-border">
        <div className="px-2 py-1.5 text-sm font-medium text-gray-300">
          Quick Filters
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { type: 'character', label: 'Characters', icon: Users, color: 'text-graph-character' },
            { type: 'location', label: 'Locations', icon: MapPin, color: 'text-graph-location' },
            { type: 'event', label: 'Events', icon: Calendar, color: 'text-graph-event' },
            { type: 'object', label: 'Objects', icon: Package, color: 'text-graph-object' },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.type}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white bg-panel-bg hover:bg-sidebar-hover border border-sidebar-border rounded transition-colors"
              >
                <Icon className={`w-3.5 h-3.5 ${filter.color}`} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
