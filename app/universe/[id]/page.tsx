'use client';

/**
 * Universe View - Main workspace for a story universe
 *
 * Features:
 * - Search bar with debouncing (primary action)
 * - Entity list (sidebar)
 * - Entity detail with relationships (right panel)
 * - Graph visualization (main area) OR Wiki view
 * - Search results panel with AI answers
 * - CSV import functionality
 * - View toggle: Graph vs Wiki
 *
 * Design: ID8Labs dark mode first, Lexicon blue accent
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, X, AlertCircle, BookOpen, Network, FileText, MessageSquare, Home, Clapperboard } from 'lucide-react';
import { EntityList, EntityDetail, EntityForm } from '@/components/entities';
import { GraphViewer } from '@/components/graph';
import { SearchBar, SearchResults } from '@/components/search';
import { CSVImportDialog } from '@/components/import';
import { UniverseWiki } from '@/components/wiki';
import type { Entity, GraphNode, RelationshipWithEntities, SynthesizedAnswer, SearchSource } from '@/types';
import type { GraphSearchResult } from '@/lib/search';
import type { DisplayEntity } from '@/components/entities/entity-card';
import { cn } from '@/lib/utils';

type ViewMode = 'graph' | 'wiki';

export default function UniversePage() {
  const params = useParams();
  const universeId = params.id as string;

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('graph');

  // Universe metadata (for Wiki view)
  const [universeName, setUniverseName] = useState<string>('');
  const [universeDescription, setUniverseDescription] = useState<string>('');

  // Fetch universe metadata
  useEffect(() => {
    async function fetchUniverse() {
      try {
        const response = await fetch(`/api/universes/${universeId}`);
        const data = await response.json();
        if (data.success) {
          setUniverseName(data.data.name || 'Universe');
          setUniverseDescription(data.data.description || '');
        }
      } catch {
        // Silent fail - universe name is optional
      }
    }
    fetchUniverse();
  }, [universeId]);

  // Entity state
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityToEdit, setEntityToEdit] = useState<Entity | undefined>(undefined);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [listKey, setListKey] = useState(0); // Force refresh entity list
  const [graphKey, setGraphKey] = useState(0); // Force refresh graph

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphSearchResult & { query: string }>({
    query: '',
    entities: [],
    relationships: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);

  // AI Search state
  const [aiMode, setAiMode] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<SynthesizedAnswer | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Error state for user feedback
  const [pageError, setPageError] = useState<string | null>(null);

  // Auto-dismiss error after 5 seconds
  const showError = useCallback((message: string) => {
    setPageError(message);
    setTimeout(() => setPageError(null), 5000);
  }, []);

  // Entity handlers
  const handleSelectEntity = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
  }, []);

  const handleCreateEntity = useCallback(() => {
    setEntityToEdit(undefined);
    setShowEntityForm(true);
  }, []);

  const handleEditEntity = useCallback((entity: Entity) => {
    setEntityToEdit(entity);
    setShowEntityForm(true);
  }, []);

  const handleDeleteEntity = useCallback(async (entity: Entity) => {
    if (!confirm(`Are you sure you want to delete "${entity.name}"? This will also remove all its relationships.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/entities/${entity.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSelectedEntity(null);
        setListKey((k) => k + 1); // Refresh list
        setGraphKey((k) => k + 1); // Refresh graph
      } else {
        alert(data.error?.message || 'Failed to delete entity');
      }
    } catch {
      alert('Failed to delete entity');
    }
  }, []);

  const handleEntityFormSuccess = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
    setListKey((k) => k + 1); // Refresh list
    setGraphKey((k) => k + 1); // Refresh graph
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  // Handle graph node selection - fetch full entity data
  const handleGraphNodeSelect = useCallback(async (node: GraphNode | null) => {
    if (!node) {
      setSelectedEntity(null);
      return;
    }

    try {
      const response = await fetch(`/api/entities/${node.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedEntity(data.data);
      } else {
        showError(data.error?.message || 'Failed to load entity details');
      }
    } catch {
      showError('Network error: Could not load entity details');
    }
  }, [showError]);

  // Search handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchLoading(true);
    }
  }, []);

  const handleSearchResults = useCallback((results: GraphSearchResult & { query: string }) => {
    setSearchResults(results);
    setSearchLoading(false);
  }, []);

  // Handle selecting entity from search results - fetch full entity data
  const handleSearchEntitySelect = useCallback(async (entity: DisplayEntity) => {
    try {
      const response = await fetch(`/api/entities/${entity.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedEntity(data.data);
      } else {
        showError(data.error?.message || 'Failed to load entity');
      }
    } catch {
      showError('Network error: Could not load entity');
    }
  }, [showError]);

  // Handle selecting relationship from search results
  const handleSearchRelationshipSelect = useCallback((relationship: RelationshipWithEntities) => {
    // Select the source entity of the relationship
    setSelectedEntity(relationship.source);
  }, []);

  // Handle AI source click - fetch full entity data
  const handleSourceClick = useCallback(async (source: SearchSource) => {
    // If it's an entity source with an entity ID, fetch and select that entity
    if (source.type === 'entity' && source.entityId) {
      try {
        const response = await fetch(`/api/entities/${source.entityId}`);
        const data = await response.json();
        if (data.success) {
          setSelectedEntity(data.data);
        } else {
          showError(data.error?.message || 'Failed to load source entity');
        }
      } catch {
        showError('Network error: Could not load source entity');
      }
    }
  }, [showError]);

  // Toggle AI mode
  const handleToggleAiMode = useCallback(async () => {
    const newMode = !aiMode;
    setAiMode(newMode);

    // If turning on AI mode and we have a query, fetch AI answer
    if (newMode && searchQuery.trim()) {
      setAiLoading(true);
      setAiError(null);

      try {
        const response = await fetch(
          `/api/search?universeId=${encodeURIComponent(universeId)}&q=${encodeURIComponent(searchQuery)}&ai=true`
        );
        const result = await response.json();

        if (result.success && result.data.aiAnswer) {
          setAiAnswer(result.data.aiAnswer);
        } else {
          setAiError('AI search unavailable');
        }
      } catch {
        setAiError('Failed to get AI answer');
      } finally {
        setAiLoading(false);
      }
    } else if (!newMode) {
      setAiAnswer(null);
      setAiError(null);
    }
  }, [aiMode, searchQuery, universeId]);

  // Import handlers
  const handleImportSuccess = useCallback(() => {
    setListKey((k) => k + 1); // Refresh list
    setGraphKey((k) => k + 1); // Refresh graph
    setShowImportDialog(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header with Search */}
      <header
        className="border-b border-[#1a1a1a] sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <BookOpen className="w-5 h-5 text-[#38bdf8] group-hover:text-[#5ccfff] transition-colors" />
              <span className="text-lg font-semibold text-white">Lexicon</span>
            </Link>

            {/* Quick Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#888] hover:text-white hover:bg-[#1f1f1f] transition-all"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                href={`/universe/${universeId}/chat`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#888] hover:text-white hover:bg-[#1f1f1f] transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </Link>
            </nav>

            {/* Search Bar - Primary Action */}
            <div className="flex-1 max-w-2xl">
              <SearchBar
                universeId={universeId}
                onSearch={handleSearch}
                onResults={handleSearchResults}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-surface-secondary rounded-lg p-0.5 border border-[hsl(0,0%,18%)]">
                <button
                  onClick={() => setViewMode('graph')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                    viewMode === 'graph'
                      ? "bg-vhs-900 text-vhs-400 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Graph View"
                >
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">Graph</span>
                </button>
                <button
                  onClick={() => setViewMode('wiki')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                    viewMode === 'wiki'
                      ? "bg-vhs-900 text-vhs-400 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Wiki View"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Wiki</span>
                </button>
                <Link
                  href={`/universe/${universeId}/production`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground"
                  title="Production View"
                >
                  <Clapperboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Production</span>
                </Link>
              </div>

              {/* AI Mode Toggle */}
              <button
                onClick={handleToggleAiMode}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  aiMode
                    ? "bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40"
                    : "bg-[#1f1f1f] text-[#888] border border-[#333] hover:border-[#444]"
                )}
              >
                AI
              </button>

              {/* CSV Import Button */}
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f1f1f] text-[#888] border border-[#333] hover:border-[#444] text-sm font-medium transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {pageError && (
        <div className="bg-red-900/20 border-b border-red-800/30 px-4 py-2 flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm flex-1">{pageError}</span>
          <button
            onClick={() => setPageError(null)}
            className="text-red-500 hover:text-red-400 p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'graph' ? (
          <>
            {/* Sidebar - Entity List */}
            <aside className="w-64 border-r border-[#1a1a1a] bg-[#0d0d0d] hidden md:flex flex-col">
              <EntityList
                key={listKey}
                universeId={universeId}
                onSelectEntity={handleSelectEntity}
                onCreateEntity={handleCreateEntity}
                selectedEntityId={selectedEntity?.id}
              />
            </aside>

            {/* Main Content - Graph + Results */}
            <main className="flex-1 flex flex-col min-w-0">
              {/* Graph Visualization Area */}
              <div className="flex-1 relative bg-[#080808] p-4 overflow-hidden">
                <GraphViewer
                  key={graphKey}
                  universeId={universeId}
                  onNodeSelect={handleGraphNodeSelect}
                />
              </div>

              {/* Search Results Panel */}
              <div className="h-1/3 border-t border-[#1a1a1a] bg-[#0a0a0a] p-4 overflow-auto">
                <SearchResults
                  entities={searchResults.entities}
                  relationships={searchResults.relationships}
                  query={searchResults.query}
                  onSelectEntity={handleSearchEntitySelect}
                  onSelectRelationship={handleSearchRelationshipSelect}
                  loading={searchLoading}
                  aiMode={aiMode}
                  aiAnswer={aiAnswer}
                  aiLoading={aiLoading}
                  aiError={aiError}
                  onSourceClick={handleSourceClick}
                />
              </div>
            </main>

            {/* Right Panel - Entity Detail */}
            {selectedEntity && (
              <aside className="w-80 border-l border-[#1a1a1a] bg-[#0d0d0d] hidden lg:flex flex-col">
                <EntityDetail
                  entity={selectedEntity}
                  onEdit={handleEditEntity}
                  onDelete={handleDeleteEntity}
                  onClose={handleCloseDetail}
                  onSelectRelatedEntity={setSelectedEntity}
                />
              </aside>
            )}
          </>
        ) : (
          /* Wiki View - Full Width Editorial Layout */
          <UniverseWiki
            universeId={universeId}
            universeName={universeName}
            universeDescription={universeDescription}
            onEntityClick={(entity) => {
              setSelectedEntity(entity);
              // Optionally switch to graph view to show detail panel
              // setViewMode('graph');
            }}
          />
        )}
      </div>

      {/* Entity Create/Edit Dialog */}
      <EntityForm
        universeId={universeId}
        entity={entityToEdit}
        open={showEntityForm}
        onOpenChange={setShowEntityForm}
        onSuccess={handleEntityFormSuccess}
      />

      {/* CSV Import Dialog */}
      <CSVImportDialog
        universeId={universeId}
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={handleImportSuccess}
      />
    </div>
  );
}
