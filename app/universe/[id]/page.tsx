'use client';

/**
 * Universe View - Main workspace for a story universe
 *
 * Features:
 * - Search bar with debouncing (primary action)
 * - Entity list (sidebar)
 * - Entity detail with relationships (right panel)
 * - Graph visualization (main area)
 * - Search results panel with AI answers
 * - CSV import functionality
 */

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntityList, EntityDetail, EntityForm } from '@/components/entities';
import { GraphViewer } from '@/components/graph';
import { SearchBar, SearchResults } from '@/components/search';
import { CSVImportDialog } from '@/components/import';
import type { Entity, GraphNode, RelationshipWithEntities, SynthesizedAnswer, SearchSource } from '@/types';
import type { GraphSearchResult } from '@/lib/search';
import type { DisplayEntity } from '@/components/entities/entity-card';

export default function UniversePage() {
  const params = useParams();
  const universeId = params.id as string;

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
      }
    } catch (error) {
      console.error('Failed to fetch entity details:', error);
    }
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to fetch entity:', error);
    }
  }, []);

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
        }
      } catch (error) {
        console.error('Failed to fetch entity:', error);
      }
    }
  }, []);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Search */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-lexicon-600 shrink-0">
              Lexicon
            </h1>

            {/* Search Bar - Primary Action */}
            <div className="flex-1 max-w-2xl">
              <SearchBar
                universeId={universeId}
                onSearch={handleSearch}
                onResults={handleSearchResults}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* AI Mode Toggle */}
              <Button
                variant={aiMode ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleAiMode}
                className={aiMode ? 'bg-lexicon-600 hover:bg-lexicon-700' : ''}
              >
                AI
              </Button>

              {/* CSV Import Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>

              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {universeId}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Entity List */}
        <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col">
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
          <div className="flex-1 relative bg-muted/10 p-4 overflow-hidden">
            <GraphViewer
              key={graphKey}
              universeId={universeId}
              onNodeSelect={handleGraphNodeSelect}
            />
          </div>

          {/* Search Results Panel */}
          <div className="h-1/3 border-t bg-background p-4 overflow-auto">
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
          <aside className="w-80 border-l hidden lg:flex flex-col">
            <EntityDetail
              entity={selectedEntity}
              onEdit={handleEditEntity}
              onDelete={handleDeleteEntity}
              onClose={handleCloseDetail}
              onSelectRelatedEntity={setSelectedEntity}
            />
          </aside>
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
