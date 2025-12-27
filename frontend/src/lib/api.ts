// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

// API Endpoints (without trailing slashes - add them only for list endpoints)
export const API_ENDPOINTS = {
  // Agents
  agents: `${API_BASE_URL}/api/agents`,
  
  // Customers
  customers: `${API_BASE_URL}/api/customers`,
  
  // Conversations
  conversations: `${API_BASE_URL}/api/conversations`,
  conversationStats: `${API_BASE_URL}/api/conversations/stats`,
  
  // Canned Messages
  cannedMessages: `${API_BASE_URL}/api/canned-messages`,
  cannedCategories: `${API_BASE_URL}/api/canned-messages/categories`,
  
  // Search
  search: `${API_BASE_URL}/api/search`,
  searchSuggestions: `${API_BASE_URL}/api/search/suggestions`,
  
  // External (for sending customer messages)
  externalMessages: `${API_BASE_URL}/api/external/messages`,
  
  // WebSocket
  websocket: (agentId: number) => `${WS_BASE_URL}/ws?agent_id=${agentId}`,
};

// Helper function to ensure proper URL formatting
function normalizeUrl(url: string): string {
  // Remove double slashes (except after protocol)
  return url.replace(/([^:]\/)\/+/g, '$1');
}

// Helper function for API requests
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Normalize URL to avoid double slashes
  const normalizedUrl = normalizeUrl(url);
  
  const response = await fetch(normalizedUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle redirects by following them
  if (response.status === 307 || response.status === 308) {
    const redirectUrl = response.headers.get('Location');
    if (redirectUrl) {
      return apiRequest<T>(redirectUrl, options);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}
