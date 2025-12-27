'use client';

import { useState, useEffect } from 'react';
import { X, Search, Hash, Folder } from 'lucide-react';
import { API_ENDPOINTS, apiRequest } from '@/lib/api';
import { CannedMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CannedMessagePickerProps {
  onSelect: (message: CannedMessage) => void;
  onClose: () => void;
}

export default function CannedMessagePicker({ onSelect, onClose }: CannedMessagePickerProps) {
  const [cannedMessages, setCannedMessages] = useState<CannedMessage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [messagesData, categoriesData] = await Promise.all([
          apiRequest<CannedMessage[]>(API_ENDPOINTS.cannedMessages),
          apiRequest<string[]>(API_ENDPOINTS.cannedCategories),
        ]);
        setCannedMessages(messagesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching canned messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredMessages = cannedMessages.filter((message) => {
    const matchesCategory = !selectedCategory || message.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.shortcut?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="border-t border-gray-200 bg-white max-h-80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Canned Messages</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages or type shortcut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors",
            !selectedCategory
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors",
              selectedCategory === category
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p>No canned messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => onSelect(message)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{message.title}</span>
                  <div className="flex items-center gap-2">
                    {message.shortcut && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded">
                        {message.shortcut}
                      </span>
                    )}
                    {message.category && (
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">
                        {message.category}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{message.content}</p>
                <span className="mt-1 text-xs text-gray-400">
                  Used {message.usage_count} times
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
