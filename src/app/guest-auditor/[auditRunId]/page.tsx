'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, 
  Download, 
  MessageSquare, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  User,
  Building,
  Calendar } from 'lucide-react';

interface GuestAuditorData {
  id: string;
  email: string;
  name: string;
  role: string;
  accessLevel: string;
  auditRun: {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    organization: {
      name: string;
    };
    framework: {
      name: string;
    } | null;
  };
}

interface AuditControl {
  id: string;
  status: string;
  control: {
    id: string;
    name: string;
    description: string;
    category: {
      name: string;
    };
  };
  reviewer: {
    name: string;
  } | null;
  notes: string | null;
  submittedAt: string | null;
}

interface AuditFinding {
  id: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  control: {
    name: string;
  } | null;
  createdAt: string;
}

export default function GuestAuditorPortal({ params }: { params: Promise<{ auditRunId: string }> }) {
  const [guestData, setGuestData] = useState<GuestAuditorData | null>(null);
  const [auditControls, setAuditControls] = useState<AuditControl[]>([]);
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [auditRunId, setAuditRunId] = useState<string>('');

  useEffect(() => {
    // Resolve the params promise
    params.then((resolvedParams) => {
      setAuditRunId(resolvedParams.auditRunId);
    });
  }, [params]);

  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would use the guest auditor's session token
      // For now, we'll simulate the data
      const mockData = {
        guestAuditor: {
          id: 'guest-123',
          email: 'auditor@external.com',
          name: 'John Auditor',
          role: 'External Auditor',
          accessLevel: 'READ_ONLY',
          auditRun: {
            id: auditRunId,
            name: 'Q1 2024 Internal Compliance Audit',
            description: 'Quarterly internal compliance audit covering SOC 2 controls',
            status: 'IN_PROGRESS',
            startDate: '2024-01-01',
            endDate: '2024-03-31',
            organization: { name: 'Acme Corporation' },
            framework: { name: 'SOC 2 Type II' }
          }
        },
        auditControls: [
          {
            id: 'ac-1',
            status: 'COMPLIANT',
            control: {
              id: 'c-1',
              name: 'Access Control Management',
              description: 'Controls for managing user access to systems',
              category: { name: 'Access Control' }
            },
            reviewer: { name: 'Jane Smith' },
            notes: 'Access controls are properly implemented',
            submittedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: 'ac-2',
            status: 'NON_COMPLIANT',
            control: {
              id: 'c-2',
              name: 'Data Encryption',
              description: 'Encryption of sensitive data at rest and in transit',
              category: { name: 'Data Protection' }
            },
            reviewer: { name: 'Bob Johnson' },
            notes: 'Encryption not implemented for legacy systems',
            submittedAt: '2024-01-16T14:20:00Z'
          }
        ],
        auditFindings: [
          {
            id: 'af-1',
            severity: 'HIGH',
            title: 'Missing Encryption on Legacy Systems',
            description: 'Legacy systems storing sensitive data lack encryption',
            status: 'OPEN',
            control: { name: 'Data Encryption' },
            createdAt: '2024-01-16T14:20:00Z'
          },
          {
            id: 'af-2',
            severity: 'MEDIUM',
            title: 'Incomplete Access Reviews',
            description: 'Quarterly access reviews not completed for all systems',
            status: 'IN_PROGRESS',
            control: { name: 'Access Control Management' },
            createdAt: '2024-01-15T10:30:00Z'
          }
        ]
      };

      setGuestData(mockData.guestAuditor);
      setAuditControls(mockData.auditControls);
      setAuditFindings(mockData.auditFindings);
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  }, [auditRunId]);

  useEffect(() => {
    if (auditRunId) {
      fetchAuditData();
    }
  }, [auditRunId, fetchAuditData]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'bg-green-100 text-green-800';
      case 'NON_COMPLIANT': return 'bg-red-100 text-red-800';
      case 'GAP': return 'bg-yellow-100 text-yellow-800';
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'MITIGATED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit data...</p>
        </div>
      </div>
    );
  }

  if (!guestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this audit.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Guest Auditor Portal</h1>
                  <p className="text-sm text-gray-500">{guestData.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-blue-100 text-blue-800">
                {guestData.accessLevel.replace('_', ' ')}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Audit Overview */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{guestData.auditRun.name}</h2>
              <p className="text-gray-600 mt-1">{guestData.auditRun.description}</p>
            </div>
            <Badge className={getStatusBadgeColor(guestData.auditRun.status)}>
              {guestData.auditRun.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-medium">{guestData.auditRun.organization.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Framework</p>
                <p className="font-medium">{guestData.auditRun.framework?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(guestData.auditRun.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{new Date(guestData.auditRun.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'controls', name: 'Controls', icon: CheckCircle },
              { id: 'findings', name: 'Findings', icon: AlertTriangle },
              { id: 'evidence', name: 'Evidence', icon: FileText },
              { id: 'comments', name: 'Comments', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Control Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Controls</span>
                  <span className="font-medium">{auditControls.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compliant</span>
                  <span className="font-medium text-green-600">
                    {auditControls.filter(c => c.status === 'COMPLIANT').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Non-Compliant</span>
                  <span className="font-medium text-red-600">
                    {auditControls.filter(c => c.status === 'NON_COMPLIANT').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gaps</span>
                  <span className="font-medium text-yellow-600">
                    {auditControls.filter(c => c.status === 'GAP').length}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Findings Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Findings</span>
                  <span className="font-medium">{auditFindings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical</span>
                  <span className="font-medium text-red-600">
                    {auditFindings.filter(f => f.severity === 'CRITICAL').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">High</span>
                  <span className="font-medium text-orange-600">
                    {auditFindings.filter(f => f.severity === 'HIGH').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Open</span>
                  <span className="font-medium text-red-600">
                    {auditFindings.filter(f => f.status === 'OPEN').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'controls' && (
          <Card>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Audit Controls</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Control</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditControls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{control.control.name}</div>
                          <div className="text-sm text-gray-500">{control.control.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{control.control.category.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(control.status)}>
                          {control.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{control.reviewer?.name || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{control.notes || 'N/A'}</TableCell>
                      <TableCell>
                        {control.submittedAt ? new Date(control.submittedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {activeTab === 'findings' && (
          <Card>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Audit Findings</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Finding</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Control</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditFindings.map((finding) => (
                    <TableRow key={finding.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{finding.title}</div>
                          <div className="text-sm text-gray-500">{finding.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityBadgeColor(finding.severity)}>
                          {finding.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(finding.status)}>
                          {finding.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{finding.control?.name || 'N/A'}</TableCell>
                      <TableCell>{new Date(finding.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {activeTab === 'evidence' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Evidence Repository</h3>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Evidence access is restricted based on your permission level.</p>
              <p className="text-sm mt-2">Contact the audit team for specific evidence requests.</p>
            </div>
          </Card>
        )}

        {activeTab === 'comments' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Audit Comments</h3>
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Comment system is not available in read-only mode.</p>
              <p className="text-sm mt-2">Contact the audit team directly for questions or clarifications.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
