/**
 * Lexicon Chat Service
 *
 * Perplexity-style conversational interface for the knowledge base.
 * Features:
 * - Claude API with tool-use for agentic CRUD operations
 * - Streaming responses with real-time updates
 * - Citation extraction from AI responses
 * - Conversation persistence in Supabase
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import { lexiconTools, executeToolCall } from './tools';
import {
  createConversation,
  createMessage,
  getConversation,
  listConversations,
  deleteConversation as deleteConv,
  updateConversationTitle,
} from './conversations';
import type {
  ChatStreamEvent,
  ChatRequest,
  ChatResponse,
  Citation,
  CitationType,
  ToolCall,
  ToolCallStatus,
  Message,
  Conversation,
} from '@/types/chat';
import type { EntityType, RelationshipType } from '@/types';
import { LEXI_SYSTEM_PROMPT, buildProductionContext } from './lexi';

// ============================================
// Claude Client Singleton
// ============================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ============================================
// System Prompt
// ============================================

const SYSTEM_PROMPT = `You are Lexicon, an AI assistant for managing story universe knowledge bases. You help writers and storytellers organize, query, and expand their narrative worlds.

## Your Capabilities
You have full CRUD (Create, Read, Update, Delete) access to the knowledge base through tools. You can:
- Search and retrieve entities (characters, locations, events, objects, factions)
- Create new entities when users describe new elements of their universe
- Update existing entities with new information
- Delete entities when explicitly requested
- Manage relationships between entities
- Get context about how entities are connected in the graph

## Guidelines for Tool Use

### When to Search First
- ALWAYS search before creating to avoid duplicates
- When answering questions about the universe, search to find relevant entities
- Use get_graph_context to understand connections around an entity

### When to Create/Update
- Create new entities when users describe something that doesn't exist yet
- Update existing entities when users provide corrections or new details
- Always confirm successful creation/updates in your response

### When to Delete
- ONLY delete when the user explicitly requests it
- Always confirm the deletion target before proceeding
- Warn about relationship cascade (deleting an entity removes its relationships)

### Relationship Guidelines
- Relationships are directional: source -> target
- Choose the most specific relationship type that fits
- Include context to explain the nature of the relationship
- Consider strength (1-5) for relationship importance

## Citation Format
When referencing entities in your responses, use citations so users can click to see details:
- Entity citations: [Entity: Name]
- Relationship citations: [Rel: EntityA -> EntityB (type)]
- Web citations (if using web search): [Web: Source Title]

Always cite entities you mention so users can explore them in the knowledge graph.

## Response Style
- Be conversational but informative
- Summarize what you found or created
- Suggest related queries or next steps
- If you can't find something, offer to create it
- If information conflicts, highlight the discrepancy

## Context Awareness
You're operating within a specific universe. All operations are scoped to that universe's knowledge base. Treat each universe as a self-contained story world.`;

// ============================================
// Citation Parsing
// ============================================

/**
 * Parse citation markers from Claude's response text
 *
 * Formats:
 * - [Entity: Name] -> entity citation
 * - [Rel: EntityA -> EntityB (type)] -> relationship citation
 * - [Web: Title] -> web citation
 */
