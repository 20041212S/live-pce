'use client';

import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  severity: string;
  createdAt: string;
  actor: {
    name: string;
    email: string;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('7');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const loadLogs = async () => {
    try {
      let url = `/api/admin/logs?days=${selectedFilter}`;
      if (selectedSeverity !== 'all') {
        url += `&severity=${selectedSeverity}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedFilter, selectedSeverity]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'IMPORTANT':
      case 'HIGH_PRIORITY':
        return { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: 'text-white' };
      case 'WARNING':
        return { bg: 'linear-gradient(135deg, #fad961 0%, #f76b1c 100%)', text: 'text-white' };
      case 'ERROR':
        return { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: 'text-white' };
      default:
        return { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: 'text-white' };
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Logs & Audit Trail
      </h1>
      <p className="text-gray-600 mb-8 text-sm">Monitor system activity and security events</p>

      {/* Filters - Pill Style */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedFilter('1')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            selectedFilter === '1'
              ? 'text-white shadow-lg'
              : 'glass-card text-charcoal hover:bg-white/30'
          }`}
          style={selectedFilter === '1' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' } : { background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
        >
          Recent
        </button>
        <button
          onClick={() => setSelectedFilter('7')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            selectedFilter === '7'
              ? 'text-white shadow-lg'
              : 'glass-card text-charcoal hover:bg-white/30'
          }`}
          style={selectedFilter === '7' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' } : { background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setSelectedFilter('30')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            selectedFilter === '30'
              ? 'text-white shadow-lg'
              : 'glass-card text-charcoal hover:bg-white/30'
          }`}
          style={selectedFilter === '30' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' } : { background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
        >
          Last 30 Days
        </button>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-5 py-2.5 rounded-full text-sm font-semibold glass-card text-charcoal border-0"
          style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
        >
          <option value="all">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="ERROR">Error</option>
          <option value="IMPORTANT">Important</option>
          <option value="HIGH_PRIORITY">High Priority</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
        <div className="divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          {logs.map((log, index) => {
            const severityStyle = getSeverityColor(log.severity);
            return (
              <div key={log.id} className="p-5 hover-lift transition-all animate-slide-up" style={{ background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent', animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <span className="material-symbols-outlined text-white text-lg relative z-10">person</span>
                      </div>
                      <p className="font-bold text-charcoal text-lg">{log.actor.name}</p>
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold shadow-lg" style={{ background: severityStyle.bg, color: severityStyle.text }}>
                        {log.severity}
                      </span>
                    </div>
                    <p className="text-charcoal mb-2 font-medium">
                      {log.action}
                      {log.entityType && (
                        <span className="text-gray-600 font-normal"> • {log.entityType}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {logs.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <span className="material-symbols-outlined text-5xl mb-4 block opacity-50">description</span>
            <p className="font-medium">No logs found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
