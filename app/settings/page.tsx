"use client";

import { useRouter } from 'next/navigation';

export default function ClientSettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('clientUserId');
    localStorage.removeItem('clientUserLoggedIn');
    localStorage.removeItem('clientUserType');
    localStorage.removeItem('hasSeenOnboarding');
    // Optionally clear other client state
    router.push('/');
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Settings
        </h1>
        <p className="text-gray-600 mb-6 text-sm">Manage your client session and preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <h3 className="text-lg font-bold text-charcoal mb-2">Session</h3>
          <p className="text-sm text-gray-600 mb-4">Log out from the client portal to end your session on this device.</p>
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-white hover-lift"
              style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ff3b3b 100%)', boxShadow: '0 4px 15px rgba(255, 107, 107, 0.25)' }}
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
