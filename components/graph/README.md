# Graph Visualization Components

Interactive D3.js force-directed graph visualization for Lexicon knowledge graphs.

## Components

### ForceGraph

Core D3.js visualization component with force simulation physics.

```tsx
import { ForceGraph } from '@/components/graph';

<ForceGraph
  universeId="universe-id"
  onNodeClick={(node) => console.log('Clicked:', node)}
  selectedNodeId="entity-id"
  hiddenTypes={new Set(['event'])}
  width={800}
  height={600}
  onControlsReady={(callbacks) => {
    // Access zoom and simulation controls
    callbacks.zoomIn();
    callbacks.zoomOut();
    callbacks.resetZoom();
    callbacks.restartSimulation();
  }}
/>
```

**Props:**
- `universeId` (string, required) - UUID of the universe to visualize
- `onNodeClick` (function) - Callback when a node is clicked
- `selectedNodeId` (string) - ID of currently selected entity (highlights with yellow border)
- `hiddenTypes` (Set<EntityType>) - Entity types to hide from visualization
- `width` (number) - Graph width in pixels (default: 800)
- `height` (number) - Graph height in pixels (default: 600)
- `onControlsReady` (function) - Receives control callbacks for zoom/simulation

**Features:**
- Force simulation with collision detection
- Drag nodes to reposition (stays fixed after drag)
- Click to select nodes
- Scroll to zoom
- Pan by dragging background
- Color-coded by entity type:
  - Character: Violet (#8b5cf6)
  - Location: Emerald (#10b981)
  - Event: Amber (#f59e0b)
  - Object: Pink (#ec4899)
  - Faction: Cyan (#06b6d4)

### GraphControls

Control panel with zoom, filters, and layout reset.

```tsx
import { GraphControls } from '@/components/graph';

<GraphControls
  onZoomIn={() => {}}
  onZoomOut={() => {}}
  onResetZoom={() => {}}
  onRestartSimulation={() => {}}
  hiddenTypes={new Set()}
  onToggleType={(type) => {}}
/>
```

### GraphLegend

Visual legend showing entity types, colors, and interaction hints.

```tsx
import { GraphLegend } from '@/components/graph';

<GraphLegend />
```

### GraphViewer (Recommended)

Complete, ready-to-use graph interface that combines all components with automatic sizing.

```tsx
import { GraphViewer } from '@/components/graph';

<GraphViewer
  universeId="universe-id"
  onNodeSelect={(node) => {
    // Fetch full entity details
    console.log('Selected node:', node);
  }}
/>
```

**This is the simplest way to add graph visualization to your page.**

## Example Usage

### Basic Implementation

```tsx
'use client';

import { GraphViewer } from '@/components/graph';

export default function MyUniversePage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen p-4">
      <GraphViewer universeId={params.id} />
    </div>
  );
}
```

### With Entity Selection

```tsx
'use client';

import { useState } from 'react';
import { GraphViewer } from '@/components/graph';
import type { GraphNode } from '@/types';

export default function MyUniversePage({ params }: { params: { id: string } }) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <GraphViewer
          universeId={params.id}
          onNodeSelect={setSelectedNode}
        />
      </div>
      {selectedNode && (
        <aside className="w-80 border-l p-4">
          <h2>{selectedNode.name}</h2>
          <p className="text-sm text-muted-foreground">{selectedNode.type}</p>
        </aside>
      )}
    </div>
  );
}
```

### Advanced: Manual Control

```tsx
'use client';

import { useState } from 'react';
import { ForceGraph, GraphControls, GraphLegend } from '@/components/graph';
import type { EntityType } from '@/types';

export default function AdvancedGraph({ universeId }: { universeId: string }) {
  const [hiddenTypes, setHiddenTypes] = useState<Set<EntityType>>(new Set());
  const [controls, setControls] = useState<any>(null);

  return (
    <div className="flex gap-4">
      <ForceGraph
        universeId={universeId}
        hiddenTypes={hiddenTypes}
        width={1000}
        height={700}
        onControlsReady={setControls}
      />
      <div>
        <GraphControls
          onZoomIn={() => controls?.zoomIn()}
          onZoomOut={() => controls?.zoomOut()}
          onResetZoom={() => controls?.resetZoom()}
          onRestartSimulation={() => controls?.restartSimulation()}
          hiddenTypes={hiddenTypes}
          onToggleType={(type) => {
            const next = new Set(hiddenTypes);
            next.has(type) ? next.delete(type) : next.add(type);
            setHiddenTypes(next);
          }}
        />
        <GraphLegend />
      </div>
    </div>
  );
}
```

## API Endpoint

Graph data is fetched from:

```
GET /api/graph?universeId={id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "entity-id",
        "name": "D'Artagnan",
        "type": "character"
      }
    ],
    "links": [
      {
        "source": "entity-id-1",
        "target": "entity-id-2",
        "type": "knows",
        "strength": 3
      }
    ]
  }
}
```

## Performance Notes

- Graphs with 1000+ nodes may experience performance issues
- Force simulation automatically stabilizes after ~300 ticks
- Dragged nodes stay fixed (prevents layout chaos)
- Hidden entity types are filtered before simulation (better performance)

## Accessibility

- Keyboard navigation: Tab to focus nodes
- ARIA labels on all controls
- High contrast colors for entity types
- Semantic HTML structure

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Requires ES6+ and SVG support
