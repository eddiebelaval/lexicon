/**
 * Dashboard - User's Universes
 *
 * Displays list of story universes the user has created.
 * Quick stats and ability to create new universes.
 */

export default function DashboardPage() {
  // TODO: Fetch user's universes from database
  // TODO: Implement authentication check

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-lexicon-600">Lexicon</h1>
          <nav className="flex items-center gap-4">
            {/* TODO: Add user menu */}
            <span className="text-sm text-muted-foreground">Dashboard</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Your Universes</h2>
            <p className="text-muted-foreground mt-1">
              Manage your story worlds and knowledge graphs
            </p>
          </div>
          <button className="inline-flex items-center justify-center rounded-lg bg-lexicon-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexicon-700 transition-colors">
            + New Universe
          </button>
        </div>

        {/* Universe Grid - Placeholder */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Universe Card */}
          <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-xl font-semibold mb-2">Three Musketeers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Classic adventure with Athos, Porthos, Aramis, and d&apos;Artagnan
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-graph-character">15 Characters</span>
              <span className="text-graph-location">8 Locations</span>
              <span className="text-graph-event">5 Events</span>
            </div>
          </div>

          {/* Empty State Card */}
          <div className="bg-muted/30 rounded-xl border border-dashed p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            <span className="text-4xl mb-2">+</span>
            <p className="text-muted-foreground">Create your first universe</p>
          </div>
        </div>
      </main>
    </div>
  );
}
