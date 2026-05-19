import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../AuthContext';
import {
  queryEmailInsights,
  indexEmails,
  getRecentEmails,
  getEmailByUid,
  emailAction,
  getChatHistory,
  addChatTurn,
} from '../api';
import type { ChatMessage, EmailSnippet } from '../types';

const AiAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emails, setEmails] = useState<EmailSnippet[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<{ uid: string; body: string } | null>(null);
  const [indexing, setIndexing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecentEmails();
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRecentEmails = async () => {
    try {
      const res = await getRecentEmails(40);
      setEmails(res.data.emails || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const res = await getChatHistory(user.id);
      const history = res.data.history || [];
      setMessages(history.map((h: { role: string; content: string }) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleIndex = async () => {
    setIndexing(true);
    try {
      await indexEmails(200, 'headers');
      await loadRecentEmails();
    } catch (e) {
      console.error(e);
    } finally {
      setIndexing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      if (userMessage.toLowerCase().includes('open') || userMessage.toLowerCase().includes('read')) {
        const uidMatch = userMessage.match(/uid[:\s]*(\d+)/i) || userMessage.match(/email\s*(\d+)/i);
        if (uidMatch) {
          const res = await getEmailByUid(uidMatch[1]);
          const body = res.data.body || 'No content';
          setMessages(prev => [...prev, { role: 'assistant', content: `Email UID ${uidMatch[1]}:\n\n${body}` }]);
          setSelectedEmail({ uid: uidMatch[1], body });
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please specify a UID, e.g., "open email uid 12345"' }]);
        }
      } else {
        const res = await queryEmailInsights(userMessage, 0, true);
        const answer = res.data.answer || 'No response';
        setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        if (res.data.emails) {
          setEmails(res.data.emails);
        }
      }

      await addChatTurn(user.id, 'user', userMessage);
      await addChatTurn(user.id, 'assistant', '');
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.response?.data?.detail || e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (action: string, uid: string) => {
    try {
      const res = await emailAction(action, uid);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message || 'Action completed' }]);
      await loadRecentEmails();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Email List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900 dark:text-white">Inbox</h2>
            <button
              onClick={handleIndex}
              disabled={indexing}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Index emails"
            >
              <RefreshCw size={16} className={indexing ? 'animate-spin' : ''} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search emails..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {emails.map((email) => (
            <div
              key={email.uid}
              onClick={() => setSelectedEmail({ uid: email.uid, body: email.body })}
              className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedEmail?.uid === email.uid ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${email.seen ? 'bg-gray-200' : 'bg-purple-500 text-white'}`}>
                  {email.seen ? 'Read' : 'Unread'}
                </span>
                <span className="text-xs text-gray-400">{email.date?.split('T')[0]}</span>
              </div>
              <p className="text-sm font-medium truncate">{email.subject || '(No subject)'}</p>
              <p className="text-xs text-gray-500 truncate">{email.from}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Selected Email */}
        {selectedEmail && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">Email UID: {selectedEmail.uid}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEmailAction('mark_read', selectedEmail.uid)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleEmailAction('mark_unread', selectedEmail.uid)}
                  className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                >
                  Mark Unread
                </button>
                <button
                  onClick={() => handleEmailAction('move_to_trash', selectedEmail.uid)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
            <pre className="text-sm whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
              {selectedEmail.body}
            </pre>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bot size={48} className="mx-auto mb-4 text-purple-400" />
              <p>Ask me anything about your emails!</p>
              <p className="text-sm mt-2">
                Try: "Show unread emails", "Summarize inbox", "Find emails from John"
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <pre className="whitespace-pre-wrap text-sm font-sans">{msg.content}</pre>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your emails..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Try: "show latest 5 emails", "mark read uid 123", "unsubscribe from uid 456"
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAgentPage;