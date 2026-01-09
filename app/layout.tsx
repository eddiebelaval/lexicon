import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lexicon | Wikipedia + Perplexity for Story Universes',
  description:
    'Search your narrative world like a wiki. Get answers synthesized from your knowledge graph + the live web.',
  keywords: ['story universe', 'worldbuilding', 'knowledge graph', 'narrative', 'wiki'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-surface-primary font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
