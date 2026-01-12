/**
 * Conversation and Message Database Operations
 *
 * PostgreSQL/Supabase operations for chat conversations and messages.
 * These are separate from the Neo4j graph operations.
 */

import { createAdminClient } from './supabase';
import type {
  Conversation,
  CreateConversationInput,
  Message,
  CreateMessageInput,
  Citation,
  ToolCall,
} from '@/types/chat';

// ============================================
// Database Row Types & Mappers
// ============================================

type ConversationRow = {
  id: string;
  universe_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  citations: unknown;
  tool_calls: unknown;
  created_at: string;
};

function mapRowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    universeId: row.universe_id,
    title: row.title,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapRowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    citations: (row.citations as Citation[]) || [],
    toolCalls: (row.tool_calls as ToolCall[]) || [],
    createdAt: new Date(row.created_at),
  };
}

// ============================================
// Conversation Operations
// ============================================

/**
 * Create a new conversation
 */
export async function createConversation(
  input: CreateConversationInput
): Promise<Conversation | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('conversations')
    .insert({
      universe_id: input.universeId,
      title: input.title || 'New Conversation',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return mapRowToConversation(data as unknown as ConversationRow);
}

/**
 * Get a conversation by ID with all messages
 */
export async function getConversation(
  id: string
): Promise<(Conversation & { messages: Message[] }) | null> {
  const admin = createAdminClient();

  // Get conversation
  const { data: convData, error: convError } = await admin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (convError || !convData) {
    console.error('Error fetching conversation:', convError);
    return null;
  }

  // Get messages for this conversation
  const { data: msgData, error: msgError } = await admin
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('Error fetching messages:', msgError);
    return null;
  }

  const conversation = mapRowToConversation(convData as unknown as ConversationRow);
  const messages = (msgData as unknown as MessageRow[]).map(mapRowToMessage);

  return {
    ...conversation,
    messages,
  };
}

/**
 * List conversations for a universe
 */
export async function listConversations(
  universeId: string
): Promise<Conversation[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('conversations')
    .select('*')
    .eq('universe_id', universeId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error listing conversations:', error);
    return [];
  }

  return (data as unknown as ConversationRow[]).map(mapRowToConversation);
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  id: string,
  title: string
): Promise<Conversation | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('conversations')
    .update({ title })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating conversation:', error);
    return null;
  }

  return mapRowToConversation(data as unknown as ConversationRow);
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(id: string): Promise<boolean> {
  const admin = createAdminClient();

  // Messages will be cascade-deleted by database foreign key constraint
  const { error } = await admin.from('conversations').delete().eq('id', id);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}

// ============================================
// Message Operations
// ============================================

/**
 * Create a message in a conversation
 */
export async function createMessage(
  input: CreateMessageInput
): Promise<Message | null> {
  const admin = createAdminClient();

  // Type assertion needed because Supabase generated types don't include citations column
  // TODO: Regenerate types with `npx supabase gen types typescript` after schema update
  const insertData = {
    conversation_id: input.conversationId,
    role: input.role,
    content: input.content,
    citations: JSON.stringify(input.citations || []),
    tool_calls: JSON.stringify(input.toolCalls || []),
  };

  const { data, error } = await admin
    .from('messages')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    return null;
  }

  // Update conversation's updated_at timestamp
  await admin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.conversationId);

  return mapRowToMessage(data as unknown as MessageRow);
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data as unknown as MessageRow[]).map(mapRowToMessage);
}

/**
 * Get the last N messages from a conversation (for context)
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 10
): Promise<Message[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent messages:', error);
    return [];
  }

  // Reverse to get chronological order
  return (data as unknown as MessageRow[]).map(mapRowToMessage).reverse();
}
