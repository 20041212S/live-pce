'use client';

import { useState } from 'react';

interface Role {
  id: string;
  name: string;
  permissions: number;
  users: number;
}

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roles] = useState<Role[]>([
    { id: '1', name: 'Admin', permissions: 10, users: 3 },
    { id: '2', name: 'Editor', permissions: 7, users: 5 },
    { id: '3', name: 'Faculty', permissions: 4, users: 25 },
    { id: '4', name: 'Student Staff', permissions: 2, users: 8 },
  ]);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Role Access Management
      </h1>
      <p className="text-gray-600 mb-8 text-sm">Manage user roles and permissions</p>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/60 z-10">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a role..."
            className="modern-input w-full rounded-2xl py-4 pl-12 pr-4 text-charcoal placeholder-charcoal/60"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role, index) => (
          <div
            key={role.id}
            className="glass-card rounded-2xl p-6 cursor-pointer hover-lift animate-slide-up transition-all"
            style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl relative overflow-hidden" style={{ background: gradients[index % gradients.length], boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <span className="material-symbols-outlined text-white text-2xl relative z-10">admin_panel_settings</span>
              </div>
              <h3 className="text-2xl font-bold gradient-text flex-1" style={{ background: gradients[index % gradients.length], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {role.name}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">lock</span>
                <span className="font-semibold text-charcoal">{role.permissions} Permissions</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">people</span>
                <span className="font-semibold text-charcoal">{role.users} Users</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-semibold text-white relative overflow-hidden group" style={{ background: gradients[index % gradients.length], boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)' }}>
              <span className="relative z-10">View Details →</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl mb-4 block opacity-50 text-gray-400">search_off</span>
          <p className="text-gray-500 font-medium">No roles found matching your search.</p>
        </div>
      )}
    </div>
  );
}