export function parseCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();

  // Entity citations: [Entity: Name]
  const entityRegex = /\[Entity:\s*([^\]]+)\]/g;
  let match;

  while ((match = entityRegex.exec(text)) !== null) {
    const label = match[1].trim();
    const key = `entity:${label.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        id: `cite-entity-${citations.length}`,
        type: 'entity' as CitationType,
        label,
      });
    }
  }

  // Relationship citations: [Rel: EntityA -> EntityB (type)]
  const relRegex = /\[Rel:\s*([^->\]]+)\s*->\s*([^\(\]]+)\s*\(([^)]+)\)\]/g;

  while ((match = relRegex.exec(text)) !== null) {
    const fromEntity = match[1].trim();
    const toEntity = match[2].trim();
    const relType = match[3].trim();
    const key = `rel:${fromEntity.toLowerCase()}->${toEntity.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        id: `cite-rel-${citations.length}`,
        type: 'relationship' as CitationType,
        label: `${fromEntity} -> ${toEntity}`,
        fromEntity,
        toEntity,
        relationshipType: relType as RelationshipType,
      });
    }
  }

  // Web citations: [Web: Title]
  const webRegex = /\[Web:\s*([^\]]+)\]/g;

  while ((match = webRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const key = `web:${title.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        id: `cite-web-${citations.length}`,
        type: 'web' as CitationType,
        label: title,
        title,
      });
    }
  }

  return citations;
}

/**
 * Extract citations from tool execution results
 */
function extractCitationsFromToolResult(
  toolName: string,
  result: { success: boolean; result: unknown; error?: string },
  citations: Citation[]
): void {
  if (!result.success || !result.result) return;

  const data = result.result as Record<string, unknown>;

  // Extract entity citations
  if (toolName === 'get_entity' || toolName === 'create_entity' || toolName === 'update_entity') {
    const entity = data.entity as Record<string, unknown> | undefined;
    if (entity) {
      citations.push({
        id: entity.id as string,
        type: 'entity',
        label: entity.name as string,
        entityId: entity.id as string,
        entityType: entity.type as EntityType,
      });
    }
  }

  // Extract multiple entity citations from search
  if (toolName === 'search_entities') {
    const entities = data.entities as Array<Record<string, unknown>> | undefined;
    if (entities) {
      entities.forEach(entity => {
        citations.push({
          id: entity.id as string,
          type: 'entity',
          label: entity.name as string,
          entityId: entity.id as string,
          entityType: entity.type as EntityType,
        });
      });
    }
  }

  // Extract relationship citations
  if (toolName === 'create_relationship' || toolName === 'update_relationship') {
    const rel = data.relationship as Record<string, unknown> | undefined;
    if (rel) {
      const source = rel.source as Record<string, unknown>;
      const target = rel.target as Record<string, unknown>;
      citations.push({
        id: rel.id as string,
        type: 'relationship',
        label: `${source.name} -> ${target.name}`,
        relationshipId: rel.id as string,
        fromEntity: source.name as string,
        toEntity: target.name as string,
        relationshipType: rel.type as RelationshipType,
      });
    }
  }

  // Extract web citations
  if (toolName === 'web_search') {
    const results = data.results as Array<Record<string, unknown>> | undefined;
    if (results) {
      results.forEach(webResult => {
        citations.push({
          id: webResult.url as string,
          type: 'web',
          label: webResult.title as string,
          url: webResult.url as string,
          title: webResult.title as string,
          snippet: webResult.snippet as string,
        });
      });
    }
  }
}

/**
 * Deduplicate citations by ID
 */
function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter(citation => {
    if (seen.has(citation.id)) return false;
    seen.add(citation.id);
    return true;
  });
}

// ============================================
// Message Building for Claude API
// ============================================

/**
 * Convert our message format to Anthropic's message format
 */
function buildClaudeMessages(messages: Message[]): MessageParam[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

// ============================================
// Non-Streaming Chat Implementation
// ============================================

/**
 * Send a chat message and get a response (non-streaming)
 *
 * This is the main entry point for the chat service. It:
 * 1. Creates or loads a conversation
 * 2. Saves the user message
 * 3. Builds the Claude request with tool definitions
 * 4. Handles tool calls in a loop until complete
 * 5. Parses citations from the response
 * 6. Saves and returns the assistant message
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const client = getAnthropicClient();
  let conversationId = request.conversationId;
  let existingMessages: Message[] = [];

  // Create or load conversation
  if (conversationId) {
    const history = await getConversation(conversationId);
    if (!history) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    existingMessages = history.messages;
  } else {
    const newConversation = await createConversation({
      universeId: request.universeId,
      title: request.message.slice(0, 50) + (request.message.length > 50 ? '...' : ''),
    });
    if (!newConversation) {
      throw new Error('Failed to create conversation');
    }
    conversationId = newConversation.id;
  }

  // Save user message
  const userMessage = await createMessage({
    conversationId,
    role: 'user',
    content: request.message,
  });

  if (!userMessage) {
    throw new Error('Failed to save user message');
  }

  // Build message history for Claude
  const currentMessages: MessageParam[] = buildClaudeMessages([...existingMessages, userMessage]);

  // Track tool calls for this response
  const allToolCalls: ToolCall[] = [];
  const allCitations: Citation[] = [];
  let fullResponseText = '';
  let continueLoop = true;

  // Tool use loop - continue until Claude gives a final response without tool use
  while (continueLoop) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: lexiconTools,
      messages: currentMessages,
    });

    // Check for tool use
    const toolUseBlocks = response.content.filter(
      (block): block is ToolUseBlock => block.type === 'tool_use'
    );

    const textBlocks = response.content.filter(
      (block): block is TextBlock => block.type === 'text'
    );

    // Accumulate text content
    for (const textBlock of textBlocks) {
      fullResponseText += textBlock.text;
    }

    // If there are tool calls, execute them and continue
    if (toolUseBlocks.length > 0) {
      // Add assistant message with tool use to conversation
      currentMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // Execute each tool and collect results
      const toolResults: ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const toolCall: ToolCall = {
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
          status: 'pending' as ToolCallStatus,
        };

        // Execute the tool
        const result = await executeToolCall(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          request.universeId
        );

        // Update tool call with result
        toolCall.status = result.success ? 'success' : 'error';
        toolCall.result = result.result;
        toolCall.error = result.error;
        allToolCalls.push(toolCall);

        // Extract citations from tool results
        extractCitationsFromToolResult(toolUse.name, result, allCitations);

        // Format result for Claude
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
          is_error: !result.success,
        });
      }

      // Add tool results to conversation
      currentMessages.push({
        role: 'user',
        content: toolResults,
      });
    } else {
      // No more tool calls, we're done
      continueLoop = false;
    }

    // Also check stop reason
    if (response.stop_reason === 'end_turn' && toolUseBlocks.length === 0) {
      continueLoop = false;
    }
  }

  // Parse citations from the final response text
  const textCitations = parseCitations(fullResponseText);
  allCitations.push(...textCitations);

  // Deduplicate citations
  const finalCitations = deduplicateCitations(allCitations);

  // Save assistant message
  const assistantMessage = await createMessage({
    conversationId,
    role: 'assistant',
    content: fullResponseText,
    citations: finalCitations,
    toolCalls: allToolCalls,
  });

  if (!assistantMessage) {
    throw new Error('Failed to save assistant message');
  }

  return {
    conversationId,
    message: assistantMessage,
    toolCallResults: allToolCalls.map(tc => ({
      toolCallId: tc.id,
      success: tc.status === 'success',
      result: tc.result,
      error: tc.error,
    })),
  };
}

// ============================================
// Streaming Chat Implementation
// ============================================

/**
 * Stream a chat message response
 *
 * Yields ChatStreamEvents for real-time UI updates:
 * - 'text': Partial text content
 * - 'tool_use': Tool being invoked
 * - 'tool_result': Tool execution result
 * - 'citations': Parsed citations
 * - 'done': Final message with all data
 * - 'error': Error occurred
 */
export async function* streamChatMessage(
  request: ChatRequest
): AsyncGenerator<ChatStreamEvent> {
  const client = getAnthropicClient();
  let conversationId = request.conversationId;
  let existingMessages: Message[] = [];

  try {
    // Create or load conversation
    if (conversationId) {
      const history = await getConversation(conversationId);
      if (!history) {
        yield {
          type: 'error',
          data: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' },
        };
        return;
      }
      existingMessages = history.messages;
    } else {
      const newConversation = await createConversation({
        universeId: request.universeId,
        title: request.message.slice(0, 50) + (request.message.length > 50 ? '...' : ''),
      });
      if (!newConversation) {
        yield {
          type: 'error',
          data: { code: 'CONVERSATION_CREATE_FAILED', message: 'Failed to create conversation' },
        };
        return;
      }
      conversationId = newConversation.id;
    }

    // Save user message
    const userMessage = await createMessage({
      conversationId,
      role: 'user',
      content: request.message,
    });

    if (!userMessage) {
      yield {
        type: 'error',
        data: { code: 'MESSAGE_SAVE_FAILED', message: 'Failed to save user message' },
      };
      return;
    }

    // Build message history
    const currentMessages: MessageParam[] = buildClaudeMessages([...existingMessages, userMessage]);

    // Track state
    const allToolCalls: ToolCall[] = [];
    const allCitations: Citation[] = [];
    let fullResponseText = '';
    let continueLoop = true;

    // Determine system prompt based on mode
    let systemPrompt = SYSTEM_PROMPT;
    if (request.mode === 'production' && request.productionId) {
      const productionContext = await buildProductionContext(request.productionId);
      systemPrompt = LEXI_SYSTEM_PROMPT + '\n\n' + productionContext;
    }

    // Tool use loop with streaming
    while (continueLoop) {
      // Use streaming for this request
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: lexiconTools,
        messages: currentMessages,
      });

      // Collect the full response while streaming
      let responseContent: ContentBlock[] = [];

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta as { type: string; text?: string };
          if (delta.type === 'text_delta' && delta.text) {
            fullResponseText += delta.text;

            // Emit text event for real-time UI update
            yield {
              type: 'text',
              data: { content: delta.text },
            };
          }
        }
      }

      // Get the final message to check for tool use
      const finalMessage = await stream.finalMessage();
      responseContent = finalMessage.content;

      // Check for tool use
      const toolUseBlocks = responseContent.filter(
        (block): block is ToolUseBlock => block.type === 'tool_use'
      );

      // If there are tool calls, execute them
      if (toolUseBlocks.length > 0) {
        // Add assistant message to conversation
        currentMessages.push({
          role: 'assistant',
          content: responseContent,
        });

        // Execute each tool
        const toolResults: ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          const toolCall: ToolCall = {
            id: toolUse.id,
            name: toolUse.name,
            input: toolUse.input as Record<string, unknown>,
            status: 'pending' as ToolCallStatus,
          };

          // Emit tool use event
          yield {
            type: 'tool_use',
            data: { toolCall },
          };

          // Execute the tool
          const result = await executeToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            request.universeId
          );

          // Update and track tool call
          toolCall.status = result.success ? 'success' : 'error';
          toolCall.result = result.result;
          toolCall.error = result.error;
          allToolCalls.push(toolCall);

          // Extract citations from tool results
          extractCitationsFromToolResult(toolUse.name, result, allCitations);

          // Emit tool result event
          yield {
            type: 'tool_result',
            data: {
              result: {
                toolCallId: toolCall.id,
                success: result.success,
                result: result.result,
                error: result.error,
              },
            },
          };

          // Format for Claude
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
            is_error: !result.success,
          });
        }

        // Add tool results to conversation
        currentMessages.push({
          role: 'user',
          content: toolResults,
        });
      } else {
        // No tool calls, done with loop
        continueLoop = false;
      }

      // Check stop reason
      if (finalMessage.stop_reason === 'end_turn' && toolUseBlocks.length === 0) {
        continueLoop = false;
      }
    }

    // Parse citations from the final response text
    const textCitations = parseCitations(fullResponseText);
    allCitations.push(...textCitations);

    // Deduplicate citations
    const finalCitations = deduplicateCitations(allCitations);

    // Emit citations if any
    if (finalCitations.length > 0) {
      yield {
        type: 'citations',
        data: { citations: finalCitations },
      };
    }

    // Save assistant message
    const assistantMessage = await createMessage({
      conversationId,
      role: 'assistant',
      content: fullResponseText,
      citations: finalCitations,
      toolCalls: allToolCalls,
    });

    if (!assistantMessage) {
      yield {
        type: 'error',
        data: { code: 'MESSAGE_SAVE_FAILED', message: 'Failed to save assistant message' },
      };
      return;
    }

    // Emit done event
    yield {
      type: 'done',
      data: { message: assistantMessage },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Chat stream error:', error);

    yield {
      type: 'error',
      data: { code: 'STREAM_ERROR', message: errorMessage },
    };
  }
}

// ============================================
// Conversation Management Exports
// ============================================

/**
 * Get conversation history with messages
 */
export async function getConversationHistory(
  conversationId: string
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  const result = await getConversation(conversationId);
  if (!result) return null;

  const { messages, ...conversation } = result;
  return { conversation, messages };
}

/**
 * Get all conversations for a universe
 */
export async function getUniverseConversations(
  universeId: string
): Promise<Conversation[]> {
  return listConversations(universeId);
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  return deleteConv(conversationId);
}

/**
 * Generate a title for a conversation based on its first message
 */
export async function generateConversationTitle(
  conversationId: string,
  firstMessage: string
): Promise<string> {
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Generate a short title (3-6 words) for a conversation that starts with this message. Only respond with the title, no quotes or punctuation at the end.

Message: "${firstMessage}"`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const title = content.text.trim();
      await updateConversationTitle(conversationId, title);
      return title;
    }
  } catch (error) {
    console.error('Error generating title:', error);
  }

  return firstMessage.slice(0, 50);
}

// Re-export types for convenience
export type { ChatRequest, ChatResponse, ChatStreamEvent };
