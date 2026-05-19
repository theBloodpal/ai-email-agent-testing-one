import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Send, Bot, LogOut, Users } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Send },
    { path: '/send-emails', label: 'Send Emails', icon: Mail },
    { path: '/ai-agent', label: 'AI Agent', icon: Bot },
    ...(user?.role === 'organization' ? [{ path: '/senders', label: 'Senders', icon: Users }] : []),
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-xl font-bold text-purple-600">
              AI Email
            </Link>
            {user && (
              <div className="flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;