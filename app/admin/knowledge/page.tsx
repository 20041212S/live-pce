'use client';

import { useEffect, useState } from 'react';

interface Knowledge {
  id: string;
  source: string;
  type: string;
  name: string;
  text: string;
  imageUrl?: string | null;
  imageDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeManagementPage() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    type: '',
    name: '',
    text: '',
    imageUrl: '',
    imageDescription: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadKnowledge = async () => {
    try {
      let url = '/api/admin/knowledge';
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (searchTerm) params.append('search', searchTerm);
      if (params.toString()) url += '?' + params.toString();
      
      const res = await fetch(url);
      const data = await res.json();
      setKnowledge(data);
      
      // Extract unique types
      const uniqueTypes = Array.from(new Set(data.map((k: Knowledge) => k.type))) as string[];
      setTypes(uniqueTypes);
    } catch (error) {
      console.error('Failed to load knowledge:', error);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, [selectedType, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingKnowledge 
        ? `/api/admin/knowledge/${editingKnowledge.id}`
        : '/api/admin/knowledge';
      const method = editingKnowledge ? 'PUT' : 'POST';
      
      // Prepare data - ensure empty strings become null for optional fields
      const submitData = {
        ...formData,
        imageUrl: formData.imageUrl || null,
        imageDescription: formData.imageDescription || null,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (jsonError) {
          // If response is not JSON, get text
          const textError = await res.text().catch(() => 'Unknown error');
          throw new Error(`Server error (${res.status}): ${textError}`);
        }
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      let result;
      try {
        result = await res.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server');
      }
      setIsModalOpen(false);
      setEditingKnowledge(null);
      setFormData({
        source: '',
        type: '',
        name: '',
        text: '',
        imageUrl: '',
        imageDescription: '',
      });
      setImagePreview(null);
      loadKnowledge();
    } catch (error: any) {
      console.error('Failed to save knowledge:', error);
      alert(error.message || 'Failed to save knowledge entry. Please check the console for details.');
    }
  };

  const handleEdit = (item: Knowledge) => {
    setEditingKnowledge(item);
    setFormData({
      source: item.source,
      type: item.type,
      name: item.name,
      text: item.text,
      imageUrl: item.imageUrl || '',
      imageDescription: item.imageDescription || '',
    });
    setImagePreview(item.imageUrl || null);
    setIsModalOpen(true);
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

      const res = await fetch('/api/admin/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      setImagePreview(data.url);
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '', imageDescription: '' }));
    setImagePreview(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge entry?')) return;
    
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadKnowledge();
      }
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
      alert('Failed to delete knowledge entry');
    }
  };

  const knowledgeTypes = [
    'FAQ',
    'Policy',
    'Procedure',
    'General Info',
    'Event',
    'Announcement',
    'Academic',
    'Administrative',
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">Knowledge Base</h1>
          <p className="text-gray-600">Manage information that the chatbot can learn from</p>
        </div>
        <button
          onClick={() => {
            setEditingKnowledge(null);
            setFormData({ source: '', type: '', name: '', text: '', imageUrl: '', imageDescription: '' });
            setImagePreview(null);
            setIsModalOpen(true);
          }}
          className="btn-primary px-6 py-3 rounded-xl text-white font-semibold hover-lift transition-all"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          + Add Knowledge
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl flex gap-4 items-center" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search knowledge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-input w-full rounded-xl py-2 px-4"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="modern-input rounded-xl py-2 px-4 min-w-[200px]"
        >
          <option value="all">All Types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Knowledge List */}
      <div className="grid gap-4">
        {knowledge.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}>
            <p className="text-gray-600">No knowledge entries found. Add your first entry to help the chatbot learn!</p>
          </div>
        ) : (
          knowledge.map((item) => (
            <div
              key={item.id}
              className="glass-card p-6 rounded-2xl hover-lift transition-all"
              style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-600">{item.source}</span>
                  </div>
                  <h3 className="text-lg font-bold text-charcoal mb-2">{item.name}</h3>
                  <p className="text-gray-700 text-sm line-clamp-3">{item.text}</p>
                  {item.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={item.imageUrl}
                        alt={item.imageDescription || item.name}
                        className="max-w-xs h-auto rounded-lg border border-gray-200"
                      />
                      {item.imageDescription && (
                        <p className="text-xs text-gray-500 mt-1 italic">{item.imageDescription}</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Updated: {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-charcoal hover-lift transition-all"
                    style={{ background: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white hover-lift transition-all"
                    style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)' }}>
            <h2 className="text-2xl font-bold text-charcoal mb-4">
              {editingKnowledge ? 'Edit Knowledge' : 'Add Knowledge'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Source <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Student Handbook, Website, FAQ"
                  className="modern-input w-full rounded-xl py-3 px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="modern-input w-full rounded-xl py-3 px-4"
                >
                  <option value="">Select type...</option>
                  {knowledgeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Title/Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Library Hours, Fee Payment Process"
                  className="modern-input w-full rounded-xl py-3 px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Enter the information that the chatbot should learn. Be detailed and clear."
                  rows={8}
                  className="modern-input w-full rounded-xl py-3 px-4 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This content will be used by the chatbot to answer student questions.
                </p>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Image (Optional)
                </label>
                {imagePreview ? (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-auto max-h-64 rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <input
                      type="hidden"
                      value={formData.imageUrl}
                      name="imageUrl"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
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
                        image
                      </span>
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? 'Uploading...' : 'Click to upload an image'}
                      </span>
                      <span className="text-xs text-gray-500">
                        JPEG, PNG, GIF, WebP (Max 5MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Image Description */}
              {imagePreview && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Image Description (Optional)
                  </label>
                  <textarea
                    value={formData.imageDescription}
                    onChange={(e) => setFormData({ ...formData, imageDescription: e.target.value })}
                    placeholder="Describe what's in the image. This helps the chatbot understand and reference the image."
                    rows={3}
                    className="modern-input w-full rounded-xl py-3 px-4 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe the image content. This information will be used by the chatbot to understand and reference the image.
                  </p>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingKnowledge(null);
                  }}
                  className="px-6 py-3 rounded-xl text-charcoal font-semibold hover-lift transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.5)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-white font-semibold hover-lift transition-all"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {editingKnowledge ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

