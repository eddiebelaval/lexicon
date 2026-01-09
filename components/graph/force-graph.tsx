'use client';

/**
 * ForceGraph Component
 *
 * Interactive D3.js force-directed graph visualization for the knowledge graph.
 * Displays entities as nodes and relationships as links with physics simulation.
 *
 * Features:
 * - Force simulation with collision detection
 * - Drag to reposition nodes
 * - Click to select nodes
 * - Color-coded by entity type
 * - Responsive sizing
 * - Smooth animations
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphLink, GraphData, EntityType } from '@/types';

// Color mapping for entity types (from tailwind.config.ts)
const NODE_COLORS: Record<EntityType, string> = {
  character: '#8b5cf6', // violet
  location: '#10b981', // emerald
  event: '#f59e0b', // amber
  object: '#ec4899', // pink
  faction: '#06b6d4', // cyan
};

interface ForceGraphProps {
  universeId: string;
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string;
  hiddenTypes?: Set<EntityType>;
  width?: number;
  height?: number;
  onControlsReady?: (callbacks: {
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    restartSimulation: () => void;
  }) => void;
}

export function ForceGraph({
  universeId,
  onNodeClick,
  selectedNodeId,
  hiddenTypes = new Set(),
  width = 800,
  height = 600,
  onControlsReady,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to maintain D3 state across renders
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Fetch graph data with abort support
  const fetchGraph = useCallback(async (signal?: AbortSignal) => {
    if (!universeId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/graph?universeId=${universeId}`, { signal });
      if (!res.ok) throw new Error('Failed to fetch graph data');

      const result = await res.json();
      if (result.success) {
        setGraphData(result.data);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Graph fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [universeId]);

  // Initial fetch and cleanup with timeout
  useEffect(() => {
    const controller = new AbortController();
    const FETCH_TIMEOUT_MS = 30000; // 30 seconds

    // Auto-abort if fetch takes too long
    const timeoutId = setTimeout(() => {
      controller.abort();
      setError('Graph loading timed out. Try again.');
      setLoading(false);
    }, FETCH_TIMEOUT_MS);

    fetchGraph(controller.signal).finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchGraph]);

  // Initialize and update D3 visualization
  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    if (graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = svg.select<SVGGElement>('g.graph-container');

    // Filter nodes and links based on hidden types
    const visibleNodes = graphData.nodes.filter((node) => !hiddenTypes.has(node.type));
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = graphData.links.filter((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    // Create simulation
    const simulation = d3
      .forceSimulation<GraphNode>(visibleNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(visibleLinks)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    simulationRef.current = simulation;

    // Draw links
    const linkSelection = container
      .select<SVGGElement>('g.links')
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(visibleLinks, (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        return `${sourceId}-${targetId}`;
      });

    // Remove old links
    linkSelection.exit().remove();

    // Add new links
    const linkEnter = linkSelection
      .enter()
      .append('line')
      .attr('class', 'graph-link')
      .attr('stroke', '#64748b')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', (d) => Math.sqrt(d.strength) + 1);

    const link = linkEnter.merge(linkSelection);

    // Draw nodes
    const nodeSelection = container
      .select<SVGGElement>('g.nodes')
      .selectAll<SVGGElement, GraphNode>('g.node')
      .data(visibleNodes, (d) => d.id);

    // Remove old nodes
    nodeSelection.exit().remove();

    // Add new nodes
    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Node circles
    nodeEnter
      .append('circle')
      .attr('r', 12)
      .attr('class', 'graph-node')
      .attr('fill', (d) => NODE_COLORS[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Node labels
    nodeEnter
      .append('text')
      .attr('class', 'graph-label')
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text((d) => d.name);

    const node = nodeEnter.merge(nodeSelection);

    // Update selected state
    node.select('circle').attr('stroke', (d) => (d.id === selectedNodeId ? '#facc15' : '#fff')).attr('stroke-width', (d) => (d.id === selectedNodeId ? 3 : 2));

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, _d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Keep node fixed after drag
        // Uncomment to allow nodes to float again: _d.fx = null; _d.fy = null;
      });

    node.call(drag);

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick?.(d);
    });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (typeof d.source === 'object' ? d.source.x || 0 : 0))
        .attr('y1', (d) => (typeof d.source === 'object' ? d.source.y || 0 : 0))
        .attr('x2', (d) => (typeof d.target === 'object' ? d.target.x || 0 : 0))
        .attr('y2', (d) => (typeof d.target === 'object' ? d.target.y || 0 : 0));

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData, hiddenTypes, selectedNodeId, onNodeClick, width, height]);

  // Setup SVG and zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zooming/panning
    const container = svg.append('g').attr('class', 'graph-container');

    // Create link and node groups
    container.append('g').attr('class', 'links');
    container.append('g').attr('class', 'nodes');

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Initial transform
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
  }, []);

  // Expose zoom controls via ref callback
  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(1));
  }, []);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
  }, []);

  const restartSimulation = useCallback(() => {
    if (!simulationRef.current) return;
    // Reset all fixed positions
    simulationRef.current.nodes().forEach((node) => {
      node.fx = null;
      node.fy = null;
    });
    simulationRef.current.alpha(1).restart();
  }, []);

  // Notify parent of control callbacks
  useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        zoomIn,
        zoomOut,
        resetZoom,
        restartSimulation,
      });
    }
  }, [onControlsReady, zoomIn, zoomOut, resetZoom, restartSimulation]);

  // Render states
  if (loading) {
    return (
      <div
        className="flex items-center justify-center border border-[#1f1f1f] rounded-lg bg-[#0d0d0d]"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#38bdf8] mb-4"></div>
          <p className="text-[#888] font-medium">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center border border-red-900/30 rounded-lg bg-red-900/10"
        style={{ width, height }}
      >
        <div className="text-center px-4">
          <p className="text-red-400 font-semibold mb-2">Failed to load graph</p>
          <p className="text-red-400/70 text-sm mb-3">{error}</p>
          <button
            onClick={() => fetchGraph()}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-[#1f1f1f] rounded-lg bg-[#0d0d0d]"
        style={{ width, height }}
      >
        <div className="text-center px-4">
          <p className="text-[#888] font-medium mb-2">No entities yet</p>
          <p className="text-[#666] text-sm">Add entities to see the knowledge graph</p>
        </div>
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="border border-[#1f1f1f] rounded-lg bg-[#0d0d0d]"
      style={{ userSelect: 'none' }}
    />
  );
}
