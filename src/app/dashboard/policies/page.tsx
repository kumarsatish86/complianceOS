'use client';

import { useState, useEffect } from 'react';
import { Eye, Edit, Download, BarChart3, FileText, CheckCircle, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface Policy {
  id: string;
  title: string;
  description?: string;
  category: string;
  policyType: string;
  version: string;
  status: string;
  owner: {
    name: string;
    email: string;
  };
  reviewer?: {
    name: string;
    email: string;
  };
  approver?: {
    name: string;
    email: string;
  };
  publishedAt?: string;
  effectiveDate?: string;
  nextReviewDate?: string;
  _count: {
    acknowledgments: number;
    assignments: number;
    versions: number;
  };
  createdAt: string;
}

interface PolicyAnalytics {
  totalPolicies: number;
  publishedPolicies: number;
  draftPolicies: number;
  archivedPolicies: number;
  totalAcknowledgments: number;
  pendingAcknowledgments: number;
  acknowledgedPolicies: number;
  overdueAcknowledgments: number;
  complianceRate: number;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [analytics, setAnalytics] = useState<PolicyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('all');

  useEffect(() => {
    fetchPolicies();
    fetchAnalytics();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/policies?organizationId=org-123');
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/policies/analytics?organizationId=org-123');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
      APPROVED: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      PUBLISHED: { color: 'bg-green-100 text-green-800', label: 'Published' },
      ARCHIVED: { color: 'bg-red-100 text-red-800', label: 'Archived' },
      SUPERSEDED: { color: 'bg-purple-100 text-purple-800', label: 'Superseded' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || policy.category === categoryFilter;
    const matchesPolicyType = policyTypeFilter === 'all' || policy.policyType === policyTypeFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPolicyType;
  });

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Policy Management</h1>
            <p className="text-gray-600 mt-2">
              Manage organizational policies, versions, and employee acknowledgments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('/dashboard/policies/analytics', '_blank')}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button onClick={() => {/* TODO: Implement create policy modal */}}>
              <Plus className="h-4 w-4" />
              Create Policy
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Policies</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalPolicies}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.publishedPolicies}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.complianceRate}%</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overdueAcknowledgments}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="GOVERNANCE">Governance</SelectItem>
                  <SelectItem value="OPERATIONAL">Operational</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="LEGAL">Legal</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Policy Type</label>
              <Select value={policyTypeFilter} onValueChange={setPolicyTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INFORMATION_SECURITY">Information Security</SelectItem>
                  <SelectItem value="DATA_PROTECTION">Data Protection</SelectItem>
                  <SelectItem value="ACCESS_CONTROL">Access Control</SelectItem>
                  <SelectItem value="INCIDENT_RESPONSE">Incident Response</SelectItem>
                  <SelectItem value="BUSINESS_CONTINUITY">Business Continuity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Policies Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Policies ({filteredPolicies.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading policies...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Acknowledgments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{policy.title}</div>
                          {policy.description && (
                            <div className="text-sm text-gray-500 mt-1">{policy.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.policyType}</Badge>
                      </TableCell>
                      <TableCell>{policy.version}</TableCell>
                      <TableCell>{getStatusBadge(policy.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{policy.owner.name}</div>
                          <div className="text-sm text-gray-500">{policy.owner.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{policy._count.acknowledgments}</div>
                          <div className="text-sm text-gray-500">total</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/policies/${policy.id}`, '_blank')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/policies/${policy.id}/edit`, '_blank')}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/policies/${policy.id}/export`, '_blank')}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
