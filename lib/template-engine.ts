/**
 * Document Template Engine
 *
 * Supports two modes:
 * 1. DOCX templates (.docx) — uses docxtemplater to fill {placeholders} in Word files
 * 2. HTML/text templates — simple string replacement of {{placeholders}}
 *
 * Templates are stored in Supabase (metadata in document_templates table,
 * .docx files in Supabase Storage bucket "templates").
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { getServiceSupabase } from './supabase';
import type { DocumentTemplate, CreateDocumentTemplateInput, PaginatedResponse } from '@/types';

// ─── Database Operations ───────────────────────

function parseTemplateFromDb(row: Record<string, unknown>): DocumentTemplate {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? null,
    content: (row.content as string) ?? null,
    sourceFormat: row.source_format as DocumentTemplate['sourceFormat'],
    variables: (row.variables as string[]) ?? [],
    category: row.category as DocumentTemplate['category'],
    storagePath: (row.storage_path as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listTemplates(
  productionId: string,
  options: { category?: string; limit?: number; offset?: number } = {}
): Promise<PaginatedResponse<DocumentTemplate>> {
  const { category, limit = 50, offset = 0 } = options;

  let query = getServiceSupabase()
    .from('document_templates')
    .select('*', { count: 'exact' })
    .eq('production_id', productionId);

  if (category) {
    query = query.eq('category', category);
  }

  query = query.order('name', { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }

  const items = (data || []).map(parseTemplateFromDb);
  const total = count || 0;

  return {
    items,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: offset + items.length < total,
  };
}

export async function getTemplate(id: string): Promise<DocumentTemplate | null> {
  const { data, error } = await getServiceSupabase()
    .from('document_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get template: ${error.message}`);
  }

  return parseTemplateFromDb(data);
}

export async function createTemplate(
  input: CreateDocumentTemplateInput
): Promise<DocumentTemplate> {
  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await getServiceSupabase()
    .from('document_templates')
    .insert({
      production_id: input.productionId,
      name: input.name,
      slug,
      description: input.description || null,
      content: input.content || null,
      source_format: input.sourceFormat || 'html',
      variables: input.variables || [],
      category: input.category || 'custom',
      storage_path: input.storagePath || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return parseTemplateFromDb(data);
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const { error } = await getServiceSupabase()
    .from('document_templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }

  return true;
}

// ─── Template Rendering ────────────────────────

/**
 * Extract {{variable}} placeholders from HTML/text content.
 */
export function extractVariablesFromText(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];

  const vars = new Set<string>();
  for (const match of matches) {
    vars.add(match.replace(/\{\{|\}\}/g, '').trim());
  }
  return Array.from(vars).sort();
}

/**
 * Extract {variable} placeholders from a .docx buffer.
 */
export function extractVariablesFromDocx(buffer: Buffer): string[] {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  // docxtemplater exposes getFullText which contains all placeholders
  const fullText = doc.getFullText();
  const matches = fullText.match(/\{([^}]+)\}/g);
  if (!matches) return [];

  const vars = new Set<string>();
  for (const match of matches) {
    const varName = match.replace(/[{}]/g, '').trim();
    if (varName && !varName.startsWith('#') && !varName.startsWith('/')) {
      vars.add(varName);
    }
  }
  return Array.from(vars).sort();
}

/**
 * Render an HTML/text template by replacing {{placeholders}} with data values.
 */
export function renderHtml(
  templateContent: string,
  data: Record<string, string>
): string {
  return templateContent.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    return trimmed in data ? data[trimmed] : `{{${trimmed}}}`;
  });
}

/**
 * Render a .docx template by filling {placeholders} with data values.
 * Returns the filled document as a Buffer.
 */
export function renderDocx(
  templateBuffer: Buffer,
  data: Record<string, string>
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  doc.render(data);

  const outputBuffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return outputBuffer as Buffer;
}

/**
 * Load a .docx template from Supabase Storage.
 */
export async function loadTemplateFile(storagePath: string): Promise<Buffer> {
  const { data, error } = await getServiceSupabase()
    .storage
    .from('templates')
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download template: ${error?.message || 'No data'}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload a .docx template to Supabase Storage.
 */
export async function uploadTemplateFile(
  productionId: string,
  fileName: string,
  buffer: Buffer,
  contentType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<string> {
  const path = `${productionId}/${Date.now()}-${fileName}`;

  const { error } = await getServiceSupabase()
    .storage
    .from('templates')
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Failed to upload template: ${error.message}`);
  }

  return path;
}
