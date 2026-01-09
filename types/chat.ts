/**
 * Lexicon Chat Interface Types
 *
 * Types for the Perplexity-style conversational interface.
 * Supports AI tool use for CRUD operations and citation-backed responses.
 */

import { EntityType, RelationshipType } from './index';

// ============================================
// Conversation Types
// ============================================

/**
 * Conversation - A chat session within a universe
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface Conversation {
  id: string;
  universeId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversation creation input
 */
export interface CreateConversationInput {
  universeId: string;
  title?: string;
}

// ============================================
// Message Types
// ============================================

export type MessageRole = 'user' | 'assistant';

/**
 * Message - A single message in a conversation
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  toolCalls: ToolCall[];
  createdAt: Date;
}

/**
 * Message creation input
 */
export interface CreateMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  toolCalls?: ToolCall[];
}

// ============================================
// Citation Types
// ============================================

export type CitationType = 'entity' | 'relationship' | 'web';

/**
 * Citation - Reference to a source in AI responses
 *
 * Enables clickable references in chat messages
 */
export interface Citation {
  id: string;
  type: CitationType;
  label: string;
  // For entity citations
  entityId?: string;
  entityType?: EntityType;
  // For relationship citations
  relationshipId?: string;
  fromEntity?: string;
  toEntity?: string;
  relationshipType?: RelationshipType;
  // For web citations
  url?: string;
  title?: string;
  snippet?: string;
}

// ============================================
// Tool Call Types
// ============================================

export type ToolCallStatus = 'pending' | 'success' | 'error';

/**
 * ToolCall - Record of AI tool invocation
 *
 * Tracks CRUD operations performed by AI during chat
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: ToolCallStatus;
}

/**
 * ToolCallResult - Result of executing a tool
 */
export interface ToolCallResult {
  toolCallId: string;
  success: boolean;
  result: unknown;
  error?: string;
}

// ============================================
// Chat API Types
// ============================================

/**
 * ChatRequest - Request to send a message
 */
export interface ChatRequest {
  conversationId?: string; // If null, creates new conversation
  universeId: string;
  message: string;
}

/**
 * ChatResponse - Response from chat endpoint
 */
export interface ChatResponse {
  conversationId: string;
  message: Message;
  toolCallResults?: ToolCallResult[];
}

// ============================================
// Streaming Types
// ============================================

export type ChatStreamEventType =
  | 'text'
  | 'tool_use'
  | 'tool_result'
  | 'citations'
  | 'done'
  | 'error';

/**
 * ChatStreamEvent - Server-sent event for streaming responses
 */
export interface ChatStreamEvent {
  type: ChatStreamEventType;
  data: unknown;
}

/**
 * Typed stream event payloads
 */
export interface TextStreamEvent extends ChatStreamEvent {
  type: 'text';
  data: {
    content: string;
  };
}

export interface ToolUseStreamEvent extends ChatStreamEvent {
  type: 'tool_use';
  data: {
    toolCall: ToolCall;
  };
}

export interface ToolResultStreamEvent extends ChatStreamEvent {
  type: 'tool_result';
  data: {
    result: ToolCallResult;
  };
}

export interface CitationsStreamEvent extends ChatStreamEvent {
  type: 'citations';
  data: {
    citations: Citation[];
  };
}

export interface DoneStreamEvent extends ChatStreamEvent {
  type: 'done';
  data: {
    message: Message;
  };
}

export interface ErrorStreamEvent extends ChatStreamEvent {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}

// ============================================
// Production Tracking Types
// ============================================

export type ScriptStatus = 'development' | 'writing' | 'revision' | 'complete';

/**
 * Script - A screenplay or writing project
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface Script {
  id: string;
  universeId: string;
  title: string;
  logline?: string;
  status: ScriptStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Script creation input
 */
export interface CreateScriptInput {
  universeId: string;
  title: string;
  logline?: string;
  status?: ScriptStatus;
}

export type SceneStatus = 'outline' | 'draft' | 'revision' | 'locked';

/**
 * Scene - A scene within a script
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface Scene {
  id: string;
  scriptId: string;
  number: number;
  title: string;
  description?: string;
  status: SceneStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scene creation input
 */
export interface CreateSceneInput {
  scriptId: string;
  number: number;
  title: string;
  description?: string;
  status?: SceneStatus;
}

/**
 * Deadline - A production deadline
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface Deadline {
  id: string;
  universeId: string;
  scriptId?: string;
  title: string;
  dueDate: Date;
  description?: string;
  completed: boolean;
  createdAt: Date;
}

/**
 * Deadline creation input
 */
export interface CreateDeadlineInput {
  universeId: string;
  scriptId?: string;
  title: string;
  dueDate: Date;
  description?: string;
}

export type DeliverableType =
  | 'script'
  | 'outline'
  | 'treatment'
  | 'revision'
  | 'notes'
  | 'other';

/**
 * Deliverable - An item due for a deadline
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface Deliverable {
  id: string;
  deadlineId: string;
  title: string;
  type: DeliverableType;
  completed: boolean;
  fileUrl?: string;
  createdAt: Date;
}

/**
 * Deliverable creation input
 */
export interface CreateDeliverableInput {
  deadlineId: string;
  title: string;
  type: DeliverableType;
  fileUrl?: string;
}

/**
 * SavedSearch - A saved search query for quick access
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface SavedSearch {
  id: string;
  universeId: string;
  userId: string;
  query: string;
  name?: string;
  createdAt: Date;
}

/**
 * SavedSearch creation input
 */
export interface CreateSavedSearchInput {
  universeId: string;
  query: string;
  name?: string;
}
