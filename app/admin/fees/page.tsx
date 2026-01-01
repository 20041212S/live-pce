'use client';

import { useEffect, useState } from 'react';

interface Fee {
  id: string;
  programName: string;
  academicYear: string;
  yearOrSemester: string;
  category: string;
  amount: number;
  currency: string;
}

export default function FeeManagementPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [formData, setFormData] = useState({
    programName: '',
    academicYear: '',
    yearOrSemester: '',
    category: '',
    amount: '',
    currency: 'INR',
  });

  const loadFees = async () => {
    try {
      const res = await fetch('/api/admin/fees');
      const data = await res.json();
      setFees(data);
    } catch (error) {
      console.error('Failed to load fees:', error);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFee 
        ? `/api/admin/fees/${editingFee.id}`
        : '/api/admin/fees';
      const method = editingFee ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingFee(null);
        setFormData({
          programName: '',
          academicYear: '',
          yearOrSemester: '',
          category: '',
          amount: '',
          currency: 'INR',
        });
        loadFees();
      }
    } catch (error) {
      console.error('Failed to save fee:', error);
    }
  };

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee);
    setFormData({
      programName: fee.programName,
      academicYear: fee.academicYear,
      yearOrSemester: fee.yearOrSemester,
      category: fee.category,
      amount: fee.amount.toString(),
      currency: fee.currency,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee entry?')) return;
    
    try {
      const res = await fetch(`/api/admin/fees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadFees();
      }
    } catch (error) {
      console.error('Failed to delete fee:', error);
    }
  };

  // Group fees by program and year
  const groupedFees = fees.reduce((acc, fee) => {
    const key = `${fee.programName}-${fee.academicYear}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(fee);
    return acc;
  }, {} as Record<string, Fee[]>);

  const filteredGroups = Object.entries(groupedFees).filter(([key]) => {
    if (!searchTerm) return true;
    return key.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Fee Structure Management
        </h1>
        <button
          onClick={() => {
            setEditingFee(null);
            setFormData({
              programName: '',
              academicYear: '',
              yearOrSemester: '',
              category: '',
              amount: '',
              currency: 'INR',
            });
            setIsModalOpen(true);
          }}
          className="fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg hover-lift z-10 animate-float relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <span className="material-symbols-outlined text-3xl relative z-10">add</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
        </button>
      </div>

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
            placeholder="Search by program..."
            className="modern-input w-full rounded-2xl py-4 pl-12 pr-4 text-charcoal placeholder-charcoal/60"
          />
        </div>
      </div>

      {/* Fee Cards */}
      <div className="space-y-6">
        {filteredGroups.map(([key, feeGroup], groupIndex) => (
          <div
            key={key}
            className="glass-card rounded-2xl p-6 hover-lift animate-slide-up"
            style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: `${groupIndex * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-2xl font-bold gradient-text mb-1" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {feeGroup[0].programName}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  Academic Year: {feeGroup[0].academicYear}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(feeGroup[0])}
                  className="p-3 rounded-xl glass-card hover-lift transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
                >
                  <span className="material-symbols-outlined text-charcoal">edit</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {feeGroup.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between p-4 rounded-xl glass-card hover-lift transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
                >
                  <div>
                    <p className="font-semibold text-charcoal text-base">
                      {fee.yearOrSemester} - {fee.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg gradient-text" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {fee.currency} {fee.amount.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="p-2 rounded-xl hover-lift transition-all"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(10px)' }}
                    >
                      <span className="material-symbols-outlined text-red-500 text-xl">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full shadow-large max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <h2 className="text-2xl font-bold gradient-text mb-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {editingFee ? 'Edit Fee' : 'Add Fee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Program Name
                </label>
                <input
                  type="text"
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                  required
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  required
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Year/Semester
                </label>
                <input
                  type="text"
                  value={formData.yearOrSemester}
                  onChange={(e) => setFormData({ ...formData, yearOrSemester: e.target.value })}
                  required
                  placeholder="e.g., Year 1, Semester 1"
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  placeholder="e.g., Tuition, Library, Lab"
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-2xl glass-card text-charcoal font-semibold hover-lift transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 px-4 py-3 rounded-2xl text-white font-semibold relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <span className="relative z-10">{editingFee ? 'Update' : 'Create'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

