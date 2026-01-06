import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="text-lexicon-600">Lexicon</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Wikipedia + Perplexity for story universes.
          </p>

          <p className="text-lg text-muted-foreground/80 max-w-xl mx-auto">
            Search your narrative world like a wiki. Get answers synthesized from
            your knowledge graph + the live web.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-lexicon-600 px-8 py-3 text-lg font-medium text-white hover:bg-lexicon-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-8 py-3 text-lg font-medium hover:bg-accent transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Lexicon Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-graph-character/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Your Graph</h3>
              <p className="text-muted-foreground">
                Add characters, locations, events, and objects. Connect them with
                relationships. Everything links to everything.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-graph-location/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask Anything</h3>
              <p className="text-muted-foreground">
                Natural language search that understands narrative.
                &ldquo;Who betrayed whom?&rdquo; just works.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-graph-event/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Web + Graph</h3>
              <p className="text-muted-foreground">
                Blend your knowledge with live web data. Get answers that combine
                your universe with the latest information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Part of the ID8Labs Writer Ecosystem
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ID8Labs
          </p>
        </div>
      </footer>
    </main>
  );
}
