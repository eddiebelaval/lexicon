'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FeedbackLoop } from '@/components/landing/feedback-loop';
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
      setSubmitted(true);
    }
  }

  return (
    <div className="landing">
      {/* Hero: Shader background with content overlay */}
      <section className="landing-hero">
        <FeedbackLoop className="landing-shader" />
        <div className="landing-hero-overlay" />

        {/* Header (over shader) */}
        <header className="landing-header">
          <div className="landing-logo">
            <span className="landing-logo-mark">L</span>
            <span className="landing-logo-text">Lexicon</span>
          </div>
          <Link href="/production" className="landing-signin">
            Sign In
          </Link>
        </header>

        {/* Headline (over shader) */}
        <div className="landing-hero-content">
          <h1 className="landing-headline">
            Your production,<br />off Excel.
          </h1>
          <p className="landing-subhead">
            Upload your spreadsheet. Lexi does the rest.
          </p>

          {/* CTA */}
          <div className="landing-hero-cta">
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
              Private beta. Built for unscripted TV production.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Feature 1: Excel Import ═══ */}
      <section className="feature-section">
        <div className="feature-row">
          <div className="feature-copy">
            <span className="feature-tag">Instant Setup</span>
            <h2 className="feature-title">Drop your spreadsheet.<br />Watch it come alive.</h2>
            <p className="feature-desc">
              Your master Excel has cast contacts, crew lists, schedules, and budgets spread across
              dozens of tabs. Lexi reads every column, parses every cell, and builds your entire
              production in minutes. Couples, multi-line fields, season history: all handled.
            </p>
            <ul className="feature-list">
              <li>CSV, XLS, XLSX supported</li>
              <li>Handles messy data (truncated cells, merged rows, free-text fields)</li>
              <li>Asks you to verify before committing anything</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="excel-mock">
              <div className="excel-toolbar">
                <span className="excel-tab excel-tab--active">Cast Contacts</span>
                <span className="excel-tab">Schedule</span>
                <span className="excel-tab">Budget</span>
                <span className="excel-tab">Crew</span>
              </div>
              <div className="excel-grid">
                <div className="excel-header">
                  <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>
                </div>
                <div className="excel-row excel-row--header">
                  <span>Cast</span><span>Phone</span><span>Email</span><span>Status</span><span>Rate</span>
                </div>
                <div className="excel-row">
                  <span>Alex &amp; Jordan</span><span className="excel-overflow">555-012-34...</span><span className="excel-overflow">alex.j@gm...</span><span>signed</span><span>$2,500</span>
                </div>
                <div className="excel-row">
                  <span>Maya &amp; Carlos</span><span className="excel-overflow">555-067-89...</span><span className="excel-overflow">maya.c@gm...</span><span className="excel-cell--warn">pending</span><span></span>
                </div>
                <div className="excel-row">
                  <span>Priya &amp; Marco</span><span className="excel-overflow">555-098-76...</span><span className="excel-overflow">priya.m@g...</span><span className="excel-cell--bad">offer sent</span><span>$3,000</span>
                </div>
                <div className="excel-row excel-row--dim">
                  <span>Suki &amp; Ren</span><span className="excel-overflow">555-043-21...</span><span className="excel-overflow">suki.r@gm...</span><span>signed</span><span>$2,800</span>
                </div>
              </div>
              <div className="excel-scrollbar" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Feature 2: Cast Board ═══ */}
      <section className="feature-section">
        <div className="feature-row feature-row--reverse">
          <div className="feature-copy">
            <span className="feature-tag">Visual Cast Board</span>
            <h2 className="feature-title">See your entire cast<br />at a glance.</h2>
            <p className="feature-desc">
              Every cast member as a card with a completion ring showing contract progress.
              Signed, pending, offer sent: color-coded status pills you can read from across the room.
              No more scrolling through rows looking for who still needs a signature.
            </p>
            <ul className="feature-list">
              <li>Completion rings: shoot, interview, pickup, payment</li>
              <li>Status pills with color coding</li>
              <li>Toggle between card grid and table view</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="cast-mock">
              <div className="cast-mock-row">
                <div className="lex-card">
                  <div className="lex-ring lex-ring--75" />
                  <span className="lex-card-name">Alex &amp; Jordan</span>
                  <span className="lex-card-pill lex-pill--signed">Signed</span>
                  <div className="lex-card-checks">
                    <span className="lex-check lex-check--done" />
                    <span className="lex-check lex-check--done" />
                    <span className="lex-check lex-check--done" />
                    <span className="lex-check" />
                  </div>
                </div>
                <div className="lex-card">
                  <div className="lex-ring lex-ring--25" />
                  <span className="lex-card-name">Maya &amp; Carlos</span>
                  <span className="lex-card-pill lex-pill--pending">Pending</span>
                  <div className="lex-card-checks">
                    <span className="lex-check lex-check--done" />
                    <span className="lex-check" />
                    <span className="lex-check" />
                    <span className="lex-check" />
                  </div>
                </div>
                <div className="lex-card">
                  <div className="lex-ring lex-ring--100" />
                  <span className="lex-card-name">Suki &amp; Ren</span>
                  <span className="lex-card-pill lex-pill--signed">Signed</span>
                  <div className="lex-card-checks">
                    <span className="lex-check lex-check--done" />
                    <span className="lex-check lex-check--done" />
                    <span className="lex-check lex-check--done" />
                    <span className="lex-check lex-check--done" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Feature 3: Lexi AI ═══ */}
      <section className="feature-section">
        <div className="feature-row">
          <div className="feature-copy">
            <span className="feature-tag">AI Production Coordinator</span>
            <h2 className="feature-title">Ask Lexi anything<br />about your show.</h2>
            <p className="feature-desc">
              &quot;Who hasn&apos;t signed their contract?&quot; &quot;What&apos;s shooting this week?&quot;
              &quot;Send the call sheet to the crew.&quot; Lexi knows every cast member, every shoot date,
              every contract status. She answers in seconds, not hours of spreadsheet digging.
            </p>
            <ul className="feature-list">
              <li>Natural language queries about your production</li>
              <li>60 tools: contracts, scheduling, crew, gear, documents</li>
              <li>Available on Telegram for on-set access</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="chat-mock">
              <div className="chat-mock-header">
                <div className="chat-mock-avatar">L</div>
                <span className="chat-mock-name">Lexi</span>
                <span className="chat-mock-status">Online</span>
              </div>
              <div className="chat-mock-messages">
                <div className="chat-mock-msg chat-mock-msg--user">
                  Who hasn&apos;t signed their contract yet?
                </div>
                <div className="chat-mock-msg chat-mock-msg--lexi">
                  <strong>3 contracts pending:</strong><br />
                  Maya &amp; Carlos (pending, no rate set)<br />
                  Priya &amp; Marco (offer sent, awaiting response)<br />
                  Dana &amp; Liam (email sent 3 days ago)<br /><br />
                  Want me to send a follow-up email to all three?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Feature 4: Cascade Updates ═══ */}
      <section className="feature-section feature-section--centered">
        <div className="feature-copy feature-copy--wide">
          <span className="feature-tag">Real-Time Sync</span>
          <h2 className="feature-title">Change one thing.<br />Everything updates.</h2>
          <p className="feature-desc">
            Move a shoot date and the call sheet, crew assignments, and Telegram notifications
            update automatically. Your team always sees the latest info. No more emailing
            revised spreadsheets at 4pm hoping everyone gets the update before tomorrow&apos;s shoot.
          </p>
        </div>
        <div className="cascade-visual">
          <div className="cascade-item">
            <div className="cascade-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="M16 2v4" /><path d="M8 2v4" /></svg>
            </div>
            <span className="cascade-label">Schedule changes</span>
          </div>
          <div className="cascade-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </div>
          <div className="cascade-item">
            <div className="cascade-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
            </div>
            <span className="cascade-label">Call sheet updates</span>
          </div>
          <div className="cascade-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </div>
          <div className="cascade-item">
            <div className="cascade-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" /><rect width="18" height="18" x="3" y="4" rx="2" /><circle cx="12" cy="10" r="2" /></svg>
            </div>
            <span className="cascade-label">Crew notified</span>
          </div>
          <div className="cascade-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </div>
          <div className="cascade-item">
            <div className="cascade-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </div>
            <span className="cascade-label">Telegram alerts</span>
          </div>
        </div>
      </section>

      {/* ═══ Built for unscripted ═══ */}
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
