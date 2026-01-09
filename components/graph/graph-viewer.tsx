'use client';

/**
 * GraphViewer Component
 *
 * Complete graph visualization interface that combines ForceGraph,
 * GraphControls, and GraphLegend into a cohesive user experience.
 *
 * This is a ready-to-use component that can be dropped into any page.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ForceGraph } from './force-graph';
import { GraphControls } from './graph-controls';
import { GraphLegend } from './graph-legend';
import type { GraphNode, EntityType } from '@/types';

interface GraphViewerProps {
  universeId: string;
  onNodeSelect?: (node: GraphNode | null) => void;
}

export function GraphViewer({ universeId, onNodeSelect }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [hiddenTypes, setHiddenTypes] = useState<Set<EntityType>>(new Set());
  const [controlCallbacks, setControlCallbacks] = useState<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    restartSimulation: () => void;
  } | null>(null);

  // Measure container and update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Subtract sidebar width (256px + 16px gap), ensure minimum dimensions
        const graphWidth = Math.max(400, width - 272);
        const graphHeight = Math.max(400, height);
        setDimensions({ width: graphWidth, height: graphHeight });
      }
    };

    // Small delay to ensure container has rendered
    const timeoutId = setTimeout(updateDimensions, 50);
    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Handle node click
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNodeId(node.id);
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  // Toggle entity type visibility
  const handleToggleType = useCallback((type: EntityType) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Receive control callbacks from ForceGraph
  const handleControlsReady = useCallback((callbacks: {
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    restartSimulation: () => void;
  }) => {
    setControlCallbacks(callbacks);
  }, []);

  return (
    <div ref={containerRef} className="flex gap-4 h-full w-full">
      {/* Main Graph */}
      <div className="flex-1 min-w-0">
        <ForceGraph
          universeId={universeId}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNodeId}
          hiddenTypes={hiddenTypes}
          width={dimensions.width}
          height={dimensions.height}
          onControlsReady={handleControlsReady}
        />
      </div>

      {/* Sidebar with Controls and Legend */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <GraphControls
          onZoomIn={() => controlCallbacks?.zoomIn()}
          onZoomOut={() => controlCallbacks?.zoomOut()}
          onResetZoom={() => controlCallbacks?.resetZoom()}
          onRestartSimulation={() => controlCallbacks?.restartSimulation()}
          hiddenTypes={hiddenTypes}
          onToggleType={handleToggleType}
        />
        <GraphLegend />
      </div>
    </div>
  );
}
