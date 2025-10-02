'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Download,
  UserPlus,
  Bell } from 'lucide-react';

interface AuditRun {
  id: string;
  name: string;
  description: string;
  status: string;
  auditType: string;
  startDate: string;
  endDate: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  framework: {
    id: string;
    name: string;
    type: string;
  } | null;
  _count: {
    auditControls: number;
    auditFindings: number;
    tasks: number;
  };
}

export default function AuditAutomationPage() {
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAuditRuns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId: 'org-123', // Mock organization ID
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        params.append('auditType', typeFilter);
      }

      const response = await fetch(`/api/admin/audit-runs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditRuns(data.auditRuns || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching audit runs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter]);

  useEffect(() => {
    fetchAuditRuns();
  }, [fetchAuditRuns]);

  const filteredAuditRuns = auditRuns.filter(auditRun => {
    const matchesSearch = auditRun.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auditRun.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'FINDINGS_RESOLUTION': return 'bg-orange-100 text-orange-800';
      case 'LOCKED': return 'bg-green-100 text-green-800';
      case 'ARCHIVED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'INTERNAL': return 'bg-blue-100 text-blue-800';
      case 'EXTERNAL': return 'bg-green-100 text-green-800';
      case 'SELF_ASSESSMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="h-4 w-4 text-gray-600" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'REVIEW': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'FINDINGS_RESOLUTION': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'LOCKED': return <Lock className="h-4 w-4 text-green-600" />;
      case 'ARCHIVED': return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const isOverdue = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Automation</h1>
            <p className="text-gray-600">Manage compliance audits and automated workflows</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <a href="/dashboard/audit/packages">
                <Download className="h-4 w-4" />
                Audit Packages
              </a>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <a href="/dashboard/audit/analytics">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </a>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <a href="/dashboard/audit/guest-auditors">
                <UserPlus className="h-4 w-4" />
                Guest Auditors
              </a>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <a href="/dashboard/audit/notifications">
                <Bell className="h-4 w-4" />
                Notifications
              </a>
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Audit Run
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Audits</p>
                <p className="text-2xl font-bold text-gray-900">{auditRuns.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {auditRuns.filter(a => a.status === 'LOCKED').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {auditRuns.filter(a => a.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {auditRuns.filter(a => isOverdue(a.endDate) && a.status !== 'LOCKED').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search audit runs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="FINDINGS_RESOLUTION">Findings Resolution</SelectItem>
                <SelectItem value="LOCKED">Locked</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
                <SelectItem value="EXTERNAL">External</SelectItem>
                <SelectItem value="SELF_ASSESSMENT">Self Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Audit Runs Table */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Audit Runs</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit Run</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading audit runs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAuditRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No audit runs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAuditRuns.map((auditRun) => (
                    <TableRow key={auditRun.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{auditRun.name}</div>
                          <div className="text-sm text-gray-500">{auditRun.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {auditRun.framework ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{auditRun.framework.name}</div>
                            <div className="text-gray-500">{auditRun.framework.type}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No framework</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(auditRun.status)}
                          <Badge className={getStatusBadgeColor(auditRun.status)}>
                            {auditRun.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(auditRun.auditType)}>
                          {auditRun.auditType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{auditRun.creator.name}</div>
                          <div className="text-gray-500">{auditRun.creator.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {new Date(auditRun.startDate).toLocaleDateString()}
                          </div>
                          <div className={`text-sm ${
                            isOverdue(auditRun.endDate) ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            Due: {new Date(auditRun.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {auditRun._count.auditControls} controls
                          </div>
                          <div className="text-gray-500">
                            {auditRun._count.auditFindings} findings
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PlatformAdminLayout>
  );
}