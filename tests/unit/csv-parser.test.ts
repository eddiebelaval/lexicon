/**
 * CSV Parser Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  autoDetectColumnMappings,
  generateSampleCSV,
  exportToCSV,
} from '@/lib/import/csv-parser';

describe('parseCSV', () => {
  it('should parse simple CSV correctly', () => {
    const csv = `name,type,description
D'Artagnan,character,Young swordsman
Athos,character,Noble musketeer`;

    const result = parseCSV(csv);

    expect(result.headers).toEqual(['name', 'type', 'description']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe("D'Artagnan");
    expect(result.rows[0].type).toBe('character');
    expect(result.rows[1].name).toBe('Athos');
    expect(result.errors).toHaveLength(0);
  });

  it('should handle quoted fields with commas', () => {
    const csv = `name,description
Paris,"Capital of France, a beautiful city"`;

    const result = parseCSV(csv);

    expect(result.rows[0].description).toBe(
      'Capital of France, a beautiful city'
    );
    expect(result.errors).toHaveLength(0);
  });

  it('should handle quoted fields with quotes inside', () => {
    const csv = `name,description
Test,"He said ""Hello"" to me"`;

    const result = parseCSV(csv);

    expect(result.rows[0].description).toBe('He said "Hello" to me');
    expect(result.errors).toHaveLength(0);
  });

  it('should handle empty values', () => {
    const csv = `name,type,description
Test,,Some description`;

    const result = parseCSV(csv);

    expect(result.rows[0].type).toBe('');
    expect(result.rows[0].description).toBe('Some description');
  });

  it('should skip empty rows by default', () => {
    const csv = `name,type
First,character

Second,location`;

    const result = parseCSV(csv);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('First');
    expect(result.rows[1].name).toBe('Second');
  });

  it('should detect tab delimiter', () => {
    const csv = `name\ttype\tdescription
Test\tcharacter\tA test entity`;

    const result = parseCSV(csv);

    expect(result.headers).toEqual(['name', 'type', 'description']);
    expect(result.rows[0].name).toBe('Test');
    expect(result.rows[0].type).toBe('character');
  });

  it('should detect semicolon delimiter', () => {
    const csv = `name;type;description
Test;character;A test entity`;

    const result = parseCSV(csv);

    expect(result.headers).toEqual(['name', 'type', 'description']);
    expect(result.rows[0].name).toBe('Test');
  });

  it('should report error for unclosed quotes', () => {
    const csv = `name,description
Test,"Unclosed quote`;

    const result = parseCSV(csv);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('quote');
  });

  it('should report duplicate headers', () => {
    const csv = `name,type,name
Test,character,Duplicate`;

    const result = parseCSV(csv);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Duplicate');
  });

  it('should handle Windows line endings (CRLF)', () => {
    const csv = `name,type\r\nFirst,character\r\nSecond,location`;

    const result = parseCSV(csv);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].type).toBe('character');
    expect(result.rows[1].type).toBe('location');
  });

  it('should trim values by default', () => {
    const csv = `name,type
  Test  ,  character  `;

    const result = parseCSV(csv);

    expect(result.rows[0].name).toBe('Test');
    expect(result.rows[0].type).toBe('character');
  });

  it('should return empty result for empty file', () => {
    const csv = '';

    const result = parseCSV(csv);

    expect(result.headers).toEqual([]);
    expect(result.rows).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('autoDetectColumnMappings', () => {
  it('should detect common column names', () => {
    const headers = ['name', 'type', 'description', 'aliases', 'status'];
    const mappings = autoDetectColumnMappings(headers);

    expect(mappings.name).toBe('name');
    expect(mappings.type).toBe('type');
    expect(mappings.description).toBe('description');
    expect(mappings.aliases).toBe('aliases');
    expect(mappings.status).toBe('status');
  });

  it('should detect alternate column names', () => {
    const headers = ['Title', 'Category', 'Bio', 'AKA', 'State'];
    const mappings = autoDetectColumnMappings(headers);

    expect(mappings.name).toBe('Title');
    expect(mappings.type).toBe('Category');
    expect(mappings.description).toBe('Bio');
    expect(mappings.aliases).toBe('AKA');
    expect(mappings.status).toBe('State');
  });

  it('should return undefined for unrecognized columns', () => {
    const headers = ['foo', 'bar', 'baz'];
    const mappings = autoDetectColumnMappings(headers);

    expect(mappings.name).toBeUndefined();
    expect(mappings.type).toBeUndefined();
    expect(mappings.description).toBeUndefined();
  });
});

describe('generateSampleCSV', () => {
  it('should generate valid CSV with sample data', () => {
    const csv = generateSampleCSV();
    const result = parseCSV(csv);

    expect(result.headers).toContain('name');
    expect(result.headers).toContain('type');
    expect(result.headers).toContain('description');
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });
});

describe('exportToCSV', () => {
  it('should export rows to valid CSV', () => {
    const headers = ['name', 'type'];
    const rows = [
      { name: 'Test', type: 'character' },
      { name: 'Other', type: 'location' },
    ];

    const csv = exportToCSV(headers, rows);
    const result = parseCSV(csv);

    expect(result.headers).toEqual(headers);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('Test');
    expect(result.rows[1].type).toBe('location');
  });

  it('should escape commas and quotes', () => {
    const headers = ['name', 'description'];
    const rows = [{ name: 'Test', description: 'Has, comma and "quotes"' }];

    const csv = exportToCSV(headers, rows);
    const result = parseCSV(csv);

    expect(result.rows[0].description).toBe('Has, comma and "quotes"');
  });
});
