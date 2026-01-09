'use client';

import { ExternalLink, User, MapPin, Calendar, Package, Users, Link as LinkIcon } from 'lucide-react';
import type { Citation } from '@/types/chat';
import { MouseEvent } from 'react';

interface CitationChipProps {
  citation: Citation;
  index: number;
  onClick?: (citation: Citation) => void;
}

/**
 * Clickable citation chip displayed inline in AI responses
 *
 * Perplexity-style numbered citations that appear inline with text.
 * - Entity citations show entity type icon
 * - Web citations show external link icon
 * - Relationship citations show connection icon
 * - VHS orange theme with smooth interactions
 *
 * @usage
 * ```tsx
 * <CitationChip
 *   citation={citation}
 *   index={1}
 *   onClick={(c) => setSelectedCitation(c)}
 * />
 * ```
 *
 * @accessibility
 * - Full keyboard navigation
 * - ARIA labels for screen readers
 * - Focus ring indicators
 * - Tooltip on hover
 */
export function CitationChip({ citation, index, onClick }: CitationChipProps) {
  // Icon mapping for citation types
  const getIcon = () => {
    if (citation.type === 'web') {
      return <ExternalLink className="w-3 h-3" />;
    }

    if (citation.type === 'relationship') {
      return <LinkIcon className="w-3 h-3" />;
    }

    // Entity type icons
    switch (citation.entityType) {
      case 'character':
        return <User className="w-3 h-3" />;
      case 'location':
        return <MapPin className="w-3 h-3" />;
      case 'event':
        return <Calendar className="w-3 h-3" />;
      case 'object':
        return <Package className="w-3 h-3" />;
      case 'faction':
        return <Users className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();

    if (citation.type === 'web' && citation.url) {
      // Open web citations in new tab
      window.open(citation.url, '_blank', 'noopener,noreferrer');
    } else {
      // Trigger callback for entity/relationship citations
      onClick?.(citation);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="
        inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5
        bg-vhs/10 hover:bg-vhs/20
        border border-vhs/30 hover:border-vhs/50
        rounded text-vhs
        transition-all duration-200
        hover:scale-105 hover:shadow-vhs-sm
        focus:outline-none focus:ring-2 focus:ring-vhs/50
        cursor-pointer
        group
      "
      title={citation.label}
      aria-label={`Citation ${index + 1}: ${citation.label}`}
    >
      <span className="text-xs font-medium font-mono leading-none">{index + 1}</span>
      <span className="opacity-60 group-hover:opacity-100 transition-opacity">
        {getIcon()}
      </span>
    </button>
  );
}

/**
 * Performance optimizations:
 * - Minimal re-renders (pure functional component)
 * - CSS transitions for smooth animations
 * - Lazy icon rendering based on type
 * - No unnecessary state management
 */
