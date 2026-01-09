/**
 * Individual Conversation API Route
 *
 * GET /api/chat/conversations/[id] - Get conversation with all messages
 * PATCH /api/chat/conversations/[id] - Update conversation (e.g., title)
 * DELETE /api/chat/conversations/[id] - Delete conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getConversation,
  updateConversationTitle,
  deleteConversation,
} from '@/lib/conversations';
import type { ApiResponse, ApiError } from '@/types';
import type { Conversation, Message } from '@/types/chat';

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

/**
 * GET /api/chat/conversations/[id]
 * Get a conversation with all its messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ConversationWithMessages> | ApiError>> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Conversation ID is required',
        },
      },
      { status: 400 }
    );
  }

  try {
    const conversation = await getConversation(id);

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch conversation',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/conversations/[id]
 * Update conversation properties
 *
 * Request body:
 * {
 *   title?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Conversation> | ApiError>> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Conversation ID is required',
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'title is required and must be a string',
          },
        },
        { status: 400 }
      );
    }

    const conversation = await updateConversationTitle(id, title);

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found or update failed',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error updating conversation:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update conversation',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/conversations/[id]
 * Delete a conversation and all its messages
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Conversation ID is required',
        },
      },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteConversation(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found or deletion failed',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete conversation',
        },
      },
      { status: 500 }
    );
  }
}
