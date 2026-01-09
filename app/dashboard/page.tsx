'use client';

import Link from 'next/link';
import { BookOpen, Plus, Users, MapPin, Calendar, ArrowRight } from 'lucide-react';

/**
 * Dashboard - User's Universes
 *
 * Displays list of story universes the user has created.
 * Dark mode first, ID8Labs design language.
 */
export default function DashboardPage() {
  // TODO: Fetch user's universes from database
  // TODO: Implement authentication check

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <BookOpen className="w-6 h-6 text-[#38bdf8] group-hover:text-[#5ccfff] transition-colors" />
            <span className="text-xl font-semibold text-white">Lexicon</span>
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-[#666]">Dashboard</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Your Universes</h2>
            <p className="text-[#888] mt-1">
              Manage your story worlds and knowledge graphs
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38bdf8] text-[#0a0a0a] font-medium text-sm hover:bg-[#5ccfff] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-200">
            <Plus className="w-4 h-4" />
            New Universe
          </button>
        </div>

        {/* Universe Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Three Musketeers Universe Card */}
          <Link
            href="/universe/11111111-1111-1111-1111-111111111111"
            className="group bg-[#111111] hover:bg-[#151515] rounded-xl border border-[#1f1f1f] hover:border-[#2a2a2a] p-6 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-white group-hover:text-[#38bdf8] transition-colors">
                Three Musketeers
              </h3>
              <ArrowRight className="w-5 h-5 text-[#444] group-hover:text-[#38bdf8] transition-colors" />
            </div>
            <p className="text-sm text-[#777] mb-4 leading-relaxed">
              Classic adventure with Athos, Porthos, Aramis, and d&apos;Artagnan
            </p>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-[#8b5cf6]">
                <Users className="w-3.5 h-3.5" />
                15 Characters
              </span>
              <span className="flex items-center gap-1.5 text-[#10b981]">
                <MapPin className="w-3.5 h-3.5" />
                8 Locations
              </span>
              <span className="flex items-center gap-1.5 text-[#f59e0b]">
                <Calendar className="w-3.5 h-3.5" />
                5 Events
              </span>
            </div>
          </Link>

          {/* Empty State Card */}
          <button className="bg-[#0d0d0d] hover:bg-[#111111] rounded-xl border border-dashed border-[#252525] hover:border-[#38bdf8]/30 p-6 flex flex-col items-center justify-center text-center min-h-[200px] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] group-hover:bg-[#38bdf8]/10 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 text-[#444] group-hover:text-[#38bdf8] transition-colors" />
            </div>
            <p className="text-[#666] group-hover:text-[#888] transition-colors">
              Create your first universe
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
