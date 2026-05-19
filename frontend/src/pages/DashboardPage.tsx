import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Send, Bot, TrendingUp, Mail, Users } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getSendStatus, getSenders } from '../api';
import SendProgress from '../components/SendProgress';
import type { SendStatusResponse } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SendStatusResponse | null>(null);
  const [senderCount, setSenderCount] = useState(0);

  useEffect(() => {
    loadStatus();
    if (user?.role === 'organization') {
      getSenders(user.id).then(res => setSenderCount(res.data.senders?.length || 0));
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      const res = await getSendStatus();
      setStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const stats = [
    { label: 'Total Sent', value: status?.progress.delivered || 0, icon: Send, color: 'text-green-600' },
    { label: 'Failed', value: status?.progress.failed || 0, icon: Mail, color: 'text-red-600' },
    { label: 'Bounced', value: status?.progress.bounced || 0, icon: TrendingUp, color: 'text-yellow-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-500">Manage your email campaigns and AI assistant</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/send-emails"
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Upload className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Send Emails</h3>
              <p className="text-sm text-gray-500">Upload Excel and send bulk emails</p>
            </div>
          </div>
        </Link>

        <Link
          to="/ai-agent"
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bot className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Agent</h3>
              <p className="text-sm text-gray-500">Query emails with AI assistant</p>
            </div>
          </div>
        </Link>

        {user?.role === 'organization' && (
          <Link
            to="/senders"
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Senders</h3>
                <p className="text-sm text-gray-500">{senderCount} sender accounts</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <stat.icon className={stat.color} size={32} />
            </div>
          </div>
        ))}
      </div>

      {/* Send Progress */}
      {status && <SendProgress status={status} />}
    </div>
  );
};

export default DashboardPage;