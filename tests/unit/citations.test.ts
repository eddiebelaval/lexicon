/**
 * Citation Parser Tests
 *
 * Tests for parsing citation markers from AI response text.
 */

import { describe, it, expect } from 'vitest';
import {
  parseCitationsFromText,
  replaceCitationsWithTokens,
  getCitationLabel,
  generateCitationId,
  deduplicateCitations,
  mergeCitations,
  hasCitations,
  stripCitations,
  countCitations,
  isValidCitation,
  sanitizeCitationText,
  extractPartialCitations,
  getCitationIcon,
  getCitationColorClass,
} from '@/lib/citations';
import type { Citation } from '@/types/chat';

describe('generateCitationId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateCitationId();
    const id2 = generateCitationId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^cite_[a-z0-9]+_[a-z0-9]+$/);
    expect(id2).toMatch(/^cite_[a-z0-9]+_[a-z0-9]+$/);
  });

  it('should generate IDs with cite_ prefix', () => {
    const id = generateCitationId();
    expect(id.startsWith('cite_')).toBe(true);
  });
});

describe('parseCitationsFromText', () => {
  describe('Entity Citations', () => {
    it('should parse a single entity citation', () => {
      const text = "D'Artagnan [Entity: D'Artagnan] is a young swordsman.";
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe('entity');
      expect(citations[0].label).toBe("D'Artagnan");
    });

    it('should parse multiple entity citations', () => {
      const text = '[Entity: Athos], [Entity: Porthos], and [Entity: Aramis] are the three musketeers.';
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(3);
      expect(citations.map((c) => c.label)).toEqual(['Athos', 'Porthos', 'Aramis']);
    });

    it('should handle entity names with special characters', () => {
      const text = "[Entity: Cardinal Richelieu] and [Entity: D'Artagnan] are rivals.";
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(2);
      expect(citations[0].label).toBe('Cardinal Richelieu');
      expect(citations[1].label).toBe("D'Artagnan");
    });

    it('should trim whitespace from entity names', () => {
      const text = '[Entity:   Athos   ] is noble.';
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].label).toBe('Athos');
    });
  });

  describe('Relationship Citations', () => {
    it('should parse a single relationship citation', () => {
      const text = "They are in love [Rel: D'Artagnan -> Constance Bonacieux (loves)].";
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe('relationship');
      expect(citations[0].label).toBe("D'Artagnan -> Constance Bonacieux");
      expect(citations[0].fromEntity).toBe("D'Artagnan");
      expect(citations[0].toEntity).toBe('Constance Bonacieux');
      expect(citations[0].relationshipType).toBe('loves');
    });

    it('should parse multiple relationship citations', () => {
      const text = `
        [Rel: Athos -> Musketeers (member_of)] and
        [Rel: Porthos -> Musketeers (member_of)] are both members.
      `;
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(2);
      expect(citations[0].relationshipType).toBe('member_of');
      expect(citations[1].relationshipType).toBe('member_of');
    });

    it('should handle relationship types with underscores', () => {
      const text = '[Rel: Character -> Organization (works_for)] shows employment.';
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].relationshipType).toBe('works_for');
    });
  });

  describe('Web Citations', () => {
    it('should parse a web citation with source and title', () => {
      const text = 'According to [Web: Wikipedia - The Three Musketeers], the story is set in France.';
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe('web');
      expect(citations[0].label).toBe('Wikipedia: The Three Musketeers');
      expect(citations[0].title).toBe('The Three Musketeers');
      expect(citations[0].snippet).toBe('Wikipedia');
    });

    it('should parse a web citation with URL', () => {
      const text = 'See [Web: https://example.com/article] for more.';
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe('web');
      expect(citations[0].url).toBe('https://example.com/article');
    });

    it('should parse a web citation with just source name', () => {
      const text = 'According to [Web: Encyclopedia Britannica], the facts are clear.';
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe('web');
      expect(citations[0].label).toBe('Encyclopedia Britannica');
      expect(citations[0].title).toBe('Encyclopedia Britannica');
    });
  });

  describe('Mixed Citations', () => {
    it('should parse mixed citation types', () => {
      const text = `
        [Entity: D'Artagnan] loves [Entity: Constance]
        [Rel: D'Artagnan -> Constance (loves)] as shown in
        [Web: Wikipedia - The Three Musketeers].
      `;
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(4);
      expect(citations.filter((c) => c.type === 'entity')).toHaveLength(2);
      expect(citations.filter((c) => c.type === 'relationship')).toHaveLength(1);
      expect(citations.filter((c) => c.type === 'web')).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array for text without citations', () => {
      const text = 'This is plain text without any citations.';
      const citations = parseCitationsFromText(text);

      expect(citations).toHaveLength(0);
    });

    it('should ignore malformed citations', () => {
      const text = '[Entity:] and [Rel: incomplete] are invalid.';
      const citations = parseCitationsFromText(text);

      // Malformed citations should be skipped entirely
      // [Entity:] has empty content, [Rel: incomplete] lacks proper format
      expect(citations).toHaveLength(0);
    });

    it('should handle empty string', () => {
      const citations = parseCitationsFromText('');
      expect(citations).toHaveLength(0);
    });
  });
});

