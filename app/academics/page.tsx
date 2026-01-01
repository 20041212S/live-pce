'use client';

import { useState, useEffect } from 'react';

interface AcademicPdf {
  id: string;
  title: string;
  description: string | null;
  semester: string | null;
  subject: string | null;
  category: string | null;
  fileUrl: string;
  createdAt: string;
}

export default function StudentAcademicsPage() {
  const [searchFilters, setSearchFilters] = useState({
    semester: '',
    subject: '',
    category: '',
    keyword: '',
  });
  const [pdfs, setPdfs] = useState<AcademicPdf[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    // Check if at least one filter is provided
    if (!searchFilters.semester && !searchFilters.subject && !searchFilters.category && !searchFilters.keyword) {
      alert('Please provide at least one search criteria');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (searchFilters.semester) params.append('semester', searchFilters.semester);
      if (searchFilters.subject) params.append('subject', searchFilters.subject);
      if (searchFilters.category) params.append('category', searchFilters.category);
      if (searchFilters.keyword) params.append('keyword', searchFilters.keyword);

      const res = await fetch(`/api/academics/search?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to search PDFs');
      }

      const data = await res.json();
      setPdfs(data || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search PDFs');
      setPdfs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchFilters({
      semester: '',
      subject: '',
      category: '',
      keyword: '',
    });
    setPdfs([]);
    setHasSearched(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-2">Academics</h1>
        <p className="text-gray-600">Search and access academic materials</p>
      </div>

      {/* Search Section */}
      <div className="glass-card rounded-2xl p-6" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}>
        <h2 className="text-xl font-bold text-charcoal mb-4">What are you looking for?</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Keyword Search</label>
            <input
              type="text"
              value={searchFilters.keyword}
              onChange={(e) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
              className="modern-input w-full rounded-xl py-3 px-4"
              placeholder="Search by title, description, or subject..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Semester</label>
              <input
                type="text"
                value={searchFilters.semester}
                onChange={(e) => setSearchFilters({ ...searchFilters, semester: e.target.value })}
                className="modern-input w-full rounded-xl py-3 px-4"
                placeholder="e.g., Semester 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Subject</label>
              <input
                type="text"
                value={searchFilters.subject}
                onChange={(e) => setSearchFilters({ ...searchFilters, subject: e.target.value })}
                className="modern-input w-full rounded-xl py-3 px-4"
                placeholder="e.g., Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
              <select
                value={searchFilters.category}
                onChange={(e) => setSearchFilters({ ...searchFilters, category: e.target.value })}
                className="modern-input w-full rounded-xl py-3 px-4"
              >
                <option value="">All Categories</option>
                <option value="Notes">Notes</option>
                <option value="Syllabus">Syllabus</option>
                <option value="Question Paper">Question Paper</option>
                <option value="Study Material">Study Material</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 rounded-xl text-white font-semibold hover-lift transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {(hasSearched || pdfs.length > 0) && (
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl text-charcoal font-semibold hover-lift transition-all"
                style={{ background: 'rgba(255, 255, 255, 0.5)' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="glass-card rounded-2xl overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}>
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Searching...</p>
            </div>
          ) : pdfs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No results found. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Semester</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfs.map((pdf) => (
                    <tr key={pdf.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{pdf.title}</td>
                      <td className="px-6 py-4 text-sm">{pdf.semester || '-'}</td>
                      <td className="px-6 py-4 text-sm">{pdf.subject || '-'}</td>
                      <td className="px-6 py-4 text-sm">{pdf.category || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {pdf.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={pdf.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Initial State - No Search Yet */}
      {!hasSearched && (
        <div className="glass-card rounded-2xl p-12 text-center" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)' }}>
          <p className="text-gray-600">Use the search filters above to find academic materials.</p>
        </div>
      )}
    </div>
  );
}

