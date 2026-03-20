import type { Metadata } from 'next';
import { Playfair_Display, Outfit } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

const playfair = Playfair_Display({
  weight: ['700', '900'],
  subsets: ['latin'],
  variable: '--font-playfair',
});

const outfit = Outfit({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-outfit',
});

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
      className={`${outfit.variable} ${playfair.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-surface-primary font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