describe('replaceCitationsWithTokens', () => {
  it('should replace entity citations with numbered tokens', () => {
    const text = '[Entity: Athos] and [Entity: Porthos] are friends.';
    const result = replaceCitationsWithTokens(text);

    expect(result.text).toBe('[1] and [2] are friends.');
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0].label).toBe('Athos');
    expect(result.citations[1].label).toBe('Porthos');
  });

  it('should deduplicate repeated citations', () => {
    const text = '[Entity: Athos] is brave. [Entity: Athos] is also noble.';
    const result = replaceCitationsWithTokens(text);

    expect(result.text).toBe('[1] is brave. [1] is also noble.');
    expect(result.citations).toHaveLength(1);
  });

  it('should handle all citation types', () => {
    const text = `
      [Entity: Character] has [Rel: Character -> Group (member_of)]
      per [Web: Source - Title].
    `;
    const result = replaceCitationsWithTokens(text);

    expect(result.text).toContain('[1]');
    expect(result.text).toContain('[2]');
    expect(result.text).toContain('[3]');
    expect(result.citations).toHaveLength(3);
  });

  it('should preserve text structure', () => {
    const text = 'Start [Entity: Test] middle [Entity: Other] end.';
    const result = replaceCitationsWithTokens(text);

    expect(result.text).toBe('Start [1] middle [2] end.');
  });

  it('should return original text with empty citations when no citations present', () => {
    const text = 'No citations here.';
    const result = replaceCitationsWithTokens(text);

    expect(result.text).toBe('No citations here.');
    expect(result.citations).toHaveLength(0);
  });
});

describe('getCitationLabel', () => {
  it('should return label for entity citations', () => {
    const citation: Citation = {
      id: 'test-id',
      type: 'entity',
      label: 'Test Entity',
    };

    expect(getCitationLabel(citation)).toBe('Test Entity');
  });

  it('should format relationship citations nicely', () => {
    const citation: Citation = {
      id: 'test-id',
      type: 'relationship',
      label: 'A -> B',
      fromEntity: 'Character A',
      toEntity: 'Character B',
      relationshipType: 'loves',
    };

    expect(getCitationLabel(citation)).toBe('Character A loves Character B');
  });

  it('should format works_for relationship correctly', () => {
    const citation: Citation = {
      id: 'test-id',
      type: 'relationship',
      label: 'A -> B',
      fromEntity: 'Employee',
      toEntity: 'Company',
      relationshipType: 'works_for',
    };

    expect(getCitationLabel(citation)).toBe('Employee works for Company');
  });

  it('should return title for web citations with title', () => {
    const citation: Citation = {
      id: 'test-id',
      type: 'web',
      label: 'Source: Title',
      title: 'Article Title',
      url: 'https://example.com',
    };

    expect(getCitationLabel(citation)).toBe('Article Title');
  });

  it('should extract hostname for web citations with only URL', () => {
    const citation: Citation = {
      id: 'test-id',
      type: 'web',
      label: 'https://example.com/path',
      url: 'https://example.com/path',
    };

    expect(getCitationLabel(citation)).toBe('example.com');
  });
});

