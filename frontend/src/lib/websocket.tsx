'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { API_ENDPOINTS } from './api';
import { WebSocketMessage, NewMessageEvent, ConversationUpdateEvent, NewConversationEvent } from './types';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (type: string, callback: (data: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  agentId: number;
}

export function WebSocketProvider({ children, agentId }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscribers, setSubscribers] = useState<Map<string, Set<(data: unknown) => void>>>(new Map());

  useEffect(() => {
    const ws = new WebSocket(API_ENDPOINTS.websocket(agentId));

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        // Notify subscribers
        const typeSubscribers = subscribers.get(message.type);
        if (typeSubscribers) {
          typeSubscribers.forEach(callback => callback(message.data));
        }
        
        // Also notify 'all' subscribers
        const allSubscribers = subscribers.get('all');
        if (allSubscribers) {
          allSubscribers.forEach(callback => callback(message));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', data: {} }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [agentId]);

  // Update subscribers ref when it changes
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          const typeSubscribers = subscribers.get(message.type);
          if (typeSubscribers) {
            typeSubscribers.forEach(callback => callback(message.data));
          }
          
          const allSubscribers = subscribers.get('all');
          if (allSubscribers) {
            allSubscribers.forEach(callback => callback(message));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    }
  }, [socket, subscribers]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  const subscribe = useCallback((type: string, callback: (data: unknown) => void) => {
    setSubscribers(prev => {
      const newSubscribers = new Map(prev);
      if (!newSubscribers.has(type)) {
        newSubscribers.set(type, new Set());
      }
      newSubscribers.get(type)!.add(callback);
      return newSubscribers;
    });

    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const newSubscribers = new Map(prev);
        const typeSubscribers = newSubscribers.get(type);
        if (typeSubscribers) {
          typeSubscribers.delete(callback);
          if (typeSubscribers.size === 0) {
            newSubscribers.delete(type);
          }
        }
        return newSubscribers;
      });
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Hooks for specific message types
export function useNewMessages(callback: (data: NewMessageEvent) => void) {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    return subscribe('new_message', callback as (data: unknown) => void);
  }, [subscribe, callback]);
}

export function useConversationUpdates(callback: (data: ConversationUpdateEvent) => void) {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    return subscribe('conversation_update', callback as (data: unknown) => void);
  }, [subscribe, callback]);
}

export function useNewConversations(callback: (data: NewConversationEvent) => void) {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    return subscribe('new_conversation', callback as (data: unknown) => void);
  }, [subscribe, callback]);
}
