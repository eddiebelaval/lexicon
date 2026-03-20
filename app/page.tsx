import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <span className="landing-logo-mark">L</span>
          <span className="landing-logo-text">Lexicon</span>
        </div>
        <Link href="/production" className="landing-signin">
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <h1 className="landing-headline">
          Your production, off Excel.
        </h1>
        <p className="landing-subhead">
          Upload your spreadsheet. Lexi does the rest.
        </p>

        {/* Dashboard Preview */}
        <div className="landing-preview">
          <div className="landing-preview-window">
            <div className="landing-preview-titlebar">
              <span className="landing-preview-dot" />
              <span className="landing-preview-dot" />
              <span className="landing-preview-dot" />
              <span className="landing-preview-url">lexicon.id8labs.app/production</span>
            </div>
            <div className="landing-preview-content">
              {/* Sidebar mockup */}
              <div className="landing-mock-sidebar">
                <div className="landing-mock-nav-item landing-mock-nav-active" />
                <div className="landing-mock-nav-item" />
                <div className="landing-mock-nav-item" />
                <div className="landing-mock-nav-item" />
                <div className="landing-mock-nav-item" />
                <div className="landing-mock-nav-item" />
              </div>
              {/* Content mockup */}
              <div className="landing-mock-content">
                {/* KPI row */}
                <div className="landing-mock-kpi-row">
                  <div className="landing-mock-kpi" />
                  <div className="landing-mock-kpi" />
                  <div className="landing-mock-kpi" />
                  <div className="landing-mock-kpi" />
                </div>
                {/* Alert bar */}
                <div className="landing-mock-alert" />
                {/* Cards */}
                <div className="landing-mock-cards">
                  <div className="landing-mock-card">
                    <div className="landing-mock-ring" />
                    <div className="landing-mock-line" />
                    <div className="landing-mock-pill" />
                  </div>
                  <div className="landing-mock-card">
                    <div className="landing-mock-ring landing-mock-ring--half" />
                    <div className="landing-mock-line" />
                    <div className="landing-mock-pill landing-mock-pill--warn" />
                  </div>
                  <div className="landing-mock-card">
                    <div className="landing-mock-ring landing-mock-ring--full" />
                    <div className="landing-mock-line" />
                    <div className="landing-mock-pill landing-mock-pill--done" />
                  </div>
                  <div className="landing-mock-card">
                    <div className="landing-mock-ring" />
                    <div className="landing-mock-line" />
                    <div className="landing-mock-pill" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="landing-waitlist">
        <form
          className="landing-waitlist-form"
          action="/api/waitlist"
          method="POST"
          onSubmit={(e) => {
            // Client-side fallback: will be enhanced later
            e.preventDefault();
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            className="landing-waitlist-input"
            required
          />
          <button type="submit" className="landing-waitlist-btn">
            Get Early Access
          </button>
        </form>
        <p className="landing-waitlist-note">
          Currently in private beta with select productions.
        </p>
      </section>

      {/* How it works */}
      <section className="landing-steps">
        <div className="landing-step">
          <div className="landing-step-num">1</div>
          <h3 className="landing-step-title">Upload your master Excel</h3>
          <p className="landing-step-desc">
            Cast contacts, crew lists, schedules. Whatever format you have. Lexi reads it all.
          </p>
        </div>
        <div className="landing-step">
          <div className="landing-step-num">2</div>
          <h3 className="landing-step-title">Lexi builds your production</h3>
          <p className="landing-step-desc">
            Cast profiles, crew assignments, shoot calendar. Populated automatically, verified with you.
          </p>
        </div>
        <div className="landing-step">
          <div className="landing-step-num">3</div>
          <h3 className="landing-step-title">Your team runs on Lexicon</h3>
          <p className="landing-step-desc">
            Real-time dashboard. One change cascades everywhere. No more emailing spreadsheets.
          </p>
        </div>
      </section>

      {/* Built for unscripted */}
      <section className="landing-pitch">
        <h2 className="landing-pitch-title">Built for unscripted.</h2>
        <p className="landing-pitch-body">
          Every production tool assumes you have a script. Reality TV doesn't work that way.
          Your schedule changes daily. Cast logistics are chaos. Your coordinator is the only person
          who knows where everything lives, and it's all in a spreadsheet.
        </p>
        <p className="landing-pitch-body">
          Lexicon replaces the spreadsheet with a production OS that understands unscripted workflows.
          Lexi is your AI production coordinator: she knows every cast member, every shoot date,
          every contract status. Ask her anything. She answers in seconds.
        </p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span className="landing-footer-logo">id8Labs</span>
        </div>
        <p className="landing-footer-copy">
          Professional tools for the AI era.
        </p>
      </footer>
    </div>
  );
}