describe('deduplicateCitations', () => {
  it('should remove duplicate citations by label', () => {
    const citations: Citation[] = [
      { id: '1', type: 'entity', label: 'Test' },
      { id: '2', type: 'entity', label: 'Test' },
      { id: '3', type: 'entity', label: 'Other' },
    ];

    const result = deduplicateCitations(citations);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1'); // Keeps first occurrence
    expect(result[1].label).toBe('Other');
  });

  it('should be case-insensitive', () => {
    const citations: Citation[] = [
      { id: '1', type: 'entity', label: 'Test' },
      { id: '2', type: 'entity', label: 'TEST' },
      { id: '3', type: 'entity', label: 'test' },
    ];

    const result = deduplicateCitations(citations);

    expect(result).toHaveLength(1);
  });

  it('should treat different types as different citations', () => {
    const citations: Citation[] = [
      { id: '1', type: 'entity', label: 'Test' },
      { id: '2', type: 'web', label: 'Test' },
    ];

    const result = deduplicateCitations(citations);

    expect(result).toHaveLength(2);
  });

  it('should handle empty array', () => {
    const result = deduplicateCitations([]);
    expect(result).toHaveLength(0);
  });
});

describe('mergeCitations', () => {
  it('should merge metadata from duplicate citations', () => {
    const citations: Citation[] = [
      { id: '1', type: 'entity', label: 'Test', entityId: 'ent-1' },
      { id: '2', type: 'entity', label: 'Test', entityType: 'character' },
    ];

    const result = mergeCitations(citations);

    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe('ent-1');
    expect(result[0].entityType).toBe('character');
  });

  it('should preserve first ID when merging', () => {
    const citations: Citation[] = [
      { id: 'first', type: 'entity', label: 'Test' },
      { id: 'second', type: 'entity', label: 'Test' },
    ];

    const result = mergeCitations(citations);

    expect(result[0].id).toBe('first');
  });
});

describe('hasCitations', () => {
  it('should return true for text with entity citations', () => {
    expect(hasCitations('[Entity: Test]')).toBe(true);
  });

  it('should return true for text with relationship citations', () => {
    expect(hasCitations('[Rel: A -> B (loves)]')).toBe(true);
  });

  it('should return true for text with web citations', () => {
    expect(hasCitations('[Web: Source - Title]')).toBe(true);
  });

  it('should return false for text without citations', () => {
    expect(hasCitations('Plain text')).toBe(false);
  });

  it('should return false for similar but invalid patterns', () => {
    expect(hasCitations('[Something: Test]')).toBe(false);
    expect(hasCitations('[entity: Test]')).toBe(false); // case sensitive
  });
});

describe('stripCitations', () => {
  it('should remove all citation markers', () => {
    const text = '[Entity: Athos] and [Entity: Porthos] are friends.';
    const result = stripCitations(text);

    expect(result).toBe('and are friends.');
  });

  it('should handle multiple spaces after removal', () => {
    const text = 'Start [Entity: Test] [Entity: Other] end.';
    const result = stripCitations(text);

    expect(result).toBe('Start end.');
  });

  it('should return same text if no citations', () => {
    const text = 'No citations here.';
    expect(stripCitations(text)).toBe(text);
  });
});

describe('countCitations', () => {
  it('should count citations correctly', () => {
    const text = '[Entity: A] and [Entity: B] with [Web: Source]';
    expect(countCitations(text)).toBe(3);
  });

  it('should return 0 for no citations', () => {
    expect(countCitations('Plain text')).toBe(0);
  });
});

