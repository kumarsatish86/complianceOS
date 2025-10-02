'use client';

import { useState, useEffect } from 'react';
import { Eye, Edit, Download, BarChart3, AlertTriangle, Shield, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface Risk {
  id: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  likelihoodInherent: string;
  impactInherent: string;
  severityInherent: string;
  likelihoodResidual?: string;
  impactResidual?: string;
  severityResidual?: string;
  status: string;
  businessUnit?: string;
  owner: {
    name: string;
    email: string;
  };
  _count: {
    assessments: number;
    treatments: number;
    controlMappings: number;
    policyMappings: number;
  };
  createdAt: string;
}

interface RiskAnalytics {
  totalRisks: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  statusDistribution: {
    identified: number;
    assessed: number;
    treatmentPlanned: number;
    treatmentImplemented: number;
    monitored: number;
    closed: number;
    reopened: number;
  };
  treatmentDistribution: {
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
  };
}

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [analytics, setAnalytics] = useState<RiskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [businessUnitFilter, setBusinessUnitFilter] = useState('all');

  useEffect(() => {
    fetchRisks();
    fetchAnalytics();
  }, []);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/risks?organizationId=org-123');
      const data = await response.json();
      setRisks(data.risks || []);
    } catch (error) {
      console.error('Error fetching risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/risks/analytics?organizationId=org-123');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      VERY_LOW: { color: 'bg-gray-100 text-gray-800', label: 'Very Low' },
      LOW: { color: 'bg-green-100 text-green-800', label: 'Low' },
      MEDIUM: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      HIGH: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      VERY_HIGH: { color: 'bg-red-100 text-red-800', label: 'Very High' },
      CRITICAL: { color: 'bg-red-200 text-red-900', label: 'Critical' }
    };
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.MEDIUM;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      IDENTIFIED: { color: 'bg-blue-100 text-blue-800', label: 'Identified' },
      ASSESSED: { color: 'bg-purple-100 text-purple-800', label: 'Assessed' },
      TREATMENT_PLANNED: { color: 'bg-yellow-100 text-yellow-800', label: 'Treatment Planned' },
      TREATMENT_IMPLEMENTED: { color: 'bg-green-100 text-green-800', label: 'Treatment Implemented' },
      MONITORED: { color: 'bg-indigo-100 text-indigo-800', label: 'Monitored' },
      CLOSED: { color: 'bg-gray-100 text-gray-800', label: 'Closed' },
      REOPENED: { color: 'bg-red-100 text-red-800', label: 'Reopened' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.IDENTIFIED;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || risk.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || risk.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || risk.severityInherent === severityFilter;
    const matchesBusinessUnit = businessUnitFilter === 'all' || risk.businessUnit === businessUnitFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesSeverity && matchesBusinessUnit;
  });

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Risk Management</h1>
            <p className="text-gray-600 mt-2">
              Identify, assess, and manage organizational risks with comprehensive treatment planning
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('/dashboard/risks/analytics', '_blank')}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button onClick={() => {/* TODO: Implement create risk modal */}}>
              <Plus className="h-4 w-4" />
              Create Risk
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Risks</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalRisks}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Risks</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.riskDistribution.critical}</p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Risks</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.riskDistribution.high}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Treatments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.treatmentDistribution.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Risk Distribution Chart */}
        {analytics && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution by Severity</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analytics.riskDistribution.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analytics.riskDistribution.high}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{analytics.riskDistribution.medium}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.riskDistribution.low}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Input
                placeholder="Search risks..."
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
                  <SelectItem value="IDENTIFIED">Identified</SelectItem>
                  <SelectItem value="ASSESSED">Assessed</SelectItem>
                  <SelectItem value="TREATMENT_PLANNED">Treatment Planned</SelectItem>
                  <SelectItem value="TREATMENT_IMPLEMENTED">Treatment Implemented</SelectItem>
                  <SelectItem value="MONITORED">Monitored</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
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
                  <SelectItem value="STRATEGIC">Strategic</SelectItem>
                  <SelectItem value="OPERATIONAL">Operational</SelectItem>
                  <SelectItem value="FINANCIAL">Financial</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Unit</label>
              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Risks Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Risks ({filteredRisks.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading risks...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Treatments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRisks.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{risk.title}</div>
                          {risk.description && (
                            <div className="text-sm text-gray-500 mt-1">{risk.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{risk.category}</Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(risk.severityInherent)}</TableCell>
                      <TableCell>{getStatusBadge(risk.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{risk.owner.name}</div>
                          <div className="text-sm text-gray-500">{risk.owner.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {risk.businessUnit ? (
                          <Badge variant="outline">{risk.businessUnit}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{risk._count.treatments}</div>
                          <div className="text-sm text-gray-500">total</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/risks/${risk.id}`, '_blank')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/risks/${risk.id}/edit`, '_blank')}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/risks/${risk.id}/export`, '_blank')}>
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
