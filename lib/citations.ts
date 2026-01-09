/**
 * Lexicon Citation Parser
 *
 * Parses citation markers from AI response text and converts them
 * to interactive Citation objects for rendering in the chat interface.
 *
 * Supported citation formats:
 * - Entity: [Entity: D'Artagnan]
 * - Relationship: [Rel: D'Artagnan -> Three Musketeers (loves)]
 * - Web: [Web: Wikipedia - The Three Musketeers]
 */

import type { Citation, CitationType } from '@/types/chat';
import type { RelationshipType } from '@/types/index';

// ============================================
// Citation Regex Patterns
// ============================================

/**
 * Regex pattern for entity citations
 * Format: [Entity: EntityName]
 * Examples:
 *   [Entity: D'Artagnan]
 *   [Entity: Cardinal Richelieu]
 */
const ENTITY_CITATION_REGEX = /\[Entity:\s*([^\]]+)\]/g;

/**
 * Regex pattern for relationship citations
 * Format: [Rel: SourceEntity -> TargetEntity (relationshipType)]
 * Examples:
 *   [Rel: D'Artagnan -> Constance Bonacieux (loves)]
 *   [Rel: Athos -> Three Musketeers (member_of)]
 */
const RELATIONSHIP_CITATION_REGEX = /\[Rel:\s*([^->]+)\s*->\s*([^(]+)\s*\(([^)]+)\)\]/g;

/**
 * Regex pattern for web citations
 * Format: [Web: Source - Title] or [Web: URL]
 * Examples:
 *   [Web: Wikipedia - The Three Musketeers]
 *   [Web: https://example.com/article]
 */
const WEB_CITATION_REGEX = /\[Web:\s*([^\]]+)\]/g;

/**
 * Combined regex for all citation types (for replacement)
 * Note: Must match the specific patterns, not just any bracketed content
 */
const ALL_CITATIONS_REGEX = /\[Entity:\s*[^\]]+\]|\[Rel:\s*[^->]+\s*->\s*[^(]+\s*\([^)]+\)\]|\[Web:\s*[^\]]+\]/g;

// ============================================
// ID Generation
// ============================================

/**
 * Generate a unique ID for a citation
 *
 * Uses a combination of timestamp and random string for uniqueness
 */
export function generateCitationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `cite_${timestamp}_${randomPart}`;
}

// ============================================
// Citation Parsing Functions
// ============================================

/**
 * Parse entity citations from text
 *
 * @param text - The AI response text
 * @returns Array of entity citations
 */
function parseEntityCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  ENTITY_CITATION_REGEX.lastIndex = 0;

  while ((match = ENTITY_CITATION_REGEX.exec(text)) !== null) {
    const entityName = match[1].trim();

    citations.push({
      id: generateCitationId(),
      type: 'entity' as CitationType,
      label: entityName,
      // entityId and entityType will be populated during rendering
      // when we can look up the actual entity
    });
  }

  return citations;
}

/**
 * Parse relationship citations from text
 *
 * @param text - The AI response text
 * @returns Array of relationship citations
 */
function parseRelationshipCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  RELATIONSHIP_CITATION_REGEX.lastIndex = 0;

  while ((match = RELATIONSHIP_CITATION_REGEX.exec(text)) !== null) {
    const fromEntity = match[1].trim();
    const toEntity = match[2].trim();
    const relType = match[3].trim() as RelationshipType;

    const label = `${fromEntity} -> ${toEntity}`;

    citations.push({
      id: generateCitationId(),
      type: 'relationship' as CitationType,
      label,
      fromEntity,
      toEntity,
      relationshipType: relType,
      // relationshipId will be populated during rendering
    });
  }

  return citations;
}

/**
 * Parse web citations from text
 *
 * @param text - The AI response text
 * @returns Array of web citations
 */
function parseWebCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  WEB_CITATION_REGEX.lastIndex = 0;

  while ((match = WEB_CITATION_REGEX.exec(text)) !== null) {
    const content = match[1].trim();

    // Check if content is a URL
    const isUrl = content.startsWith('http://') || content.startsWith('https://');

    if (isUrl) {
      citations.push({
        id: generateCitationId(),
        type: 'web' as CitationType,
        label: content,
        url: content,
        title: content,
      });
    } else {
      // Parse "Source - Title" format
      const dashIndex = content.indexOf(' - ');
      if (dashIndex > -1) {
        const source = content.substring(0, dashIndex).trim();
        const title = content.substring(dashIndex + 3).trim();

        citations.push({
          id: generateCitationId(),
          type: 'web' as CitationType,
          label: `${source}: ${title}`,
          title,
          snippet: source,
        });
      } else {
        // Just a source name without title
        citations.push({
          id: generateCitationId(),
          type: 'web' as CitationType,
          label: content,
          title: content,
        });
      }
    }
  }

  return citations;
}

/**
 * Parse citation markers from AI response text
 *
 * Supported formats:
 * - Entity: [Entity: D'Artagnan]
 * - Relationship: [Rel: D'Artagnan -> Three Musketeers (loves)]
 * - Web: [Web: Wikipedia - Title]
 *
 * @param text - The AI response text
 * @returns Array of parsed citations
 */
export function parseCitationsFromText(text: string): Citation[] {
  const entityCitations = parseEntityCitations(text);
  const relationshipCitations = parseRelationshipCitations(text);
  const webCitations = parseWebCitations(text);

  return [...entityCitations, ...relationshipCitations, ...webCitations];
}

// ============================================
// Citation Transformation Functions
// ============================================

/**
 * Replace citation markers with placeholder tokens for rendering
 *
 * Replaces [Entity: X], [Rel: X -> Y (Z)], [Web: X] with numbered tokens [1], [2], etc.
 * This allows the UI to render citations as clickable chips.
 *
 * @param text - Original text with citation markers
 * @returns Text with markers replaced by numbered tokens and the parsed citations
 */
export function replaceCitationsWithTokens(text: string): {
  text: string;
  citations: Citation[];
} {
  const citations: Citation[] = [];
  let citationIndex = 0;

  // Track citations in order of appearance for consistent numbering
  const citationMap = new Map<string, number>();

  // Process the text and replace citations with numbered tokens
  let processedText = text;

  // Process entity citations
  ENTITY_CITATION_REGEX.lastIndex = 0;
  processedText = processedText.replace(ENTITY_CITATION_REGEX, (match, entityName) => {
    const label = entityName.trim();
    const existingIndex = citationMap.get(`entity:${label}`);

    if (existingIndex !== undefined) {
      return `[${existingIndex + 1}]`;
    }

    const citation: Citation = {
      id: generateCitationId(),
      type: 'entity' as CitationType,
      label,
    };

    citations.push(citation);
    citationMap.set(`entity:${label}`, citationIndex);
    const tokenNumber = citationIndex + 1;
    citationIndex++;

    return `[${tokenNumber}]`;
  });

  // Process relationship citations
  RELATIONSHIP_CITATION_REGEX.lastIndex = 0;
  processedText = processedText.replace(
    RELATIONSHIP_CITATION_REGEX,
    (match, fromEntity, toEntity, relType) => {
      const from = fromEntity.trim();
      const to = toEntity.trim();
      const type = relType.trim() as RelationshipType;
      const label = `${from} -> ${to}`;
      const key = `rel:${from}:${to}:${type}`;
      const existingIndex = citationMap.get(key);

      if (existingIndex !== undefined) {
        return `[${existingIndex + 1}]`;
      }

      const citation: Citation = {
        id: generateCitationId(),
        type: 'relationship' as CitationType,
        label,
        fromEntity: from,
        toEntity: to,
        relationshipType: type,
      };

      citations.push(citation);
      citationMap.set(key, citationIndex);
      const tokenNumber = citationIndex + 1;
      citationIndex++;

      return `[${tokenNumber}]`;
    }
  );

  // Process web citations
  WEB_CITATION_REGEX.lastIndex = 0;
  processedText = processedText.replace(WEB_CITATION_REGEX, (match, content) => {
    const trimmedContent = content.trim();
    const existingIndex = citationMap.get(`web:${trimmedContent}`);

    if (existingIndex !== undefined) {
      return `[${existingIndex + 1}]`;
    }

    const isUrl =
      trimmedContent.startsWith('http://') || trimmedContent.startsWith('https://');

    let citation: Citation;

    if (isUrl) {
      citation = {
        id: generateCitationId(),
        type: 'web' as CitationType,
        label: trimmedContent,
        url: trimmedContent,
        title: trimmedContent,
      };
    } else {
      const dashIndex = trimmedContent.indexOf(' - ');
      if (dashIndex > -1) {
        const source = trimmedContent.substring(0, dashIndex).trim();
        const title = trimmedContent.substring(dashIndex + 3).trim();

        citation = {
          id: generateCitationId(),
          type: 'web' as CitationType,
          label: `${source}: ${title}`,
          title,
          snippet: source,
        };
      } else {
        citation = {
          id: generateCitationId(),
          type: 'web' as CitationType,
          label: trimmedContent,
          title: trimmedContent,
        };
      }
    }

    citations.push(citation);
    citationMap.set(`web:${trimmedContent}`, citationIndex);
    const tokenNumber = citationIndex + 1;
    citationIndex++;

    return `[${tokenNumber}]`;
  });

  return {
    text: processedText,
    citations,
  };
}

// ============================================
// Citation Display Helpers
// ============================================

/**
 * Convert citation to display label
 *
 * Returns a human-readable label for displaying in the UI
 *
 * @param citation - The citation object
 * @returns A display-friendly label
 */
export function getCitationLabel(citation: Citation): string {
  switch (citation.type) {
    case 'entity':
      return citation.label;

    case 'relationship':
      if (citation.fromEntity && citation.toEntity && citation.relationshipType) {
        return `${citation.fromEntity} ${formatRelationshipType(citation.relationshipType)} ${citation.toEntity}`;
      }
      return citation.label;

    case 'web':
      if (citation.title) {
        return citation.title;
      }
      if (citation.url) {
        // Extract domain from URL for cleaner display
        try {
          const url = new URL(citation.url);
          return url.hostname;
        } catch {
          return citation.url;
        }
      }
      return citation.label;

    default:
      return citation.label;
  }
}

/**
 * Format relationship type for display
 *
 * Converts snake_case relationship types to readable format
 *
 * @param type - The relationship type
 * @returns Formatted relationship type
 */
function formatRelationshipType(type: RelationshipType): string {
  const typeMap: Record<RelationshipType, string> = {
    knows: 'knows',
    loves: 'loves',
    opposes: 'opposes',
    works_for: 'works for',
    family_of: 'is family of',
    located_at: 'is located at',
    participated_in: 'participated in',
    possesses: 'possesses',
    member_of: 'is member of',
  };

  return typeMap[type] || type.replace(/_/g, ' ');
}

/**
 * Get citation type icon name for UI rendering
 *
 * @param type - The citation type
 * @returns Icon name (for use with Lucide icons)
 */
export function getCitationIcon(type: CitationType): string {
  switch (type) {
    case 'entity':
      return 'User';
    case 'relationship':
      return 'Link';
    case 'web':
      return 'Globe';
    default:
      return 'FileText';
  }
}

/**
 * Get citation type color class for UI styling
 *
 * @param type - The citation type
 * @returns Tailwind CSS color classes
 */