describe('isValidCitation', () => {
  it('should return true for valid entity citation', () => {
    const citation: Citation = {
      id: 'test-id',
      type: 'entity',
      label: 'Test',
    };

    expect(isValidCitation(citation)).toBe(true);
  });

  it('should return true for valid relationship citation', () => {
    const citation: Citation = {
      id: 'test-id',
      type: 'relationship',
      label: 'A -> B',
      fromEntity: 'A',
      toEntity: 'B',
      relationshipType: 'loves',
    };

    expect(isValidCitation(citation)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidCitation(null)).toBe(false);
  });

  it('should return false for empty object', () => {
    expect(isValidCitation({})).toBe(false);
  });

  it('should return false for missing id', () => {
    expect(isValidCitation({ type: 'entity', label: 'Test' })).toBe(false);
  });

  it('should return false for invalid type', () => {
    expect(isValidCitation({ id: 'test', type: 'invalid', label: 'Test' })).toBe(false);
  });

  it('should return false for missing label', () => {
    expect(isValidCitation({ id: 'test', type: 'entity' })).toBe(false);
  });
});

describe('sanitizeCitationText', () => {
  it('should remove script tags', () => {
    const text = 'Test <script>alert("xss")</script> content';
    const result = sanitizeCitationText(text);

    expect(result).toBe('Test  content');
  });

  it('should remove event handlers', () => {
    const text = 'onclick=malicious content';
    const result = sanitizeCitationText(text);

    expect(result).not.toContain('onclick=');
  });

  it('should remove javascript: URLs', () => {
    const text = 'javascript:alert(1)';
    const result = sanitizeCitationText(text);

    expect(result).not.toContain('javascript:');
  });

  it('should preserve normal text', () => {
    const text = 'Normal citation text';
    expect(sanitizeCitationText(text)).toBe(text);
  });
});

describe('extractPartialCitations', () => {
  it('should detect complete citations', () => {
    const text = 'Full [Entity: Test] citation.';
    const result = extractPartialCitations(text);

    expect(result.completeCitations).toHaveLength(1);
    expect(result.hasPartialCitation).toBe(false);
    expect(result.remainingText).toBe('');
  });

  it('should detect partial entity citation at end', () => {
    const text = 'Some text [Entity: Part';
    const result = extractPartialCitations(text);

    expect(result.hasPartialCitation).toBe(true);
    expect(result.remainingText).toBe('[Entity: Part');
    expect(result.completeCitations).toHaveLength(0);
  });

  it('should extract complete citations before partial', () => {
    const text = '[Entity: Complete] and [Entity: Partial';
    const result = extractPartialCitations(text);

    expect(result.completeCitations).toHaveLength(1);
    expect(result.completeCitations[0].label).toBe('Complete');
    expect(result.hasPartialCitation).toBe(true);
    expect(result.remainingText).toBe('[Entity: Partial');
  });
});

describe('getCitationIcon', () => {
  it('should return User for entity citations', () => {
    expect(getCitationIcon('entity')).toBe('User');
  });

  it('should return Link for relationship citations', () => {
    expect(getCitationIcon('relationship')).toBe('Link');
  });

  it('should return Globe for web citations', () => {
    expect(getCitationIcon('web')).toBe('Globe');
  });
});

describe('getCitationColorClass', () => {
  it('should return blue classes for entity citations', () => {
    const result = getCitationColorClass('entity');
    expect(result).toContain('bg-blue-100');
    expect(result).toContain('text-blue-800');
  });

  it('should return purple classes for relationship citations', () => {
    const result = getCitationColorClass('relationship');
    expect(result).toContain('bg-purple-100');
    expect(result).toContain('text-purple-800');
  });

  it('should return green classes for web citations', () => {
    const result = getCitationColorClass('web');
    expect(result).toContain('bg-green-100');
    expect(result).toContain('text-green-800');
  });
});
