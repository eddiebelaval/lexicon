'use client';

import { useState } from 'react';
import { CitationChip } from './CitationChip';
import { EntityPreview } from './EntityPreview';
import type { Citation } from '@/types/chat';

/**
 * Demo component showing CitationChip and EntityPreview in action
 *
 * This component demonstrates:
 * - Inline citation rendering
 * - Different citation types (entity, web, relationship)
 * - Entity preview on click
 * - Web link handling
 *
 * @example
 * ```tsx
 * import { CitationDemo } from '@/components/chat/CitationDemo';
 *
 * <CitationDemo />
 * ```
 */
export function CitationDemo() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Example citations
  const citations: Citation[] = [
    {
      id: '1',
      type: 'entity',
      label: 'D\'Artagnan',
      entityId: 'character-dartagnan',
      entityType: 'character',
    },
    {
      id: '2',
      type: 'entity',
      label: 'Paris',
      entityId: 'location-paris',
      entityType: 'location',
    },
    {
      id: '3',
      type: 'relationship',
      label: 'Friendship',
      relationshipId: 'rel-musketeers',
      fromEntity: 'D\'Artagnan',
      toEntity: 'The Three Musketeers',
      relationshipType: 'member_of',
    },
    {
      id: '4',
      type: 'web',
      label: 'Wikipedia',
      url: 'https://en.wikipedia.org/wiki/The_Three_Musketeers',
      title: 'The Three Musketeers - Wikipedia',
      snippet: 'A historical adventure novel by Alexandre Dumas',
    },
  ];

  const handleCitationClick = (citation: Citation) => {
    console.log('Citation clicked:', citation);

    if (citation.type === 'entity' && citation.entityId) {
      setSelectedEntityId(citation.entityId);
    }
    // Web citations automatically open in new tab via CitationChip
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-100">Citation Components Demo</h1>
        <p className="text-zinc-400">
          Click on citations to see different behaviors. Entity citations open a preview panel,
          web citations open in a new tab.
        </p>
      </div>

      {/* Demo Section 1: Entity Citations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Entity Citations</h2>
        <div className="p-6 rounded-lg bg-surface-secondary border border-vhs/20">
          <p className="text-zinc-100 leading-relaxed">
            In 1625, young{' '}
            <CitationChip
              citation={citations[0]}
              index={1}
              onClick={handleCitationClick}
            />
            {' '}left his home in Gascony and traveled to{' '}
            <CitationChip
              citation={citations[1]}
              index={2}
              onClick={handleCitationClick}
            />
            {' '}seeking adventure and fortune.
          </p>
        </div>
        <p className="text-sm text-zinc-400">
          ↑ Click the numbered citations to open entity details
        </p>
      </div>

      {/* Demo Section 2: Mixed Citations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Mixed Citation Types</h2>
        <div className="p-6 rounded-lg bg-surface-secondary border border-vhs/20">
          <p className="text-zinc-100 leading-relaxed">
            D&apos;Artagnan{' '}
            <CitationChip
              citation={citations[0]}
              index={1}
              onClick={handleCitationClick}
            />
            {' '}eventually became part of{' '}
            <CitationChip
              citation={citations[2]}
              index={3}
              onClick={handleCitationClick}
            />
            {' '}the legendary Musketeers. According to historical sources{' '}
            <CitationChip
              citation={citations[3]}
              index={4}
              onClick={handleCitationClick}
            />
            , the novel was published in 1844.
          </p>
        </div>
        <div className="text-sm text-zinc-400 space-y-1">
          <p>↑ This paragraph contains:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Character citation (opens preview)</li>
            <li>Relationship citation (shows connection)</li>
            <li>Web citation (opens Wikipedia)</li>
          </ul>
        </div>
      </div>

      {/* Demo Section 3: Citation Types Reference */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Citation Types Reference</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Entity Types */}
          <div className="p-4 rounded-lg bg-surface-secondary border border-vhs/20">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Entity Types</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CitationChip
                  citation={{
                    id: 'demo-char',
                    type: 'entity',
                    label: 'Character',
                    entityType: 'character',
                  }}
                  index={1}
                />
                <span className="text-sm text-zinc-400">Character</span>
              </div>
              <div className="flex items-center gap-2">
                <CitationChip
                  citation={{
                    id: 'demo-loc',
                    type: 'entity',
                    label: 'Location',
                    entityType: 'location',
                  }}
                  index={2}
                />
                <span className="text-sm text-zinc-400">Location</span>
              </div>
              <div className="flex items-center gap-2">
                <CitationChip
                  citation={{
                    id: 'demo-event',
                    type: 'entity',
                    label: 'Event',
                    entityType: 'event',
                  }}
                  index={3}
                />
                <span className="text-sm text-zinc-400">Event</span>
              </div>
              <div className="flex items-center gap-2">
                <CitationChip
                  citation={{
                    id: 'demo-obj',
                    type: 'entity',
                    label: 'Object',
                    entityType: 'object',
                  }}
                  index={4}
                />
                <span className="text-sm text-zinc-400">Object</span>
              </div>
              <div className="flex items-center gap-2">
                <CitationChip
                  citation={{
                    id: 'demo-faction',
                    type: 'entity',
                    label: 'Faction',
                    entityType: 'faction',
                  }}
                  index={5}
                />
                <span className="text-sm text-zinc-400">Faction</span>
              </div>
            </div>
          </div>

          {/* Other Types */}
          <div className="p-4 rounded-lg bg-surface-secondary border border-vhs/20">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Other Types</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CitationChip
                  citation={{
                    id: 'demo-rel',
                    type: 'relationship',
                    label: 'Relationship',
                  }}
                  index={6}
                />
                <span className="text-sm text-zinc-400">Relationship</span>
              </div>
              <div className="flex items-center gap-2">
                <CitationChip
                  citation={{
                    id: 'demo-web',
                    type: 'web',
                    label: 'Web Source',
                    url: 'https://example.com',
                  }}
                  index={7}
                />
                <span className="text-sm text-zinc-400">Web Source</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 rounded-lg bg-vhs/10 border border-vhs/30">
        <h3 className="text-sm font-semibold text-vhs mb-2">How to Use</h3>
        <ul className="text-sm text-zinc-300 space-y-1">
          <li>• Click entity citations (1, 2) to open the entity preview panel</li>
          <li>• Click web citations (4) to open the source in a new tab</li>
          <li>• Use keyboard navigation (Tab) to focus on citations</li>
          <li>• Press Enter or Space to activate a focused citation</li>
          <li>• Click the backdrop or X button to close the preview panel</li>
        </ul>
      </div>

      {/* Entity Preview Panel */}
      {selectedEntityId && (
        <EntityPreview
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
        />
      )}
    </div>
  );
}

/**
 * Component Features:
 * - Interactive demonstration of all citation types
 * - Visual reference for different entity type icons
 * - Usage instructions for developers
 * - Fully functional with preview panel
 *
 * To use this in your app:
 * 1. Import the component
 * 2. Add to a page route (e.g., /demo/citations)
 * 3. Make sure entity API endpoints are available
 */
