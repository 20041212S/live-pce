'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  users: {
    total: number;
    verified: number;
  };
  conversations: {
    total: number;
    today: number;
  };
  messages: {
    total: number;
    today: number;
  };
  staff: {
    total: number;
  };
  fees: {
    total: number;
  };
  rooms: {
    total: number;
  };
  contacts: {
    total: number;
  };
  academicPdfs: {
    total: number;
  };
  recentLogins: Array<{
    id: string;
    createdAt: string;
    actor: {
      email: string;
      name: string;
    };
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/stats');
      
      if (!res.ok) {
        throw new Error('Failed to load dashboard stats');
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load dashboard data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Dashboard
      </h1>
      <p className="text-gray-600 mb-8 text-sm">Welcome back! Here's your overview.</p>

      {/* Stats Cards - Glassmorphic with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Verified Users</p>
              <p className="text-4xl font-bold gradient-text" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stats.users.verified}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total: {stats.users.total}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined text-white text-2xl relative z-10">people</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Total Conversations</p>
              <p className="text-4xl font-bold gradient-text" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stats.conversations.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">Today: {stats.conversations.today}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', boxShadow: '0 8px 30px rgba(79, 172, 254, 0.3)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined text-white text-2xl relative z-10">chat</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Total Messages</p>
              <p className="text-4xl font-bold gradient-text" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stats.messages.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">Today: {stats.messages.today}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', boxShadow: '0 8px 30px rgba(240, 147, 251, 0.3)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined text-white text-2xl relative z-10">message</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Active Staff</p>
              <p className="text-4xl font-bold gradient-text" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stats.staff.total}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined text-white text-2xl relative z-10">groups</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Fee Records</p>
              <p className="text-3xl font-bold text-charcoal">{stats.fees.total}</p>
            </div>
            <span className="material-symbols-outlined text-charcoal/60 text-3xl">receipt_long</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Rooms</p>
              <p className="text-3xl font-bold text-charcoal">{stats.rooms.total}</p>
            </div>
            <span className="material-symbols-outlined text-charcoal/60 text-3xl">meeting_room</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Contacts</p>
              <p className="text-3xl font-bold text-charcoal">{stats.contacts.total}</p>
            </div>
            <span className="material-symbols-outlined text-charcoal/60 text-3xl">contacts</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Academic PDFs</p>
              <p className="text-3xl font-bold text-charcoal">{stats.academicPdfs.total}</p>
            </div>
            <span className="material-symbols-outlined text-charcoal/60 text-3xl">description</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        {/* Recent Login Activity */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Recent Login Activity
          </h2>
          <div className="space-y-3">
            {stats.recentLogins.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No login activity yet</p>
            ) : (
              stats.recentLogins.map((login) => (
                <div key={login.id} className="flex items-center justify-between p-4 rounded-xl glass-card hover-lift transition-all" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
                  <div>
                    <p className="font-semibold text-charcoal">{login.actor.name || login.actor.email}</p>
                    <p className="text-sm text-gray-600">{formatTimeAgo(login.createdAt)}</p>
                  </div>
                  <span className="px-4 py-2 rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                    SUCCESS
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
