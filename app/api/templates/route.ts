/**
 * Templates API Routes
 *
 * GET /api/templates - List templates for a production
 * POST /api/templates - Create a template (from content or uploaded .docx)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listTemplates,
  createTemplate,
  extractVariablesFromText,
  extractVariablesFromDocx,
  uploadTemplateFile,
} from '@/lib/template-engine';
import type { ApiResponse, ApiError, DocumentTemplate, PaginatedResponse } from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<DocumentTemplate>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const productionId = searchParams.get('productionId');

    if (!productionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'productionId is required' } },
        { status: 400 }
      );
    }

    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await listTemplates(productionId, { category, limit, offset });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list templates' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DocumentTemplate> | ApiError>> {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const productionId = formData.get('productionId') as string;
      const name = formData.get('name') as string;
      const category = (formData.get('category') as string) || 'custom';
      const description = formData.get('description') as string | null;

      if (!file || !productionId || !name) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'file, productionId, and name are required' } },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = file.name;
      const isDocx = fileName.endsWith('.docx');

      // Extract variables from the template
      let variables: string[] = [];
      if (isDocx) {
        try {
          variables = extractVariablesFromDocx(buffer);
        } catch {
          // If extraction fails, proceed with empty variables
        }
      }

      // Upload to Supabase Storage
      const storagePath = await uploadTemplateFile(productionId, fileName, buffer);

      // Create database record
      const template = await createTemplate({
        productionId,
        name,
        description: description || undefined,
        sourceFormat: isDocx ? 'docx' : 'text',
        variables,
        category: category as DocumentTemplate['category'],
        storagePath,
      });

      return NextResponse.json({ success: true, data: template }, { status: 201 });
    }

    // Handle JSON body (HTML/text template)
    const body = await request.json();
    const { productionId, name, content, category, description, sourceFormat } = body;

    if (!productionId || !name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'productionId and name are required' } },
        { status: 400 }
      );
    }

    const variables = content ? extractVariablesFromText(content) : [];

    const template = await createTemplate({
      productionId,
      name,
      description,
      content,
      sourceFormat: sourceFormat || 'html',
      variables,
      category: category || 'custom',
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create template' } },
      { status: 500 }
    );
  }
}
