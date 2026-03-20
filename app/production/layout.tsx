'use client';

import { Sidebar, MobileNav } from '@/components/shell';
import { ProductionProvider } from '@/components/production/production-context';

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductionProvider>
      <div className="shell-layout">
        <Sidebar />
        <div className="shell-content">
          <div className="shell-mobile-header">
            <MobileNav />
            <span className="shell-mobile-title">Lexicon</span>
          </div>
          <main className="shell-main">
            {children}
          </main>
        </div>
      </div>
    </ProductionProvider>
  );
}
