'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [authMethods, setAuthMethods] = useState({
    authenticator: true,
    sms: false,
    email: true,
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    alert('Settings saved!');
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Security & Settings
      </h1>
      <p className="text-gray-600 mb-8 text-sm">Configure security and authentication settings</p>

      <div className="space-y-6 max-w-2xl">
        {/* 2FA Toggle */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-charcoal mb-1">Enforce 2FA for all users</h3>
              <p className="text-sm text-gray-600 font-medium">
                Require two-factor authentication for all admin users
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enforce2FA}
                onChange={(e) => setEnforce2FA(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary" style={{ background: enforce2FA ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined }}></div>
            </label>
          </div>
        </div>

        {/* Authentication Methods */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <h3 className="text-lg font-bold text-charcoal mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">security</span>
            Authentication Methods
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl glass-card hover-lift transition-all" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
              <input
                type="checkbox"
                checked={authMethods.authenticator}
                onChange={(e) => setAuthMethods({ ...authMethods, authenticator: e.target.checked })}
                className="w-5 h-5 rounded text-primary border-soft-gray focus:ring-primary"
                style={{ accentColor: '#667eea' }}
              />
              <div className="flex-1">
                <p className="font-semibold text-charcoal">Authenticator App</p>
                <p className="text-sm text-gray-600 font-medium">Use Google Authenticator or similar apps</p>
              </div>
              <span className="material-symbols-outlined text-primary">phone_android</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl glass-card hover-lift transition-all" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
              <input
                type="checkbox"
                checked={authMethods.sms}
                onChange={(e) => setAuthMethods({ ...authMethods, sms: e.target.checked })}
                className="w-5 h-5 rounded text-primary border-soft-gray focus:ring-primary"
                style={{ accentColor: '#667eea' }}
              />
              <div className="flex-1">
                <p className="font-semibold text-charcoal">SMS</p>
                <p className="text-sm text-gray-600 font-medium">Receive verification codes via SMS</p>
              </div>
              <span className="material-symbols-outlined text-accent">sms</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl glass-card hover-lift transition-all" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
              <input
                type="checkbox"
                checked={authMethods.email}
                onChange={(e) => setAuthMethods({ ...authMethods, email: e.target.checked })}
                className="w-5 h-5 rounded text-primary border-soft-gray focus:ring-primary"
                style={{ accentColor: '#667eea' }}
              />
              <div className="flex-1">
                <p className="font-semibold text-charcoal">Email</p>
                <p className="text-sm text-gray-600 font-medium">Receive verification codes via email</p>
              </div>
              <span className="material-symbols-outlined text-primary">mail</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary px-8 py-4 rounded-2xl text-white font-semibold relative overflow-hidden group hover-lift"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)' }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined">save</span>
            Save Changes
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
        {/* Logout button removed per design request */}
      </div>
    </div>
  );
}
