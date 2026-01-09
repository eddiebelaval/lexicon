'use client';

import type { Citation } from '@/types/chat';
import { ExternalLink, MapPin, User, Calendar, Box, Users } from 'lucide-react';

interface CitationDetailProps {
  citation: Citation;
  onClose?: () => void;
}

/**
 * Citation detail panel/modal
 * - Shows full information about a citation
 * - Different displays for entity, relationship, and web citations
 * - Click to navigate to entity/relationship page
 *
 * Usage:
 * <CitationDetail
 *   citation={selectedCitation}
 *   onClose={() => setSelectedCitation(null)}
 * />
 */
export function CitationDetail({ citation, onClose }: CitationDetailProps) {
  const renderIcon = () => {
    if (citation.type === 'entity') {
      switch (citation.entityType) {
        case 'character':
          return <User className="w-5 h-5" />;
        case 'location':
          return <MapPin className="w-5 h-5" />;
        case 'event':
          return <Calendar className="w-5 h-5" />;
        case 'object':
          return <Box className="w-5 h-5" />;
        case 'faction':
          return <Users className="w-5 h-5" />;
        default:
          return <Box className="w-5 h-5" />;
      }
    }
    return <ExternalLink className="w-5 h-5" />;
  };

  const getTypeColor = () => {
    if (citation.type === 'entity') {
      switch (citation.entityType) {
        case 'character':
          return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
        case 'location':
          return 'text-green-400 bg-green-500/20 border-green-500/40';
        case 'event':
          return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
        case 'object':
          return 'text-pink-400 bg-pink-500/20 border-pink-500/40';
        case 'faction':
          return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
        default:
          return 'text-vhs bg-vhs/20 border-vhs/40';
      }
    }
    if (citation.type === 'relationship') {
      return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
    }
    return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
  };

  return (
    <div className="bg-surface-secondary border border-panel-border rounded-lg p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${getTypeColor()}`}>
          {renderIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate">{citation.label}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getTypeColor()}`}>
              {citation.type}
            </span>
            {citation.entityType && (
              <span className="text-xs text-gray-400">{citation.entityType}</span>
            )}
            {citation.relationshipType && (
              <span className="text-xs text-gray-400">{citation.relationshipType}</span>
            )}
          </div>
        </div>
      </div>

      {/* Entity details */}
      {citation.type === 'entity' && citation.entityId && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            Entity ID: <span className="font-mono text-gray-300">{citation.entityId}</span>
          </div>
          <button
            onClick={() => {
              // Navigate to entity page
              window.location.href = `/entities/${citation.entityId}`;
            }}
            className="w-full px-3 py-2 rounded-lg bg-vhs/20 text-vhs border border-vhs/40 hover:bg-vhs/30 hover:shadow-vhs-sm transition-all duration-200 text-sm font-medium"
          >
            View Entity Details
          </button>
        </div>
      )}

      {/* Relationship details */}
      {citation.type === 'relationship' && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            <span className="font-medium text-white">{citation.fromEntity}</span>
            <span className="mx-2 text-vhs">→</span>
            <span className="font-medium text-white">{citation.toEntity}</span>
          </div>
          {citation.relationshipId && (
            <div className="text-xs text-gray-500 font-mono">
              {citation.relationshipId}
            </div>
          )}
          {citation.relationshipId && (
            <button
              onClick={() => {
                // Navigate to relationship page
                window.location.href = `/relationships/${citation.relationshipId}`;
              }}
              className="w-full px-3 py-2 rounded-lg bg-vhs/20 text-vhs border border-vhs/40 hover:bg-vhs/30 hover:shadow-vhs-sm transition-all duration-200 text-sm font-medium"
            >
              View Relationship Details
            </button>
          )}
        </div>
      )}

      {/* Web citation details */}
      {citation.type === 'web' && (
        <div className="space-y-2">
          {citation.snippet && (
            <p className="text-sm text-gray-300 line-clamp-3">{citation.snippet}</p>
          )}
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-vhs/20 text-vhs border border-vhs/40 hover:bg-vhs/30 hover:shadow-vhs-sm transition-all duration-200 text-sm font-medium"
            >
              Open Source
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
