/**
 * Conversations API Route - Collection Operations
 *
 * GET /api/chat/conversations?universeId=xxx - List conversations for a universe
 * POST /api/chat/conversations - Create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listConversations,
  createConversation,
} from '@/lib/conversations';
import type { ApiResponse, ApiError } from '@/types';
import type { Conversation, CreateConversationInput } from '@/types/chat';

/**
 * GET /api/chat/conversations
 * List all conversations for a universe
 *
 * Query params:
 * - universeId (required): UUID of the universe
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Conversation[]> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const universeId = searchParams.get('universeId');

    // Validate required parameters
    if (!universeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'universeId parameter is required',
          },
        },
        { status: 400 }
      );
    }

    // Fetch conversations
    const conversations = await listConversations(universeId);

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Error listing conversations:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list conversations',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Create a new conversation
 *
 * Request body:
 * {
 *   universeId: string,
 *   title?: string
 * }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Conversation> | ApiError>> {
  try {
    const body = await request.json();
    const { universeId, title } = body as CreateConversationInput;

    // Validate required fields
    if (!universeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'universeId is required',
          },
        },
        { status: 400 }
      );
    }

    // Create conversation
    const conversation = await createConversation({
      universeId,
      title: title || 'New Conversation',
    });

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATION_ERROR',
            message: 'Failed to create conversation',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: conversation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating conversation:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create conversation',
        },
      },
      { status: 500 }
    );
  }
}
