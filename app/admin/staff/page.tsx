'use client';

import { useEffect, useState } from 'react';

interface Staff {
  id: string;
  name: string;
  department: string;
  designation: string;
  email?: string;
  phone?: string;
  status: string;
  avatarUrl?: string;
  qualifications?: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    designation: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
    avatarUrl: '',
    qualifications: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadStaff();
  }, [selectedDept]);

  const loadStaff = async () => {
    try {
      const url = selectedDept !== 'all' 
        ? `/api/admin/staff?department=${selectedDept}`
        : '/api/admin/staff';
      const res = await fetch(url);
      const data = await res.json();
      setStaff(data);
      
      // Extract unique departments
      const depts = Array.from(new Set(data.map((s: Staff) => s.department))) as string[];
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStaff 
        ? `/api/admin/staff/${editingStaff.id}`
        : '/api/admin/staff';
      const method = editingStaff ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingStaff(null);
        setFormData({
          name: '',
          department: '',
          designation: '',
          email: '',
          phone: '',
          status: 'ACTIVE',
          avatarUrl: '',
          qualifications: '',
        });
        setImagePreview(null);
        loadStaff();
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      department: staffMember.department,
      designation: staffMember.designation,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      status: staffMember.status,
      avatarUrl: staffMember.avatarUrl || '',
      qualifications: staffMember.qualifications || '',
    });
    setImagePreview(staffMember.avatarUrl || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadStaff();
      }
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/staff/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await res.json();
      setFormData(prev => ({ ...prev, avatarUrl: data.url }));
      setImagePreview(data.url);
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    setImagePreview(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Faculty Management
        </h1>
        <button
          onClick={() => {
            setEditingStaff(null);
            setFormData({
              name: '',
              department: '',
              designation: '',
              email: '',
              phone: '',
              status: 'ACTIVE',
              avatarUrl: '',
              qualifications: '',
            });
            setImagePreview(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold relative overflow-hidden group hover-lift"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <span className="material-symbols-outlined relative z-10">add</span>
          <span className="relative z-10">Add Staff</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      {/* Department Tabs - Pill Filters */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDept('all')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
            selectedDept === 'all'
              ? 'text-white shadow-lg'
              : 'glass-card text-charcoal hover:bg-white/30'
          }`}
          style={selectedDept === 'all' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' } : { background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
        >
          All
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              selectedDept === dept
                ? 'text-white shadow-lg'
                : 'glass-card text-charcoal hover:bg-white/30'
            }`}
            style={selectedDept === dept ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' } : { background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Staff List */}
      <div className="space-y-4">
        {staff.map((member, index) => (
          <div
            key={member.id}
            className="glass-card rounded-2xl p-5 hover-lift animate-slide-up flex items-center justify-between"
            style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-4">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="h-14 w-14 rounded-2xl object-cover"
                  style={{ boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)' }}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl relative overflow-hidden font-bold text-white text-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <span className="relative z-10">{member.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-charcoal text-lg">{member.name}</p>
                <p className="text-sm text-gray-600 font-medium">
                  {member.designation} • {member.department}
                </p>
                {member.email && (
                  <p className="text-xs text-gray-500 mt-1">{member.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(member)}
                className="p-3 rounded-xl glass-card hover-lift transition-all"
                style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
              >
                <span className="material-symbols-outlined text-charcoal">edit</span>
              </button>
              <button
                onClick={() => handleDelete(member.id)}
                className="p-3 rounded-xl hover-lift transition-all"
                style={{ background: 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(10px)' }}
              >
                <span className="material-symbols-outlined text-red-500">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Glassmorphic */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full shadow-large max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <h2 className="text-2xl font-bold gradient-text mb-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {editingStaff ? 'Edit Staff' : 'Add Staff'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Faculty Image <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-2xl mb-2"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-4xl text-gray-400">
                        {uploadingImage ? 'hourglass_empty' : 'image'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? 'Uploading...' : 'Click to upload faculty image'}
                      </span>
                      <span className="text-xs text-gray-400">Max 5MB (JPEG, PNG, GIF, WebP)</span>
                    </label>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Qualifications <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="Enter staff qualifications (e.g., Ph.D., M.Tech, etc.)"
                  rows={3}
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
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
                  <span className="relative z-10">{editingStaff ? 'Update' : 'Create'}</span>
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

