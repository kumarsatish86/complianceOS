'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Calendar,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  BarChart3,
  BookOpen } from 'lucide-react';

interface QuestionnaireSummary {
  id: string;
  title: string;
  description?: string;
  clientName?: string;
  status: string;
  priority: number;
  dueDate?: string;
  totalQuestions: number;
  completedQuestions: number;
  completionPercentage: number;
  assignedTo?: string;
  assignedToName?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    clientName: '',
    dueDate: '',
    priority: 5
  });
  const [filters, setFilters] = useState({
    status: 'all',
    assignedTo: 'all',
    search: ''
  });

  const fetchQuestionnaires = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.assignedTo !== 'all') params.append('assignedTo', filters.assignedTo);
      
      const response = await fetch(`/api/admin/questionnaires?${params}`);
      const data = await response.json();
      setQuestionnaires(data.questionnaires || []);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.assignedTo]);

  useEffect(() => {
    fetchQuestionnaires();
  }, [filters, fetchQuestionnaires]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('clientName', uploadForm.clientName);
      formData.append('dueDate', uploadForm.dueDate);
      formData.append('priority', uploadForm.priority.toString());

      const response = await fetch('/api/admin/questionnaires', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadForm({ file: null, clientName: '', dueDate: '', priority: 5 });
        fetchQuestionnaires();
      }
    } catch (error) {
      console.error('Error uploading questionnaire:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED': return 'bg-blue-100 text-blue-800';
      case 'PARSING': return 'bg-yellow-100 text-yellow-800';
      case 'PARSED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'UNDER_REVIEW': return 'bg-orange-100 text-orange-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'EXPORTED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'text-red-600';
    if (priority <= 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredQuestionnaires = questionnaires.filter(q => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        q.title.toLowerCase().includes(searchLower) ||
        q.clientName?.toLowerCase().includes(searchLower) ||
        q.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Questionnaires</h1>
            <p className="text-gray-600 mt-2">
              Manage security questionnaires and automate responses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('/dashboard/questionnaires/analytics', '_blank')}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => window.open('/dashboard/questionnaires/answer-library', '_blank')}>
              <BookOpen className="h-4 w-4" />
              Answer Library
            </Button>
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="h-4 w-4" />
              Upload Questionnaire
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{questionnaires.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {questionnaires.filter(q => q.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {questionnaires.filter(q => q.status === 'UNDER_REVIEW').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {questionnaires.filter(q => q.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questionnaires..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="UPLOADED">Uploaded</option>
                <option value="PARSING">Parsing</option>
                <option value="PARSED">Parsed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="EXPORTED">Exported</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Questionnaires List */}
        <Card className="p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading questionnaires...</p>
              </div>
            ) : filteredQuestionnaires.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questionnaires found</p>
              </div>
            ) : (
              filteredQuestionnaires.map((questionnaire) => (
                <div
                  key={questionnaire.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {questionnaire.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(questionnaire.status)}`}>
                          {questionnaire.status.replace('_', ' ')}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(questionnaire.priority)}`}>
                          Priority {questionnaire.priority}
                        </span>
                      </div>
                      
                      {questionnaire.description && (
                        <p className="text-gray-600 mb-2">{questionnaire.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        {questionnaire.clientName && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {questionnaire.clientName}
                          </div>
                        )}
                        {questionnaire.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(questionnaire.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {questionnaire.completedQuestions}/{questionnaire.totalQuestions} questions
                        </div>
                        {questionnaire.assignedToName && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Assigned to: {questionnaire.assignedToName}
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(questionnaire.completionPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${questionnaire.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/dashboard/questionnaires/${questionnaire.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/dashboard/questionnaires/${questionnaire.id}/edit`, '_blank')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Export functionality
                          console.log('Export questionnaire:', questionnaire.id);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Questionnaire</h2>
              <form onSubmit={handleFileUpload}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">Document File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientName">Client Name (Optional)</Label>
                    <Input
                      id="clientName"
                      value={uploadForm.clientName}
                      onChange={(e) => setUploadForm({ ...uploadForm, clientName: e.target.value })}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date (Optional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={uploadForm.dueDate}
                      onChange={(e) => setUploadForm({ ...uploadForm, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority (1-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="10"
                      value={uploadForm.priority}
                      onChange={(e) => setUploadForm({ ...uploadForm, priority: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!uploadForm.file}>
                    Upload
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
