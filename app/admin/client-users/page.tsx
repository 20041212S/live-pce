'use client';

import { useState, useEffect } from 'react';

type UserType = 'all' | 'student' | 'guest' | 'parent';

interface ClientUser {
  id: string;
  mobile: string;
  email: string;
  userType: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function ClientUsersPage() {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<UserType>('all');
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch users based on filter
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const url = filter === 'all' 
          ? '/api/admin/client-users'
          : `/api/admin/client-users?userType=${filter}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filter]);

  // Download CSV
  const handleDownloadCSV = async () => {
    try {
      const url = filter === 'all'
        ? '/api/admin/client-users/download'
        : `/api/admin/client-users/download?userType=${filter}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download CSV');

      const blob = await response.blob();
      const csvUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = csvUrl;
      a.download = `client-users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(csvUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(users.map(user => user.id)));
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
      alert('Please select at least one user to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} user(s)? This action cannot be undone.`)) return;

    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/admin/client-users/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));

      if (failed.length > 0) {
        alert(`Failed to delete ${failed.length} user(s). Please try again.`);
      } else {
        alert(`Successfully deleted ${selectedItems.size} user(s)`);
      }

      setSelectedItems(new Set());
      // Refresh the user list
      const url = filter === 'all' 
        ? '/api/admin/client-users'
        : `/api/admin/client-users?userType=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error: any) {
      console.error('Failed to delete users:', error);
      alert(error?.message || 'Failed to delete users');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      setError('');
      
      const response = await fetch(`/api/admin/client-users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete user' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Remove user from list
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      // Close detail drawer if it was open for this user
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registered Clients</h1>
          <p className="text-gray-600 mt-2">Manage and view all client user registrations</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'student', 'guest', 'parent'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilter(type);
                    setSelectedUser(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === type
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All Users' : type.charAt(0).toUpperCase() + type.slice(1)}
                  {users.length > 0 && filter === type && ` (${users.length})`}
                </button>
              ))}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadCSV}
              disabled={loading || users.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-all"
            >
              📥 Download CSV
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No users found for this filter</p>
            </div>
          ) : (
            <>
              {selectedItems.size > 0 && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedItems.size} user(s) selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-12">
                        <input
                          type="checkbox"
                          checked={users.length > 0 && selectedItems.size === users.length}
                          ref={(input) => {
                            if (input) input.indeterminate = selectedItems.size > 0 && selectedItems.size < users.length;
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mobile</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verified</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Registered</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${selectedItems.has(user.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(user.id)}
                            onChange={() => handleSelectItem(user.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.mobile}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.userType === 'student' ? 'bg-blue-100 text-blue-800' :
                          user.userType === 'guest' ? 'bg-yellow-100 text-yellow-800' :
                          user.userType === 'parent' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.emailVerified ? '✓ YES' : '✗ NO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}

          {/* Stats Footer */}
          {users.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
              {filter !== 'all' && ` (${filter})`}
            </div>
          )}
        </div>

        {/* Detail Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl animate-slide-up">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-600 hover:text-gray-900 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Type Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">User Type</label>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${
                    selectedUser.userType === 'student' ? 'bg-blue-100 text-blue-800' :
                    selectedUser.userType === 'guest' ? 'bg-yellow-100 text-yellow-800' :
                    selectedUser.userType === 'parent' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.userType.charAt(0).toUpperCase() + selectedUser.userType.slice(1)}
                  </span>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Mobile Number</label>
                  <p className="text-lg text-gray-900 font-mono">{selectedUser.mobile}</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                  <p className="text-lg text-gray-900 break-all">{selectedUser.email}</p>
                </div>

                {/* Verified Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Email Verified</label>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${
                    selectedUser.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.emailVerified ? '✓ YES' : '✗ NO'}
                  </span>
                </div>

                {/* Registration Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Registered On</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>

                {/* ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">User ID</label>
                  <p className="text-sm text-gray-700 font-mono break-all bg-gray-100 p-3 rounded">
                    {selectedUser.id}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full mt-8 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
