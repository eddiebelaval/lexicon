'use client';

/**
 * Wiki Table of Contents - Navigation sidebar
 *
 * Sticky navigation with scroll-spy highlighting
 * following Wikipedia's clean navigation pattern.
 */

import { BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocSection {
  id: string;
  label: string;
  count: number | null;
}

interface WikiTableOfContentsProps {
  sections: TocSection[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function WikiTableOfContents({
  sections,
  activeSection,
  onSectionClick
}: WikiTableOfContentsProps) {
  return (
    <nav className="sticky top-0 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-sidebar-border">
        <BookOpen className="w-4 h-4 text-vhs-400" />
        <span className="text-sm font-semibold text-foreground">Contents</span>
      </div>

      {/* Section Links */}
      <ul className="space-y-1">
        {sections.map((section, index) => {
          const isActive = activeSection === section.id;

          return (
            <li key={section.id}>
              <button
                onClick={() => onSectionClick(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-active text-vhs-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
                )}
              >
                {/* Section Number */}
                <span className={cn(
                  "w-5 h-5 flex items-center justify-center text-xs rounded",
                  isActive
                    ? "bg-vhs-900 text-vhs-400"
                    : "bg-surface-tertiary text-muted-foreground/60 group-hover:bg-surface-elevated"
                )}>
                  {index + 1}
                </span>

                {/* Section Label */}
                <span className="flex-1 text-left truncate">{section.label}</span>

                {/* Count Badge */}
                {section.count !== null && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    isActive
                      ? "bg-vhs-900 text-vhs-400"
                      : "bg-surface-tertiary text-muted-foreground/60"
                  )}>
                    {section.count}
                  </span>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-vhs-400" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer hint */}
      <div className="mt-6 pt-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground/50">
          Click to navigate sections
        </p>
      </div>
    </nav>
  );
}
