# Graph Visualization Architecture

## Component Hierarchy

```
GraphViewer (recommended entry point)
├── ForceGraph (D3.js visualization)
│   ├── SVG container
│   ├── Zoom behavior
│   ├── Force simulation
│   ├── Links (lines)
│   └── Nodes (circles + labels)
├── GraphControls (sidebar panel)
│   ├── Zoom buttons
│   ├── Entity type filters
│   └── Layout reset
└── GraphLegend (info panel)
    ├── Entity type colors
    ├── Relationship indicator
    └── Interaction hints
```

## Data Flow

```
User Action → GraphViewer → ForceGraph → D3.js Simulation
     ↓              ↓             ↓
State Update → Controls →   Visual Update
     ↓
API Fetch → /api/graph?universeId={id}
     ↓
Neo4j Query → { nodes: [...], links: [...] }
     ↓
D3.js Transform → Force-directed layout
     ↓
SVG Rendering → Interactive graph
```

## State Management

### GraphViewer State
- `dimensions` - Container width/height (responsive)
- `selectedNodeId` - Currently selected entity
- `hiddenTypes` - Set of hidden entity types
- `controlCallbacks` - Functions from ForceGraph

### ForceGraph State
- `graphData` - Nodes and links from API
- `loading` - Fetch in progress
- `error` - Fetch failed
- `simulationRef` - D3 simulation instance
- `zoomBehaviorRef` - D3 zoom instance

## D3.js Force Simulation

### Forces Applied
1. **Link Force** - Connects related entities
   - Distance: 100px
   - ID accessor: `d => d.id`

2. **Charge Force** - Repels nodes from each other
   - Strength: -300
   - Creates natural spacing

3. **Center Force** - Pulls nodes toward center
   - X: width / 2
   - Y: height / 2
   - Prevents drift

4. **Collision Force** - Prevents overlap
   - Radius: 35px
   - Ensures readability

### Simulation Lifecycle
```
Initialize → Run ticks → Update positions → Stabilize
    ↓           ↓            ↓              ↓
  Alpha=1    Alpha=0.3    Alpha=0.01    Alpha=0
```

## Event Handling

### User Interactions
```
Click node → handleNodeClick → setSelectedNodeId → onNodeSelect
Drag node → D3 drag behavior → Fix position (fx, fy)
Scroll → Zoom behavior → Scale transform
Click background → Pan → Translate transform
```

### Control Actions
```
Zoom In → zoomBehaviorRef.scaleBy(1.3)
Zoom Out → zoomBehaviorRef.scaleBy(0.7)
Reset → zoomBehaviorRef.transform(identity)
Restart → simulation.alpha(1).restart()
```

## Rendering Pipeline

### Initial Render
1. GraphViewer measures container
2. ForceGraph fetches data from API
3. Shows loading state
4. Data arrives → create simulation
5. Setup SVG structure (groups)
6. Render nodes and links
7. Attach event handlers
8. Simulation starts ticking

### Update Render
1. Props change (selectedNodeId, hiddenTypes)
2. Filter visible nodes/links
3. Update D3 selections (enter/exit/update)
4. Restart simulation with new data
5. Smooth transition to new layout

## Performance Optimizations

### Implemented
- Filter data before simulation (not after)
- Use D3 selections for efficient DOM updates
- Fixed nodes after drag (prevent chaos)
- Auto-stabilization (stops at alpha < threshold)
- Debounced resize handler
- React.memo on pure components

### Future Considerations
- Virtual rendering for 1000+ nodes
- Level-of-detail (LOD) system
- Web Workers for simulation
- Canvas rendering for large graphs

## Type Safety

### Core Types
```typescript
interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  x?: number;      // D3 adds during simulation
  y?: number;      // D3 adds during simulation
  fx?: number | null;  // Fixed x position
  fy?: number | null;  // Fixed y position
}

interface GraphLink {
  source: string | GraphNode;  // D3 transforms string → object
  target: string | GraphNode;  // D3 transforms string → object
  type: RelationshipType;
  strength: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
```

