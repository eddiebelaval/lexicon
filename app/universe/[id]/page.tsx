'use client';

/**
 * Universe View - Main workspace for a story universe
 *
 * Features:
 * - Search bar (primary action)
 * - Entity list (sidebar)
 * - Entity detail (right panel)
 * - Graph visualization (main area)
 * - Search results panel
 */

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EntityList, EntityDetail, EntityForm } from '@/components/entities';
import type { Entity } from '@/types';

export default function UniversePage() {
  const params = useParams();
  const universeId = params.id as string;

  // State
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityToEdit, setEntityToEdit] = useState<Entity | undefined>(undefined);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [listKey, setListKey] = useState(0); // Force refresh entity list

  // Handlers
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
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEntity(null);
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ask your universe anything..."
                  className="w-full pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                Universe: {universeId}
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
          <div className="flex-1 relative bg-muted/10">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              {/* TODO: D3.js Graph Component */}
              <div className="text-center">
                <p className="text-lg">Graph Visualization</p>
                <p className="text-sm">D3.js component will render here</p>
                <p className="text-xs mt-2 text-muted-foreground/60">
                  Select an entity from the sidebar to view details
                </p>
              </div>
            </div>
          </div>

          {/* Search Results Panel */}
          <div className="h-1/3 border-t bg-background p-4 overflow-auto">
            <h3 className="font-semibold mb-2">Search Results</h3>
            <div className="text-sm text-muted-foreground">
              Ask a question above to see AI-synthesized answers from your
              knowledge graph + web search.
            </div>
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
    </div>
  );
}
