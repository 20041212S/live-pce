'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth/verify');
      if (!res.ok) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="glass-card rounded-2xl p-8 animate-pulse" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(15px)' }}>
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-primary animate-pulse" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
            <span className="text-charcoal font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/admin', icon: 'dashboard', label: 'Dashboard' },
    { href: '/admin/staff', icon: 'people', label: 'Staff' },
    { href: '/admin/fees', icon: 'receipt_long', label: 'Fees' },
    { href: '/admin/rooms', icon: 'meeting_room', label: 'Rooms' },
    { href: '/admin/contacts', icon: 'contacts', label: 'Contacts' },
    { href: '/admin/knowledge', icon: 'auto_stories', label: 'Knowledge Base' },
    { href: '/admin/academics', icon: 'school', label: 'Academics' },
    { href: '/admin/logs', icon: 'description', label: 'Audit Logs' },
    { href: '/admin/class-timetable', icon: 'schedule', label: 'Class Timetable' },
    { href: '/admin/exam-timetable', icon: 'event', label: 'Exam Timetable' },
  ];

  return (
    <div className="flex h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 via-blue-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar - Glassmorphic */}
      <aside className="w-72 glass-card border-r flex flex-col relative z-10" style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255, 255, 255, 0.18)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.18)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl relative overflow-hidden animate-float" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined text-white text-2xl relative z-10">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Admin Portal
              </h1>
              <p className="text-xs text-gray-600 font-medium">PCE Campus Assistant</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-lift ${
                pathname === item.href
                  ? 'neu-card-inset'
                  : 'hover:bg-white/20'
              }`}
              style={pathname === item.href ? { background: 'rgba(102, 126, 234, 0.15)', boxShadow: 'inset 4px 4px 8px rgba(163, 177, 198, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.8)' } : {}}
            >
              <span className="material-symbols-outlined text-xl" style={{ color: pathname === item.href ? '#667eea' : 'inherit' }}>
                {item.icon}
              </span>
              <span className="font-semibold" style={{ color: pathname === item.href ? '#667eea' : 'inherit' }}>
                {item.label}
              </span>
            </Link>
          ))}
          <Link
            href="/admin/staff"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-lift ${
              pathname === '/admin/staff'
                ? 'neu-card-inset'
                : 'hover:bg-white/20'
            }`}
            style={pathname === '/admin/staff' ? { background: 'rgba(102, 126, 234, 0.15)', boxShadow: 'inset 4px 4px 8px rgba(163, 177, 198, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.8)' } : {}}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: pathname === '/admin/staff' ? '#667eea' : 'inherit' }}>people</span>
            <span className="font-semibold" style={{ color: pathname === '/admin/staff' ? '#667eea' : 'inherit' }}>Staff</span>
          </Link>
          <Link
            href="/admin/fees"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-lift ${
              pathname === '/admin/fees'
                ? 'neu-card-inset'
                : 'hover:bg-white/20'
            }`}
            style={pathname === '/admin/fees' ? { background: 'rgba(102, 126, 234, 0.15)', boxShadow: 'inset 4px 4px 8px rgba(163, 177, 198, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.8)' } : {}}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: pathname === '/admin/fees' ? '#667eea' : 'inherit' }}>receipt_long</span>
            <span className="font-semibold" style={{ color: pathname === '/admin/fees' ? '#667eea' : 'inherit' }}>Fees</span>
          </Link>
          <Link
            href="/admin/client-users"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-lift ${
              pathname === '/admin/client-users'
                ? 'neu-card-inset'
                : 'hover:bg-white/20'
            }`}
            style={pathname === '/admin/client-users' ? { background: 'rgba(102, 126, 234, 0.15)', boxShadow: 'inset 4px 4px 8px rgba(163, 177, 198, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.8)' } : {}}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: pathname === '/admin/client-users' ? '#667eea' : 'inherit' }}>person_add</span>
            <span className="font-semibold" style={{ color: pathname === '/admin/client-users' ? '#667eea' : 'inherit' }}>Registered Clients</span>
          </Link>
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-lift ${
              pathname === '/admin/settings'
                ? 'neu-card-inset'
                : 'hover:bg-white/20'
            }`}
            style={pathname === '/admin/settings' ? { background: 'rgba(102, 126, 234, 0.15)', boxShadow: 'inset 4px 4px 8px rgba(163, 177, 198, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.8)' } : {}}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: pathname === '/admin/settings' ? '#667eea' : 'inherit' }}>settings</span>
            <span className="font-semibold" style={{ color: pathname === '/admin/settings' ? '#667eea' : 'inherit' }}>Settings</span>
          </Link>
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.18)' }}>
          <div className="mb-3 p-3 rounded-xl glass-card" style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
            <p className="text-xs text-gray-500 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-charcoal truncate" title={user?.email || ''}>
              {user?.email || 'Loading...'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white hover-lift transition-all"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)' }}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
