export interface CastProfile {
  castName: string;
  entityId: string;

  // Photos
  photoUrl: string | null;
  photoSource: string | null;

  // Bio
  bio: string | null;
  age: number | null;
  occupation: string | null;

  // Show history
  showHistory: { show: string; seasons: string[]; role?: string }[];

  // Social media (verified links)
  socialMedia: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
  };

  // Relationships (from the show)
  relationships: { name: string; type: string; notes?: string }[];

  // Recent news/press
  recentNews: { title: string; url: string; date?: string; source: string }[];

  // Hometown/location
  location: string | null;

  // Raw source data
  sources: { engine: 'perplexity' | 'grok'; query: string; timestamp: string }[];

  enrichedAt: string;
}

export interface EnrichmentResult {
  success: boolean;
  profile: CastProfile | null;
  errors: string[];
}
