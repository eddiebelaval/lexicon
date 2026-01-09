/**
 * Chat API Route - Streaming Conversational Interface
 *
 * POST /api/chat - Send a message and get streaming AI response with tool use
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamChatMessage } from '@/lib/chat';
import type { ChatRequest } from '@/lib/chat';
import type { ApiError } from '@/types';

/**
 * POST /api/chat
 * Send a message to the AI assistant and receive streaming response
 *
 * Request body:
 * {
 *   conversationId?: string,  // Optional - creates new if not provided
 *   universeId: string,        // Required - the universe context
 *   message: string            // Required - user's message
 * }
 *
 * Response: Server-Sent Events stream
 * Event types:
 * - text: { content: string }
 * - tool_use: { toolCall: ToolCall }
 * - tool_result: { result: ToolCallResult }
 * - citations: { citations: Citation[] }
 * - done: { message: Message }
 * - error: { code: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { conversationId, universeId, message } = body as ChatRequest;

    // Validate required fields
    if (!universeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'universeId is required',
          },
        } as ApiError,
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'message is required and must be a non-empty string',
          },
        } as ApiError,
        { status: 400 }
      );
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream chat events
          for await (const event of streamChatMessage({
            conversationId,
            universeId,
            message: message.trim(),
          })) {
            // Format as Server-Sent Event
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Close the stream
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);

          // Send error event
          const errorEvent = {
            type: 'error',
            data: {
              code: 'STREAM_ERROR',
              message: error instanceof Error ? error.message : 'Unknown streaming error',
            },
          };
          const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }
      },
    });

    // Return streaming response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process chat request',
        },
      } as ApiError,
      { status: 500 }
    );
  }
}
