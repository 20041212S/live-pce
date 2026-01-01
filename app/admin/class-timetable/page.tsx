"use client";

import { useEffect, useState } from 'react';

export default function ClassTimetablePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ programName: '', semester: '', dayOfWeek: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ programName: '', semester: '', dayOfWeek: '', period: '', subject: '', faculty: '', room: '' });

  const load = async (appliedFilters = filters) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (appliedFilters.programName) q.set('programName', appliedFilters.programName);
      if (appliedFilters.semester) q.set('semester', appliedFilters.semester);
      if (appliedFilters.dayOfWeek) q.set('dayOfWeek', appliedFilters.dayOfWeek);
      const res = await fetch('/api/admin/class-timetable?' + q.toString());
      const data = await res.json();
      setRows(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ programName: '', semester: '', dayOfWeek: '', period: '', subject: '', faculty: '', room: '' });
    setIsModalOpen(true);
  };

  const handleCreate = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const url = editing ? `/api/admin/class-timetable/${editing.id}` : '/api/admin/class-timetable';
      const method = editing ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setIsModalOpen(false);
      setEditing(null);
      load();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (r: any) => {
    setEditing(r);
    setForm({ programName: r.programName, semester: r.semester, dayOfWeek: r.dayOfWeek, period: r.period, subject: r.subject, faculty: r.faculty, room: r.room });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    await fetch('/api/admin/class-timetable/' + id, { method: 'DELETE' });
    load();
  };

  const handleFilter = () => load(filters);

  const handleClear = () => {
    const reset = { programName: '', semester: '', dayOfWeek: '' };
    setFilters(reset);
    load(reset);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Class Timetable
          </h1>
          <p className="text-gray-600 text-sm">Manage class timetable entries</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold relative overflow-hidden group hover-lift" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <span className="material-symbols-outlined relative z-10">add</span>
          <span className="relative z-10">Add Entry</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <h3 className="text-xl font-bold text-charcoal mb-4">Filters</h3>
          <div className="space-y-3">
            <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" placeholder="Program" value={filters.programName} onChange={(e)=>setFilters({...filters, programName: e.target.value})} />
            <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" placeholder="Semester" value={filters.semester} onChange={(e)=>setFilters({...filters, semester: e.target.value})} />
            <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" placeholder="Day" value={filters.dayOfWeek} onChange={(e)=>setFilters({...filters, dayOfWeek: e.target.value})} />
            <div className="flex gap-3">
              <button type="button" onClick={handleFilter} className="btn-primary flex-1 h-12 rounded-2xl text-white font-semibold hover-lift">Filter</button>
              <button type="button" onClick={handleClear} className="btn-secondary flex-1 h-12 rounded-2xl font-semibold text-charcoal hover-lift">Clear</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            {loading ? <p>Loading...</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left"><th>Program</th><th>Semester</th><th>Day</th><th>Period</th><th>Subject</th><th>Faculty</th><th>Room</th><th></th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-3">{r.programName}</td>
                      <td className="py-3">{r.semester}</td>
                      <td className="py-3">{r.dayOfWeek}</td>
                      <td className="py-3">{r.period}</td>
                      <td className="py-3">{r.subject}</td>
                      <td className="py-3">{r.faculty}</td>
                      <td className="py-3">{r.room}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={()=>handleEdit(r)} className="p-2 rounded-xl glass-card hover-lift"><span className="material-symbols-outlined text-charcoal">edit</span></button>
                          <button onClick={()=>handleDelete(r.id)} className="p-2 rounded-xl hover-lift" style={{ background: 'rgba(239,68,68,0.06)' }}><span className="material-symbols-outlined text-red-500">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full shadow-large max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <h2 className="text-2xl font-bold gradient-text mb-6">{editing ? 'Edit Entry' : 'Add Entry'}</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Program</label>
                <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" value={form.programName} onChange={(e)=>setForm({...form, programName: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Semester</label>
                <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" value={form.semester} onChange={(e)=>setForm({...form, semester: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Day of Week</label>
                <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" value={form.dayOfWeek} onChange={(e)=>setForm({...form, dayOfWeek: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Period</label>
                <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" value={form.period} onChange={(e)=>setForm({...form, period: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Subject</label>
                <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" value={form.subject} onChange={(e)=>setForm({...form, subject: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Faculty</label>
                  <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" value={form.faculty} onChange={(e)=>setForm({...form, faculty: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Room</label>
                  <input className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal" value={form.room} onChange={(e)=>setForm({...form, room: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl glass-card text-charcoal font-semibold hover-lift transition-all" style={{ background: 'rgba(255,255,255,0.3)' }}>Cancel</button>
                <button type="submit" className="btn-primary flex-1 px-4 py-3 rounded-2xl text-white font-semibold relative overflow-hidden group">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
