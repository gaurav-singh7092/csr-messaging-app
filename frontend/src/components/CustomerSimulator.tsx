'use client';

import { useState } from 'react';
import { Send, RefreshCw, CheckCircle, X } from 'lucide-react';
import { API_ENDPOINTS, apiRequest } from '@/lib/api';

export default function CustomerSimulator() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim() || !message.trim()) {
      setError('Email and message are required');
      return;
    }

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      await apiRequest(API_ENDPOINTS.externalMessages, {
        method: 'POST',
        body: JSON.stringify({
          content: message,
          customer_email: email,
          customer_name: name || undefined,
        }),
      });
      
      setSuccess(true);
      setMessage('');
      
      // Reset success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sampleMessages = [
    "Hi, I applied for a loan 3 days ago and haven't heard back. When will my loan be approved?",
    "URGENT! I need my loan disbursed immediately. I have a medical emergency!",
    "I can't login to my account. It says my password is wrong.",
    "How do I update my phone number on my account?",
    "My payment failed but money was deducted from my bank account. Please help!",
    "Thanks for the quick loan approval! Great service.",
    "Someone made unauthorized transactions on my account! I think I've been hacked!",
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600">
        <h2 className="text-lg font-semibold text-white">Customer Message Simulator</h2>
        <p className="text-green-100 text-sm">Send messages as a customer to test the system</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your customer message here..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Sample Messages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Sample Messages
          </label>
          <div className="flex flex-wrap gap-2">
            {sampleMessages.map((sample, index) => (
              <button
                key={index}
                onClick={() => setMessage(sample)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {sample.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            Message sent successfully! Check the agent portal.
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Customer Message
            </>
          )}
        </button>
      </div>
    </div>
  );
}
