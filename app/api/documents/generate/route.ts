/**
 * Document Generation API
 *
 * POST /api/documents/generate
 * Fill a template with production data and return the rendered document.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTemplate,
  renderHtml,
  renderDocx,
  loadTemplateFile,
} from '@/lib/template-engine';

export async function POST(request: NextRequest) {
  try {
    const { templateId, overrides } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'templateId is required' } },
        { status: 400 }
      );
    }

    const template = await getTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      );
    }

    // Build data from overrides (production context could be added here)
    const data: Record<string, string> = {
      production_name: '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      ...overrides,
    };

    // Handle .docx templates
    if (template.sourceFormat === 'docx' && template.storagePath) {
      const templateBuffer = await loadTemplateFile(template.storagePath);
      const rendered = renderDocx(templateBuffer, data);

      return new Response(new Uint8Array(rendered), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${template.slug}.docx"`,
        },
      });
    }

    // Handle HTML/text templates
    if (template.content) {
      const rendered = renderHtml(template.content, data);

      return NextResponse.json({
        success: true,
        data: {
          templateId: template.id,
          templateName: template.name,
          content: rendered,
          format: template.sourceFormat,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'NO_CONTENT', message: 'Template has no content or storage path' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate document' } },
      { status: 500 }
    );
  }
}
