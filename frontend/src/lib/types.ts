export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  account_status: string;
  loan_status?: string;
  loan_amount?: number;
  profile_notes?: string;
  account_created: string;
  last_activity: string;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  customer_id?: number;
  agent_id?: number;
  content: string;
  is_from_customer: boolean;
  priority: Priority;
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: number;
  customer_id: number;
  agent_id?: number;
  status: ConversationStatus;
  priority: Priority;
  subject?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  assigned_agent?: Agent;
  messages: Message[];
}

export interface ConversationListItem {
  id: number;
  customer_id: number;
  agent_id?: number;
  status: ConversationStatus;
  priority: Priority;
  subject?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  assigned_agent?: Agent;
  last_message?: Message;
  unread_count: number;
}

export interface CannedMessage {
  id: number;
  title: string;
  content: string;
  category?: string;
  shortcut?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationStats {
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  unassigned: number;
}

export interface SearchResult {
  conversations: ConversationListItem[];
  customers: Customer[];
  total_results: number;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ConversationStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
}

export interface NewMessageEvent {
  id: number;
  conversation_id: number;
  customer_id?: number;
  agent_id?: number;
  content: string;
  is_from_customer: boolean;
  priority: string;
  created_at: string;
  customer_name?: string;
  agent_name?: string;
}

export interface ConversationUpdateEvent {
  id: number;
  status?: string;
  priority?: string;
  agent_id?: number;
  agent_name?: string;
}

export interface NewConversationEvent {
  id: number;
  customer_id: number;
  priority: string;
  status: string;
  subject?: string;
  customer_name: string;
  customer_email: string;
}
