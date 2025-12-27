'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, Calendar, FileText, Activity, ExternalLink, DollarSign } from 'lucide-react';
import { API_ENDPOINTS, apiRequest } from '@/lib/api';
import { Customer, ConversationListItem } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

interface CustomerPanelProps {
  customerId: number;
}

export default function CustomerPanel({ customerId }: CustomerPanelProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const [customerData, conversationsData] = await Promise.all([
          apiRequest<Customer>(`${API_ENDPOINTS.customers}/${customerId}`),
          apiRequest<ConversationListItem[]>(`${API_ENDPOINTS.customers}/${customerId}/conversations`),
        ]);
        setCustomer(customerData);
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  if (loading) {
    return (
      <div className="w-80 border-l border-gray-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="space-y-3 mt-6">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="w-80 border-l border-gray-200 bg-white p-6 flex items-center justify-center text-gray-500">
        Customer not found
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLoanStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disbursed':
        return 'bg-blue-100 text-blue-800';
      case 'repaying':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
      {/* Customer Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
            {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">{customer.name}</h3>
          <span className={cn(
            "mt-2 px-3 py-1 text-xs font-medium rounded-full",
            getStatusColor(customer.account_status)
          )}>
            {customer.account_status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Contact Information
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 truncate">{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{customer.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">
              Customer since {formatDate(customer.account_created)}
            </span>
          </div>
        </div>
      </div>

      {/* Loan Information */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Loan Information
        </h4>
        {customer.loan_status ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                getLoanStatusColor(customer.loan_status)
              )}>
                {customer.loan_status.toUpperCase()}
              </span>
            </div>
            {customer.loan_amount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <DollarSign className="w-4 h-4" />
                  {customer.loan_amount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No active loan</p>
        )}
      </div>

      {/* Activity */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Activity
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Activity</span>
            <span className="text-sm text-gray-900">{formatDate(customer.last_activity)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Conversations</span>
            <span className="text-sm font-medium text-gray-900">{conversations.length}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.profile_notes && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Notes
          </h4>
          <p className="text-sm text-gray-700">{customer.profile_notes}</p>
        </div>
      )}

      {/* Previous Conversations */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Previous Conversations
        </h4>
        {conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conv) => (
              <div
                key={conv.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    conv.status === 'open' ? 'bg-blue-100 text-blue-800' :
                    conv.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {conv.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(conv.updated_at)}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {conv.subject || conv.last_message?.content || 'No subject'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No previous conversations</p>
        )}
      </div>
    </div>
  );
}
