'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, MoreVertical, CheckCircle, Clock, AlertTriangle, User, UserX, Shield } from 'lucide-react';
import { API_ENDPOINTS, apiRequest } from '@/lib/api';
import { Conversation, Message, CannedMessage, Priority, ConversationStatus } from '@/lib/types';
import { cn, formatTime, getPriorityBadgeColor, getStatusColor } from '@/lib/utils';
import { useNewMessages, useWebSocket } from '@/lib/websocket';
import CannedMessagePicker from './CannedMessagePicker';

interface MessagePanelProps {
  conversationId: number;
  agentId: number;
  onConversationUpdate?: () => void;
}

export default function MessagePanel({ conversationId, agentId, onConversationUpdate }: MessagePanelProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showCannedMessages, setShowCannedMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage: wsSendMessage } = useWebSocket();

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [messageText, adjustTextareaHeight]);

  const fetchConversation = useCallback(async () => {
    try {
      const data = await apiRequest<Conversation>(`${API_ENDPOINTS.conversations}/${conversationId}`);
      setConversation(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    fetchConversation();
    
    // Mark messages as read
    apiRequest(`${API_ENDPOINTS.conversations}/${conversationId}/read`, {
      method: 'POST',
    }).catch(console.error);

    // Notify WebSocket that we're viewing this conversation
    wsSendMessage({
      type: 'viewing',
      data: { conversation_id: conversationId },
    });

    return () => {
      wsSendMessage({
        type: 'stop_viewing',
        data: { conversation_id: conversationId },
      });
    };
  }, [conversationId, fetchConversation, wsSendMessage]);

  // Handle real-time new messages
  const handleNewMessage = useCallback((data: unknown) => {
    const messageData = data as { 
      conversation_id: number; 
      id: number;
      content: string; 
      is_from_customer: boolean; 
      created_at: string;
      priority: string;
      customer_id?: number;
      agent_id?: number;
    };
    
    if (messageData.conversation_id === conversationId) {
      const newMessage: Message = {
        id: messageData.id,
        conversation_id: messageData.conversation_id,
        customer_id: messageData.customer_id,
        agent_id: messageData.agent_id,
        content: messageData.content,
        is_from_customer: messageData.is_from_customer,
        priority: messageData.priority as Priority,
        created_at: messageData.created_at,
      };
      
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    }
  }, [conversationId]);

  useNewMessages(handleNewMessage);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await apiRequest<Message>(`${API_ENDPOINTS.conversations}/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: messageText.trim(),
          conversation_id: conversationId,
          agent_id: agentId,
        }),
      });
      
      setMessageText('');
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCannedMessageSelect = (cannedMessage: CannedMessage) => {
    setMessageText(cannedMessage.content);
    setShowCannedMessages(false);
    
    // Track usage
    apiRequest(`${API_ENDPOINTS.cannedMessages}/${cannedMessage.id}/use`, {
      method: 'POST',
    }).catch(console.error);
  };

  const handleStatusChange = async (status: ConversationStatus) => {
    try {
      await apiRequest(`${API_ENDPOINTS.conversations}/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      fetchConversation();
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePriorityChange = async (priority: Priority) => {
    try {
      await apiRequest(`${API_ENDPOINTS.conversations}/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({ priority }),
      });
      fetchConversation();
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleAssignToMe = async () => {
    try {
      await apiRequest(`${API_ENDPOINTS.conversations}/${conversationId}/assign/${agentId}`, {
        method: 'POST',
      });
      fetchConversation();
      onConversationUpdate?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error assigning conversation:', err);
      alert(err.message || 'Could not assign conversation');
    }
  };

  const handleRelease = async () => {
    try {
      await apiRequest(`${API_ENDPOINTS.conversations}/${conversationId}/release?agent_id=${agentId}`, {
        method: 'POST',
      });
      fetchConversation();
      onConversationUpdate?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error releasing conversation:', err);
      alert(err.message || 'Could not release conversation');
    }
  };

  // Check if this agent can send messages
  const canSendMessage = conversation?.agent_id === null || 
                         conversation?.agent_id === undefined || 
                         conversation?.agent_id === agentId;
  
  const isAssignedToMe = conversation?.agent_id === agentId;
  const isAssignedToOther = conversation?.agent_id !== null && 
                           conversation?.agent_id !== undefined && 
                           conversation?.agent_id !== agentId;

  // Handle typing indicator
  const handleTyping = () => {
    wsSendMessage({
      type: 'typing',
      data: { conversation_id: conversationId, is_typing: true },
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Conversation not found
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Assignment Warning Banner */}
      {isAssignedToOther && (
        <div className="px-6 py-3 bg-purple-50 border-b border-purple-200 flex items-center gap-3">
          <Shield className="w-5 h-5 text-purple-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">
              This conversation is assigned to {conversation.assigned_agent?.name || 'another agent'}
            </p>
            <p className="text-xs text-purple-600">
              You can view messages but cannot respond to this conversation
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {conversation.customer?.name || 'Unknown Customer'}
            </h2>
            <p className="text-sm text-gray-500">{conversation.customer?.email}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Assignment Status Badge */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
              isAssignedToMe ? "bg-green-100 text-green-700 border border-green-200" :
              isAssignedToOther ? "bg-purple-100 text-purple-700 border border-purple-200" :
              "bg-yellow-100 text-yellow-700 border border-yellow-200"
            )}>
              <User className="w-4 h-4" />
              {isAssignedToMe ? "Assigned to you" :
               isAssignedToOther ? conversation.assigned_agent?.name :
               "Unassigned"}
            </div>

            {/* Priority Selector */}
            <select
              value={conversation.priority}
              onChange={(e) => handlePriorityChange(e.target.value as Priority)}
              disabled={isAssignedToOther}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg border cursor-pointer",
                getPriorityBadgeColor(conversation.priority),
                isAssignedToOther && "opacity-50 cursor-not-allowed"
              )}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Status Selector */}
            <select
              value={conversation.status}
              onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
              disabled={isAssignedToOther}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer",
                getStatusColor(conversation.status),
                isAssignedToOther && "opacity-50 cursor-not-allowed"
              )}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Assign/Release Buttons */}
            {!isAssignedToOther && !isAssignedToMe && (
              <button
                onClick={handleAssignToMe}
                className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Claim
              </button>
            )}
            {isAssignedToMe && (
              <button
                onClick={handleRelease}
                className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <UserX className="w-4 h-4" />
                Release
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.is_from_customer ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                message.is_from_customer
                  ? "bg-white text-gray-900 rounded-bl-md"
                  : "bg-blue-500 text-white rounded-br-md"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div
                className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  message.is_from_customer ? "text-gray-400" : "text-blue-100"
                )}
              >
                <span>{formatTime(message.created_at)}</span>
                {!message.is_from_customer && (
                  <CheckCircle className="w-3 h-3" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Canned Messages Picker */}
      {showCannedMessages && (
        <CannedMessagePicker
          onSelect={handleCannedMessageSelect}
          onClose={() => setShowCannedMessages(false)}
        />
      )}

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        {isAssignedToOther ? (
          <div className="flex items-center justify-center py-3 px-4 bg-gray-100 rounded-xl text-gray-500">
            <Shield className="w-5 h-5 mr-2" />
            <span>You cannot respond to conversations assigned to other agents</span>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowCannedMessages(!showCannedMessages)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showCannedMessages
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
              title="Canned Messages"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isAssignedToMe ? "Type your message... (Press Enter to send, Shift+Enter for new line)" : "Claim this conversation to respond..."}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sending || !canSendMessage}
              className={cn(
                "p-3 rounded-xl transition-colors",
                messageText.trim() && !sending && canSendMessage
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
