'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  Users,
  FileText,
  Lightbulb, } from 'lucide-react';

interface AnswerLibraryEntry {
  id: string;
  category: string;
  subcategory?: string;
  keyPhrases: string[];
  standardAnswer: string;
  evidenceReferences: string[];
  usageCount: number;
  confidenceScore: number;
  lastUsedAt?: string;
  lastUpdated: string;
  createdBy: string;
  createdByName?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

interface AnswerLibraryStats {
  totalEntries: number;
  activeEntries: number;
  totalUsage: number;
  averageConfidence: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    usage: number;
  }>;
  topUsedEntries: AnswerLibraryEntry[];
  recentlyUpdated: AnswerLibraryEntry[];
}

export default function AnswerLibraryPage() {
  const [entries, setEntries] = useState<AnswerLibraryEntry[]>([]);
  const [stats, setStats] = useState<AnswerLibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    active: 'all'
  });
  const [newEntry, setNewEntry] = useState({
    category: '',
    subcategory: '',
    keyPhrases: '',
    standardAnswer: '',
    evidenceReferences: ''
  });
  const [importData, setImportData] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch entries
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      
      const entriesResponse = await fetch(`/api/admin/answer-library?${params}`);
      const entriesData = await entriesResponse.json();
      setEntries(entriesData.entries || []);

      // Fetch stats
      const statsResponse = await fetch('/api/admin/answer-library/stats');
      const statsData = await statsResponse.json();
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [filters, fetchData]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/answer-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          category: newEntry.category,
          subcategory: newEntry.subcategory || undefined,
          keyPhrases: newEntry.keyPhrases.split(',').map(phrase => phrase.trim()).filter(phrase => phrase.length > 0),
          standardAnswer: newEntry.standardAnswer,
          evidenceReferences: newEntry.evidenceReferences.split(',').map(ref => ref.trim()).filter(ref => ref.length > 0)
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewEntry({ category: '', subcategory: '', keyPhrases: '', standardAnswer: '', evidenceReferences: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/answer-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          csvData: importData
        })
      });

      if (response.ok) {
        setShowImportModal(false);
        setImportData('');
        fetchData();
      }
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/answer-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' })
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'answer-library-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const response = await fetch(`/api/admin/answer-library/${entryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'ACCESS_CONTROL': 'bg-blue-100 text-blue-800',
      'DATA_PROTECTION': 'bg-green-100 text-green-800',
      'INCIDENT_RESPONSE': 'bg-red-100 text-red-800',
      'NETWORK_SECURITY': 'bg-purple-100 text-purple-800',
      'PHYSICAL_SECURITY': 'bg-yellow-100 text-yellow-800',
      'BUSINESS_CONTINUITY': 'bg-indigo-100 text-indigo-800',
      'VENDOR_MANAGEMENT': 'bg-pink-100 text-pink-800',
      'COMPLIANCE_FRAMEWORK': 'bg-gray-100 text-gray-800',
      'GENERAL_SECURITY': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredEntries = entries.filter(entry => {
    if (filters.active !== 'all') {
      const isActive = filters.active === 'active';
      if (entry.isActive !== isActive) return false;
    }
    return true;
  });

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Answer Library</h1>
            <p className="text-gray-600 mt-2">
              Manage standardized answers for security questionnaires
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsage}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeEntries}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <Lightbulb className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageConfidence)}%</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entries..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="ACCESS_CONTROL">Access Control</option>
                <option value="DATA_PROTECTION">Data Protection</option>
                <option value="INCIDENT_RESPONSE">Incident Response</option>
                <option value="NETWORK_SECURITY">Network Security</option>
                <option value="PHYSICAL_SECURITY">Physical Security</option>
                <option value="BUSINESS_CONTINUITY">Business Continuity</option>
                <option value="VENDOR_MANAGEMENT">Vendor Management</option>
                <option value="COMPLIANCE_FRAMEWORK">Compliance Framework</option>
                <option value="GENERAL_SECURITY">General Security</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filters.active}
                onChange={(e) => setFilters({ ...filters, active: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Entries</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Entries List */}
        <Card className="p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading entries...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No entries found</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}>
                          {entry.category.replace('_', ' ')}
                        </span>
                        {entry.subcategory && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {entry.subcategory}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {entry.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {entry.standardAnswer.substring(0, 100)}
                        {entry.standardAnswer.length > 100 && '...'}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.keyPhrases.slice(0, 5).map((phrase, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {phrase}
                          </span>
                        ))}
                        {entry.keyPhrases.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{entry.keyPhrases.length - 5} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Used {entry.usageCount} times
                        </div>
                        <div className="flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                          {entry.confidenceScore}% confidence
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {entry.createdByName}
                        </div>
                        {entry.lastUsedAt && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Last used: {new Date(entry.lastUsedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // View entry details
                          console.log('View entry:', entry.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Edit entry
                          console.log('Edit entry:', entry.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Create Entry Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Create Answer Library Entry</h2>
              <form onSubmit={handleCreateEntry}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={newEntry.category}
                      onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="ACCESS_CONTROL">Access Control</option>
                      <option value="DATA_PROTECTION">Data Protection</option>
                      <option value="INCIDENT_RESPONSE">Incident Response</option>
                      <option value="NETWORK_SECURITY">Network Security</option>
                      <option value="PHYSICAL_SECURITY">Physical Security</option>
                      <option value="BUSINESS_CONTINUITY">Business Continuity</option>
                      <option value="VENDOR_MANAGEMENT">Vendor Management</option>
                      <option value="COMPLIANCE_FRAMEWORK">Compliance Framework</option>
                      <option value="GENERAL_SECURITY">General Security</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                    <Input
                      id="subcategory"
                      value={newEntry.subcategory}
                      onChange={(e) => setNewEntry({ ...newEntry, subcategory: e.target.value })}
                      placeholder="Enter subcategory"
                    />
                  </div>
                  <div>
                    <Label htmlFor="keyPhrases">Key Phrases (comma-separated)</Label>
                    <Input
                      id="keyPhrases"
                      value={newEntry.keyPhrases}
                      onChange={(e) => setNewEntry({ ...newEntry, keyPhrases: e.target.value })}
                      placeholder="security, access control, authentication"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="standardAnswer">Standard Answer</Label>
                    <textarea
                      id="standardAnswer"
                      value={newEntry.standardAnswer}
                      onChange={(e) => setNewEntry({ ...newEntry, standardAnswer: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Enter the standard answer text..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="evidenceReferences">Evidence References (comma-separated)</Label>
                    <Input
                      id="evidenceReferences"
                      value={newEntry.evidenceReferences}
                      onChange={(e) => setNewEntry({ ...newEntry, evidenceReferences: e.target.value })}
                      placeholder="evidence-1, evidence-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Entry
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">Import Answer Library</h2>
              <form onSubmit={handleImport}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csvData">CSV Data</Label>
                    <textarea
                      id="csvData"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={10}
                      placeholder="Paste CSV data here..."
                      required
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>CSV format should include columns:</p>
                    <p>Category, Subcategory, Key Phrases, Standard Answer, Evidence References</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Import
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </PlatformAdminLayout>
  );
}
