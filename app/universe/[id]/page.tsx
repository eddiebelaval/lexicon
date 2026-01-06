/**
 * Universe View - Main workspace for a story universe
 *
 * Features:
 * - Search bar (primary action)
 * - Entity list (sidebar)
 * - Graph visualization (main area)
 * - Search results panel
 */

interface UniversePageProps {
  params: Promise<{ id: string }>;
}

export default async function UniversePage({ params }: UniversePageProps) {
  const { id } = await params;

  // TODO: Fetch universe data from Neo4j
  // TODO: Load entities and relationships

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
                <input
                  type="text"
                  placeholder="Ask your universe anything..."
                  className="w-full px-4 py-2 pl-10 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-lexicon-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground">
                Universe: {id}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Sidebar - Entity List */}
        <aside className="w-64 border-r bg-muted/20 p-4 hidden md:block">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Entities</h2>
            <button className="text-sm text-lexicon-600 hover:underline">
              + Add
            </button>
          </div>

          {/* Entity Type Filters */}
          <div className="flex flex-wrap gap-1 mb-4">
            {['All', 'Characters', 'Locations', 'Events'].map((type) => (
              <button
                key={type}
                className="px-2 py-1 text-xs rounded-full bg-background border hover:bg-accent"
              >
                {type}
              </button>
            ))}
          </div>

          {/* Entity List Placeholder */}
          <nav className="space-y-1">
            {['Athos', 'Porthos', 'Aramis', "d'Artagnan", 'Milady'].map(
              (name) => (
                <button
                  key={name}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-graph-character" />
                  {name}
                </button>
              )
            )}
          </nav>
        </aside>

        {/* Main Content - Graph + Results */}
        <main className="flex-1 flex flex-col">
          {/* Graph Visualization Area */}
          <div className="flex-1 relative bg-muted/10">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              {/* TODO: D3.js Graph Component */}
              <div className="text-center">
                <p className="text-lg">Graph Visualization</p>
                <p className="text-sm">D3.js component will render here</p>
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
      </div>
    </div>
  );
}