export function getCitationColorClass(type: CitationType): string {
  switch (type) {
    case 'entity':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'relationship':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'web':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
}

// ============================================
// Citation Deduplication
// ============================================

/**
 * Deduplicate citations by label
 *
 * Removes duplicate citations based on their label and type.
 * Keeps the first occurrence of each unique citation.
 *
 * @param citations - Array of citations
 * @returns Deduplicated array of citations
 */
export function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const unique: Citation[] = [];

  for (const citation of citations) {
    // Create a unique key based on type and label
    const key = `${citation.type}:${citation.label.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(citation);
    }
  }

  return unique;
}

/**
 * Merge citations by normalizing duplicates
 *
 * Similar to deduplication but preserves additional metadata from duplicates
 *
 * @param citations - Array of citations
 * @returns Merged array of citations with combined metadata
 */
export function mergeCitations(citations: Citation[]): Citation[] {
  const citationMap = new Map<string, Citation>();

  for (const citation of citations) {
    const key = `${citation.type}:${citation.label.toLowerCase()}`;
    const existing = citationMap.get(key);

    if (existing) {
      // Merge metadata: keep first ID but update with any new information
      citationMap.set(key, {
        ...existing,
        entityId: existing.entityId || citation.entityId,
        entityType: existing.entityType || citation.entityType,
        relationshipId: existing.relationshipId || citation.relationshipId,
        url: existing.url || citation.url,
        title: existing.title || citation.title,
        snippet: existing.snippet || citation.snippet,
      });
    } else {
      citationMap.set(key, citation);
    }
  }

  return Array.from(citationMap.values());
}

// ============================================
// Citation Validation
// ============================================

/**
 * Validate a citation object
 *
 * @param citation - The citation to validate
 * @returns True if the citation is valid
 */
export function isValidCitation(citation: unknown): citation is Citation {
  if (!citation || typeof citation !== 'object') {
    return false;
  }

  const c = citation as Record<string, unknown>;

  // Required fields
  if (typeof c.id !== 'string' || c.id.length === 0) {
    return false;
  }

  if (!['entity', 'relationship', 'web'].includes(c.type as string)) {
    return false;
  }

  if (typeof c.label !== 'string' || c.label.length === 0) {
    return false;
  }

  return true;
}

/**
 * Sanitize citation text to prevent injection
 *
 * @param text - Raw text that might contain malicious content
 * @returns Sanitized text
 */
export function sanitizeCitationText(text: string): string {
  // Remove potential script tags and event handlers
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// ============================================
// Streaming Support
// ============================================

/**
 * Extract partial citations from streaming text
 *
 * Used during streaming to detect incomplete citation markers
 * that might be complete in the next chunk.
 *
 * @param text - Current streaming buffer
 * @returns Object with complete citations and remaining text
 */
export function extractPartialCitations(text: string): {
  completeCitations: Citation[];
  remainingText: string;
  hasPartialCitation: boolean;
} {
  // Check for incomplete citation markers
  const openBracketIndex = text.lastIndexOf('[');
  const closeBracketIndex = text.lastIndexOf(']');

  // If we have an open bracket without a matching close bracket,
  // there might be a partial citation
  const hasPartialCitation =
    openBracketIndex > closeBracketIndex && text.substring(openBracketIndex).match(/^\[(?:Entity|Rel|Web):/);

  if (hasPartialCitation) {
    const completeText = text.substring(0, openBracketIndex);
    const partialText = text.substring(openBracketIndex);

    return {
      completeCitations: parseCitationsFromText(completeText),
      remainingText: partialText,
      hasPartialCitation: true,
    };
  }

  return {
    completeCitations: parseCitationsFromText(text),
    remainingText: '',
    hasPartialCitation: false,
  };
}

// ============================================
// Utility Exports
// ============================================

/**
 * Check if text contains any citation markers
 */
export function hasCitations(text: string): boolean {
  // Create a new regex instance to avoid lastIndex issues with global flag
  const regex = /\[Entity:\s*[^\]]+\]|\[Rel:\s*[^->]+\s*->\s*[^(]+\s*\([^)]+\)\]|\[Web:\s*[^\]]+\]/;
  return regex.test(text);
}

/**
 * Remove all citation markers from text
 *
 * @param text - Text with citation markers
 * @returns Clean text without markers
 */
export function stripCitations(text: string): string {
  return text.replace(ALL_CITATIONS_REGEX, '').replace(/\s+/g, ' ').trim();
}

/**
 * Count citations in text
 *
 * @param text - Text to count citations in
 * @returns Count of citation markers
 */
export function countCitations(text: string): number {
  const matches = text.match(ALL_CITATIONS_REGEX);
  return matches ? matches.length : 0;
}