## API Contract

### Request
```
GET /api/graph?universeId={uuid}
```

### Success Response
```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "uuid", "name": "Entity", "type": "character" }
    ],
    "links": [
      { "source": "uuid1", "target": "uuid2", "type": "knows", "strength": 3 }
    ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Color System

### Entity Type Colors (Tailwind Config)
```javascript
{
  character: '#8b5cf6',  // violet-500
  location: '#10b981',   // emerald-500
  event: '#f59e0b',      // amber-500
  object: '#ec4899',     // pink-500
  faction: '#06b6d4'     // cyan-500
}
```

### Semantic Colors
- Selected node border: `#facc15` (yellow-400)
- Link stroke: `#94a3b8` (slate-400)
- Node border: `#ffffff` (white)
- Background: `#f8fafc` (slate-50)

## Accessibility

### Keyboard Support
- Tab: Focus controls
- Enter/Space: Activate button
- Escape: Close detail panel

### Screen Readers
- ARIA labels on all buttons
- Semantic HTML structure
- Alt text for legend icons

### Visual
- High contrast colors
- Sufficient font sizes (11px minimum)
- Clear visual hierarchy

## Browser Requirements

### Required APIs
- SVG rendering
- CSS3 transforms
- ES6+ JavaScript
- Touch events (mobile)
- Resize Observer (polyfill available)

### Tested Browsers
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+
- iOS Safari 17+
- Chrome Mobile 120+

## File Structure

```
components/graph/
├── force-graph.tsx       # Core D3.js component
├── graph-controls.tsx    # Control panel
├── graph-legend.tsx      # Visual legend
├── graph-viewer.tsx      # Integrated interface
├── index.ts              # Barrel exports
├── README.md             # Usage documentation
└── ARCHITECTURE.md       # This file
```

## Integration Points

### Universe Page
```tsx
// app/universe/[id]/page.tsx
import { GraphViewer } from '@/components/graph';

<GraphViewer
  universeId={universeId}
  onNodeSelect={handleGraphNodeSelect}
/>
```

### Entity Detail Sync
```typescript
// Click graph node → fetch full entity → show detail panel
const handleGraphNodeSelect = async (node: GraphNode | null) => {
  if (!node) return;
  const entity = await fetchEntity(node.id);
  setSelectedEntity(entity);
};
```

### Refresh on Changes
```typescript
// Entity created/deleted → increment graphKey → remount GraphViewer
setGraphKey(k => k + 1);
```

## Design Decisions

### Why Force-Directed Layout?
- Natural clustering reveals narrative structure
- Self-organizing (no manual positioning)
- Visually intuitive
- Industry standard for graph visualization

### Why D3.js?
- Battle-tested (10+ years)
- Extensive force simulation features
- Excellent TypeScript support
- Large community and resources

### Why Client-Side?
- Interactive features require event handlers
- D3 needs browser APIs
- Real-time simulation runs in browser
- Better user experience (no page refresh)

### Why Separate Components?
- Modular, testable architecture
- Easy to customize individual pieces
- GraphViewer provides simple API
- Advanced users can compose manually

## Testing Strategy

### Manual Testing
- Visual verification across browsers
- Interaction testing (click, drag, zoom)
- Responsive behavior
- Error/loading/empty states

### Future Automated Testing
- Unit tests for state management
- Integration tests for API fetching
- E2E tests for user flows
- Visual regression tests

## Monitoring

### Performance Metrics
- Time to first render
- Simulation stabilization time
- Frame rate during interaction
- Memory usage for large graphs

### Error Tracking
- API fetch failures
- D3 simulation errors
- Rendering exceptions
- Browser compatibility issues

---

**Last Updated:** January 8, 2026
**Version:** 1.0.0
**Status:** Production Ready
