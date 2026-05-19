import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getSenders, addSender, selectSender } from '../api';
import type { Sender } from '../types';

const SendersPage: React.FC = () => {
  const { user } = useAuth();
  const [senders, setSenders] = useState<Sender[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    organization_name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadSenders();
    }
  }, [user]);

  const loadSenders = async () => {
    if (!user) return;
    try {
      const res = await getSenders(user.id);
      setSenders(res.data.senders || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      await addSender({
        user_id: user.id,
        ...form,
      });
      await loadSenders();
      setShowAdd(false);
      setForm({ name: '', organization_name: '', email: '', password: '' });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add sender');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (senderId: number) => {
    try {
      await selectSender(senderId);
      alert('Sender selected as active');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to select sender');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Senders</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} />
          <span>Add Sender</span>
        </button>
      </div>

      {senders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No senders configured yet</p>
          <p className="text-sm text-gray-400 mt-2">Add your first sender account to start sending emails</p>
        </div>
      ) : (
        <div className="space-y-4">
          {senders.map((sender) => (
            <div
              key={sender.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{sender.name}</h3>
                  <p className="text-sm text-gray-500">{sender.organization_name}</p>
                  <p className="text-sm text-purple-600 mt-1">{sender.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSelect(sender.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Set Active
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Sender</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={form.organization_name}
                  onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  App Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generate from Google Account → Security → App Passwords
                </p>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Sender'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendersPage;