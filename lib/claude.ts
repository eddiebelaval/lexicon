/**
 * Claude API Wrapper
 *
 * Provides:
 * - Query understanding (parse user intent, extract entities)
 * - Answer synthesis (combine graph + web results)
 * - Web search augmentation
 */

import Anthropic from '@anthropic-ai/sdk';

// Singleton client instance
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Parse user query to understand intent and extract entities
 */
export interface QueryUnderstanding {
  intent: 'entity_lookup' | 'relationship_query' | 'path_finding' | 'general';
  entities: string[]; // Names mentioned in query
  relationshipType?: string; // If asking about specific relationship
  webSearchRecommended: boolean;
}

export async function parseQuery(
  query: string,
  universeContext?: string
): Promise<QueryUnderstanding> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Analyze this query about a story universe and extract structured information.

Universe context: ${universeContext || 'General story universe'}

Query: "${query}"

Respond in JSON format:
{
  "intent": "entity_lookup" | "relationship_query" | "path_finding" | "general",
  "entities": ["list of entity names mentioned"],
  "relationshipType": "type if asking about specific relationship, or null",
  "webSearchRecommended": true/false (true if query might benefit from web info)
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    return JSON.parse(content.text);
  } catch {
    // Fallback if parsing fails
    return {
      intent: 'general',
      entities: [],
      webSearchRecommended: false,
    };
  }
}

/**
 * Storyline search result for synthesis context
 */
interface StorylineContext {
  id: string;
  title: string;
  synopsis: string | null;
  rank: number;
}

/**
 * Synthesize answer from graph results and optional web results
 */
export interface SearchSource {
  type: 'entity' | 'relationship' | 'web' | 'storyline';
  name: string;
  url?: string;
}

export interface SynthesizedAnswer {
  answer: string;
  sources: SearchSource[];
  confidence: 'high' | 'medium' | 'low';
}

export async function synthesizeAnswer(
  query: string,
  graphResults: {
    entities: Array<{ name: string; description: string; type: string }>;
    relationships: Array<{
      from: string;
      to: string;
      type: string;
      context?: string;
    }>;
  },
  webResults?: Array<{ title: string; snippet: string; url: string }>,
  storylines?: StorylineContext[]
): Promise<SynthesizedAnswer> {
  const graphContext = `
GRAPH DATA:
Entities found:
${graphResults.entities.map((e) => `- ${e.name} (${e.type}): ${e.description}`).join('\n')}

Relationships found:
${graphResults.relationships.map((r) => `- ${r.from} --[${r.type}]--> ${r.to}${r.context ? `: ${r.context}` : ''}`).join('\n')}
`;

  const storylineContext = storylines?.length
    ? `
STORYLINES FOUND:
${storylines.map((s) => `- "${s.title}": ${s.synopsis || 'No synopsis available'}`).join('\n')}
`
    : '';

  const webContext = webResults?.length
    ? `
WEB RESULTS:
${webResults.map((w) => `- ${w.title}: ${w.snippet}`).join('\n')}
`
    : '';

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `You are answering questions about a story universe. Use the provided data to give a clear, narrative answer.

${graphContext}
${storylineContext}
${webContext}

User question: "${query}"

Provide a natural, conversational answer that synthesizes the information. Be specific about relationships and events. Reference storylines when relevant. If information is missing, say so.

After your answer, list the sources you used in this format:
SOURCES:
- [Entity: Name] or [Storyline: Title] or [Web: Title]`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const text = content.text;
  const [answerPart, sourcesPart] = text.split('SOURCES:');

  const sources: SearchSource[] = [];

  // Parse entity sources
  graphResults.entities.forEach((e) => {
    if (answerPart.toLowerCase().includes(e.name.toLowerCase())) {
      sources.push({ type: 'entity', name: e.name });
    }
  });

  // Parse storyline sources
  storylines?.forEach((s) => {
    if (answerPart.toLowerCase().includes(s.title.toLowerCase()) ||
        sourcesPart?.includes(s.title)) {
      sources.push({ type: 'storyline', name: s.title });
    }
  });

  // Parse web sources
  webResults?.forEach((w) => {
    if (sourcesPart?.includes(w.title)) {
      sources.push({ type: 'web', name: w.title, url: w.url });
    }
  });

  // Determine confidence based on available data
  const hasGraphData = graphResults.entities.length > 0 || graphResults.relationships.length > 0;
  const hasStorylines = (storylines?.length || 0) > 0;
  const hasWebData = (webResults?.length || 0) > 0;

  return {
    answer: answerPart.trim(),
    sources,
    confidence:
      hasGraphData || hasStorylines
        ? 'high'
        : hasWebData
          ? 'medium'
          : 'low',
  };
}
