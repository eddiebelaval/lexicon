'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Footer } from '@/components/shell/footer';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      // Silent fail, UX still shows success
      setSubmitted(true);
    }
  }

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

        {/* Before/After Transformation */}
        <div className="transform-scene">
          {/* BEFORE: Excel chaos */}
          <div className="transform-frame transform-before">
            <div className="transform-label">Before</div>
            <div className="excel-mock">
              <div className="excel-toolbar">
                <span className="excel-tab excel-tab--active">Cast Contacts</span>
                <span className="excel-tab">Schedule</span>
                <span className="excel-tab">Budget</span>
                <span className="excel-tab">Crew</span>
                <span className="excel-tab">Locations</span>
              </div>
              <div className="excel-grid">
                <div className="excel-header">
                  <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span>
                </div>
                <div className="excel-row excel-row--header">
                  <span>Cast</span><span>Phone</span><span>Email</span><span>Status</span><span>Rate</span><span>Notes</span>
                </div>
                <div className="excel-row">
                  <span>Alex &amp; Jordan</span><span className="excel-overflow">555-012-34...</span><span className="excel-overflow">alex.j@gm...</span><span>signed</span><span>$2,500</span><span className="excel-overflow">needs updat...</span>
                </div>
                <div className="excel-row">
                  <span>Maya &amp; Carlos</span><span className="excel-overflow">555-067-89...</span><span className="excel-overflow">maya.c@gm...</span><span className="excel-cell--warn">pending</span><span></span><span className="excel-overflow">waiting on l...</span>
                </div>
                <div className="excel-row">
                  <span>Priya &amp; Marco</span><span className="excel-overflow">555-098-76...</span><span className="excel-overflow">priya.m@g...</span><span className="excel-cell--bad">offer sent</span><span>$3,000</span><span></span>
                </div>
                <div className="excel-row excel-row--dim">
                  <span>Suki &amp; Ren</span><span className="excel-overflow">555-043-21...</span><span className="excel-overflow">suki.r@gm...</span><span>signed</span><span>$2,800</span><span className="excel-overflow">confirmed f...</span>
                </div>
                <div className="excel-row excel-row--dim">
                  <span>Dana &amp; Liam</span><span className="excel-overflow">555-876-54...</span><span className="excel-overflow">dana.l@gm...</span><span>signed</span><span>$2,200</span><span></span>
                </div>
              </div>
              <div className="excel-scrollbar" />
            </div>
          </div>

          {/* Arrow */}
          <div className="transform-arrow">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          {/* AFTER: Lexicon */}
          <div className="transform-frame transform-after">
            <div className="transform-label transform-label--accent">After</div>
            <div className="lexicon-mock">
              <div className="lex-sidebar">
                <div className="lex-nav-item lex-nav-active">Dashboard</div>
                <div className="lex-nav-item">Calendar</div>
                <div className="lex-nav-item">Cast</div>
                <div className="lex-nav-item">Crew</div>
                <div className="lex-nav-item">Gear</div>
              </div>
              <div className="lex-main">
                <div className="lex-kpis">
                  <div className="lex-kpi">
                    <span className="lex-kpi-label">Signed</span>
                    <span className="lex-kpi-value">8/12</span>
                  </div>
                  <div className="lex-kpi">
                    <span className="lex-kpi-label">Scenes</span>
                    <span className="lex-kpi-value">14/32</span>
                  </div>
                  <div className="lex-kpi">
                    <span className="lex-kpi-label">Crew</span>
                    <span className="lex-kpi-value">24</span>
                  </div>
                </div>
                <div className="lex-alert">All clear. 3 contracts pending review.</div>
                <div className="lex-cards">
                  <div className="lex-card">
                    <div className="lex-ring lex-ring--75" />
                    <span className="lex-card-name">Alex &amp; Jordan</span>
                    <span className="lex-card-pill lex-pill--signed">Signed</span>
                  </div>
                  <div className="lex-card">
                    <div className="lex-ring lex-ring--25" />
                    <span className="lex-card-name">Maya &amp; Carlos</span>
                    <span className="lex-card-pill lex-pill--pending">Pending</span>
                  </div>
                  <div className="lex-card">
                    <div className="lex-ring lex-ring--100" />
                    <span className="lex-card-name">Suki &amp; Ren</span>
                    <span className="lex-card-pill lex-pill--signed">Signed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="landing-waitlist">
        {submitted ? (
          <p className="landing-waitlist-success">You&apos;re on the list. We&apos;ll be in touch.</p>
        ) : (
          <form className="landing-waitlist-form" onSubmit={handleWaitlist}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="landing-waitlist-input"
              required
            />
            <button type="submit" className="landing-waitlist-btn">
              Get Early Access
            </button>
          </form>
        )}
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
          Every production tool assumes you have a script. Reality TV doesn&apos;t work that way.
          Your schedule changes daily. Cast logistics are chaos. Your coordinator is the only person
          who knows where everything lives, and it&apos;s all in a spreadsheet.
        </p>
        <p className="landing-pitch-body">
          Lexicon replaces the spreadsheet with a production OS that understands unscripted workflows.
          Lexi is your AI production coordinator: she knows every cast member, every shoot date,
          every contract status. Ask her anything. She answers in seconds.
        </p>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
