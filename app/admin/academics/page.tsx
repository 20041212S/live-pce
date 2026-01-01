'use client';

import { useEffect, useState } from 'react';

interface AcademicPdf {
  id: string;
  title: string;
  description: string | null;
  semester: string | null;
  subject: string | null;
  category: string | null;
  fileUrl: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AcademicsPage() {
  const [academicPdfs, setAcademicPdfs] = useState<AcademicPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicPdf | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Helper function to get initial form data with all fields defined
  const getInitialFormData = () => ({
    title: '',
    description: '',
    semester: '',
    subject: '',
    category: '',
    fileUrl: '',
  });

  const [formData, setFormData] = useState<any>(getInitialFormData());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const pdfsRes = await fetch('/api/admin/academic-pdfs');
      const pdfsData = pdfsRes.ok ? await pdfsRes.json() : [];
      setAcademicPdfs(Array.isArray(pdfsData) ? pdfsData : []);
    } catch (error) {
      console.error('Failed to load academics data:', error);
      setAcademicPdfs([]);
    } finally {
      setLoading(false);
    }
  };


  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/academic-pdfs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload PDF');
      }

      const data = await res.json();
      setFormData((prev: any) => ({ ...prev, fileUrl: data.url }));
    } catch (error: any) {
      alert(error.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.fileUrl) {
        alert('Title and PDF file are required');
        return;
      }

      const url = editingItem
        ? `/api/admin/academic-pdfs/${editingItem.id}`
        : '/api/admin/academic-pdfs';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const payload = {
        title: formData.title,
        description: formData.description || null,
        semester: formData.semester || null,
        subject: formData.subject || null,
        category: formData.category || null,
        fileUrl: formData.fileUrl,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingItem(null);
        setFormData(getInitialFormData());
        loadData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save PDF:', error);
      alert('Failed to save PDF');
    }
  };

  const handleEdit = (item: AcademicPdf) => {
    setEditingItem(item);
    const baseFormData = getInitialFormData();
      setFormData({
      ...baseFormData,
      title: item.title,
      description: item.description || '',
      semester: item.semester || '',
      subject: item.subject || '',
      category: item.category || '',
      fileUrl: item.fileUrl,
    });
    setImagePreview(item.fileUrl || null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PDF?')) return;
    
    try {
      const res = await fetch(`/api/admin/academic-pdfs/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        loadData();
        setSelectedItems(new Set());
        alert('PDF deleted successfully');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete' }));
        alert(errorData.error || 'Failed to delete');
      }
    } catch (error: any) {
      console.error('Failed to delete:', error);
      alert(error?.message || 'Failed to delete');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(academicPdfs.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} PDF(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/admin/academic-pdfs/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));

      if (failed.length > 0) {
        alert(`Failed to delete ${failed.length} item(s). Please try again.`);
      } else {
        alert(`Successfully deleted ${selectedItems.size} PDF(s)`);
      }

      setSelectedItems(new Set());
      loadData();
    } catch (error: any) {
      console.error('Failed to delete items:', error);
      alert(error?.message || 'Failed to delete items');
    }
  };

  const isAllSelected = academicPdfs.length > 0 && selectedItems.size === academicPdfs.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < academicPdfs.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">Academics</h1>
          <p className="text-gray-600">Manage academic PDFs</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedItems.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-6 py-3 rounded-xl text-white font-semibold hover-lift transition-all"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
            >
              Delete Selected ({selectedItems.size})
            </button>
          )}
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData(getInitialFormData());
              setImagePreview(null);
              setShowModal(true);
            }}
            className="btn-primary px-6 py-3 rounded-xl text-white font-semibold hover-lift transition-all"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            + Upload PDF
          </button>
        </div>
      </div>

      {/* Academic PDFs */}
      {
        <div className="glass-card rounded-2xl overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}>
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : !Array.isArray(academicPdfs) || academicPdfs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No academic PDFs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Semester</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(academicPdfs) && academicPdfs.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`border-b border-gray-200 hover:bg-gray-50 ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">{item.title}</td>
                      <td className="px-6 py-4 text-sm">{item.semester || '-'}</td>
                      <td className="px-6 py-4 text-sm">{item.subject || '-'}</td>
                      <td className="px-6 py-4 text-sm">{item.category || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      }

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)' }}>
            <h2 className="text-2xl font-bold text-charcoal mb-4">
              {editingItem ? 'Edit PDF' : 'Upload Academic PDF'}
            </h2>
            <form onSubmit={handlePdfSubmit} className="space-y-4">
              <>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="modern-input w-full rounded-xl py-3 px-4"
                      placeholder="e.g., Data Structures Notes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="modern-input w-full rounded-xl py-3 px-4"
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Semester</label>
                      <input
                        type="text"
                        value={formData.semester || ''}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="modern-input w-full rounded-xl py-3 px-4"
                        placeholder="e.g., Semester 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Subject</label>
                      <input
                        type="text"
                        value={formData.subject || ''}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="modern-input w-full rounded-xl py-3 px-4"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="modern-input w-full rounded-xl py-3 px-4"
                    >
                      <option value="">Select category</option>
                      <option value="Notes">Notes</option>
                      <option value="Syllabus">Syllabus</option>
                      <option value="Question Paper">Question Paper</option>
                      <option value="Study Material">Study Material</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">PDF File *</label>
                    {formData.fileUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="material-symbols-outlined text-blue-600">description</span>
                        <a
                          href={formData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex-1"
                        >
                          {formData.fileUrl.split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fileUrl: '' })}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfUpload}
                          disabled={uploadingPdf}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-4xl text-gray-400">
                            {uploadingPdf ? 'hourglass_empty' : 'upload_file'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {uploadingPdf ? 'Uploading...' : 'Click to upload PDF'}
                          </span>
                          <span className="text-xs text-gray-400">Max 50MB (PDF only)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
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
                  {editingItem ? 'Update' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



