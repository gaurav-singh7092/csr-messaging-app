'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, User, MessageSquare, ArrowRight } from 'lucide-react';
import { API_ENDPOINTS, apiRequest } from '@/lib/api';
import { SearchResult, ConversationListItem, Customer, Priority, ConversationStatus } from '@/lib/types';
import { cn, formatDate, getPriorityBadgeColor, getStatusColor } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: ConversationListItem) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectConversation, onSelectCustomer }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [searchIn, setSearchIn] = useState<'all' | 'messages' | 'customers'>('all');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [status, setStatus] = useState<ConversationStatus | ''>('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        search_in: searchIn,
      });
      if (priority) params.append('priority', priority);
      if (status) params.append('status', status);

      const data = await apiRequest<SearchResult>(
        `${API_ENDPOINTS.search}?${params.toString()}`
      );
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, searchIn, priority, status]);

  useEffect(() => {
    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [performSearch]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-16 px-4">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations, messages, or customers..."
                className="w-full pl-12 pr-12 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
                autoFocus
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mt-3">
              <select
                value={searchIn}
                onChange={(e) => setSearchIn(e.target.value as 'all' | 'messages' | 'customers')}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="messages">Messages</option>
                <option value="customers">Customers</option>
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority | '')}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ConversationStatus | '')}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : !results ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="w-12 h-12 mb-4 text-gray-300" />
                <p>Start typing to search...</p>
              </div>
            ) : results.total_results === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Conversations */}
                {results.conversations.length > 0 && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Conversations ({results.conversations.length})
                    </h3>
                    <div className="space-y-2">
                      {results.conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            onSelectConversation(conv);
                            onClose();
                          }}
                          className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {conv.customer?.name || 'Unknown'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full border",
                                getPriorityBadgeColor(conv.priority)
                              )}>
                                {conv.priority}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full",
                                getStatusColor(conv.status)
                              )}>
                                {conv.status.replace('_', ' ')}
                              </span>
                              <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {conv.last_message?.content || conv.subject}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatDate(conv.updated_at)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers */}
                {results.customers.length > 0 && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customers ({results.customers.length})
                    </h3>
                    <div className="space-y-2">
                      {results.customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            onSelectCustomer(customer);
                            onClose();
                          }}
                          className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{customer.name}</span>
                                <p className="text-sm text-gray-500">{customer.email}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {results && results.total_results > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
              Found {results.total_results} result{results.total_results !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
