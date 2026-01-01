'use client';

import { useEffect, useState } from 'react';

interface Contact {
  id: string;
  name: string;
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  category?: string;
  priority: number;
}

export default function ContactsManagementPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    designation: '',
    email: '',
    phone: '',
    category: '',
    priority: '0',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [selectedCategory]);

  const loadContacts = async () => {
    try {
      const url = selectedCategory !== 'all' 
        ? `/api/admin/contacts?category=${selectedCategory}`
        : '/api/admin/contacts';
      const res = await fetch(url);
      const data = await res.json();
      setContacts(data);
      
      // Extract unique categories
      const cats = Array.from(new Set(data.map((c: Contact) => c.category).filter(Boolean))) as string[];
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingContact 
        ? `/api/admin/contacts/${editingContact.id}`
        : '/api/admin/contacts';
      const method = editingContact ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priority: parseInt(formData.priority) || 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save contact' }));
        throw new Error(errorData.error || 'Failed to save contact');
      }

      const data = await res.json();
      setIsModalOpen(false);
      setEditingContact(null);
      setFormData({
        name: '',
        department: '',
        designation: '',
        email: '',
        phone: '',
        category: '',
        priority: '0',
      });
      loadContacts();
      alert(editingContact ? 'Contact updated successfully!' : 'Contact created successfully!');
    } catch (error: any) {
      console.error('Failed to save contact:', error);
      alert(error.message || 'Failed to save contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      department: contact.department || '',
      designation: contact.designation || '',
      email: contact.email || '',
      phone: contact.phone || '',
      category: contact.category || '',
      priority: contact.priority.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadContacts();
        alert('Contact deleted successfully!');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete contact' }));
        alert(errorData.error || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      alert('Failed to delete contact');
    }
  };

  const filteredContacts = selectedCategory === 'all' 
    ? contacts 
    : contacts.filter(c => c.category === selectedCategory);

  const contactsByCategory = filteredContacts.reduce((acc, contact) => {
    const cat = contact.category || 'Uncategorized';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text animate-slide-up" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Contact Management
        </h1>
        <button
          onClick={() => {
            setEditingContact(null);
            setFormData({
              name: '',
              department: '',
              designation: '',
              email: '',
              phone: '',
              category: '',
              priority: '0',
            });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold relative overflow-hidden group hover-lift"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <span className="material-symbols-outlined relative z-10">add</span>
          <span className="relative z-10">Add Contact</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category List */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <h2 className="text-xl font-bold text-charcoal mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">category</span>
            Categories
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold ${
                selectedCategory === 'all'
                  ? 'text-white shadow-lg'
                  : 'glass-card text-charcoal hover:bg-white/30'
              }`}
              style={selectedCategory === 'all' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' } : { background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
            >
              All Contacts
            </button>
            {categories.map((category) => {
              const count = contacts.filter(c => c.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between font-semibold ${
                    selectedCategory === category
                      ? 'text-white shadow-lg'
                      : 'glass-card text-charcoal hover:bg-white/30'
                  }`}
                  style={selectedCategory === category ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' } : { background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
                >
                  <span>{category}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory === category ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contacts List */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(contactsByCategory).map(([category, categoryContacts], categoryIndex) => (
            <div key={category} className="glass-card rounded-2xl p-6 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.3)', animationDelay: `${categoryIndex * 0.1}s` }}>
              <h3 className="text-xl font-bold gradient-text mb-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {category}
              </h3>
              <div className="space-y-3">
                {categoryContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 rounded-xl glass-card hover-lift transition-all"
                    style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-charcoal text-base">{contact.name}</p>
                      {contact.designation && (
                        <p className="text-sm text-gray-600 font-medium">{contact.designation}</p>
                      )}
                      {contact.department && (
                        <p className="text-sm text-gray-600">{contact.department}</p>
                      )}
                      <div className="flex gap-4 mt-2">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">email</span>
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">phone</span>
                            {contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-3 rounded-xl glass-card hover-lift transition-all"
                        style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}
                      >
                        <span className="material-symbols-outlined text-charcoal">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-3 rounded-xl hover-lift transition-all"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(10px)' }}
                      >
                        <span className="material-symbols-outlined text-red-500">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}>
              <p className="text-gray-600">No contacts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full shadow-large max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <h2 className="text-2xl font-bold gradient-text mb-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Name *
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
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Administration, Academic, Support, Emergency"
                  className="modern-input w-full rounded-2xl py-3 px-4 text-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Priority (Higher number = displayed first)
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  min="0"
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
                  disabled={loading}
                  className="btn-primary flex-1 px-4 py-3 rounded-2xl text-white font-semibold relative overflow-hidden group disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <span className="relative z-10">{loading ? 'Saving...' : (editingContact ? 'Update' : 'Create')}</span>
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

