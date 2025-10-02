'use client';

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Download, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Building,
  Users,
  Key,
  Calendar,
  Eye } from 'lucide-react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface ReportData {
  reportType: string;
  generatedAt: string;
  organizationId: string;
  data: Record<string, unknown>;
}

interface ComplianceSummary {
  organizationId: string;
  generatedAt: string;
  complianceScore: number;
  assetCompliance: {
    totalAssets: number;
    byStatus: Record<string, number>;
  };
  vendorCompliance: {
    totalVendors: number;
    byRiskLevel: Record<string, number>;
  };
  licenseCompliance: {
    totalLicenses: number;
    compliantLicenses: number;
    expiringSoon: number;
  };
  accessCompliance: {
    totalAccess: number;
    byStatus: Record<string, number>;
  };
}

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState('compliance-summary');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  // Mock organization ID - in real app, get from context/auth
  const organizationId = 'org-123';

  const reportTypes = [
    { value: 'compliance-summary', label: 'Compliance Summary', icon: Shield },
    { value: 'inventory', label: 'Asset Inventory', icon: Building },
    { value: 'warranty', label: 'Warranty Expiry', icon: Calendar },
    { value: 'assignment', label: 'Asset Assignment', icon: Users },
    { value: 'disposal', label: 'Asset Disposal', icon: AlertTriangle },
    { value: 'license-compliance', label: 'License Compliance', icon: Key },
    { value: 'vendor-contracts', label: 'Vendor Contracts', icon: FileText },
    { value: 'access-review', label: 'Access Review', icon: Eye }
  ];

  const fetchComplianceSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?organizationId=${organizationId}&type=compliance-summary`);
      const data = await response.json();
      
      if (response.ok) {
        setComplianceSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching compliance summary:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?organizationId=${organizationId}&type=${selectedReport}`);
      const data = await response.json();
      
      if (response.ok) {
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, selectedReport]);

  useEffect(() => {
    if (selectedReport === 'compliance-summary') {
      fetchComplianceSummary();
    } else {
      fetchReport();
    }
  }, [selectedReport, fetchComplianceSummary, fetchReport]);

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/admin/reports?organizationId=${organizationId}&type=${selectedReport}&format=${exportFormat}`);
      
      if (response.ok) {
        if (exportFormat === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedReport}_report.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedReport}_report.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getComplianceScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5" />;
    if (score >= 60) return <Clock className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Reports</h1>
          <p className="text-muted-foreground">
            Generate and export compliance reports for audit requirements
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={!reportData && !complianceSummary}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
          <CardDescription>
            Choose the type of compliance report you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportTypes.map((report) => {
              const IconComponent = report.icon;
              return (
                <Button
                  key={report.value}
                  variant={selectedReport === report.value ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedReport(report.value)}
                >
                  <IconComponent className="h-6 w-6" />
                  <span className="text-sm">{report.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Summary Report */}
      {selectedReport === 'compliance-summary' && complianceSummary && (
        <div className="space-y-6">
          {/* Overall Compliance Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Overall Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className={`inline-flex items-center gap-2 px-6 py-4 rounded-full text-2xl font-bold ${getComplianceScoreColor(complianceSummary.complianceScore)}`}>
                  {getComplianceScoreIcon(complianceSummary.complianceScore)}
                  {complianceSummary.complianceScore}%
                </div>
              </div>
              <p className="text-center text-muted-foreground mt-2">
                Generated on {new Date(complianceSummary.generatedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Compliance Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asset Compliance</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceSummary.assetCompliance.totalAssets}</div>
                <p className="text-xs text-muted-foreground">
                  Total assets tracked
                </p>
                <div className="mt-2 space-y-1">
                  {Object.entries(complianceSummary.assetCompliance.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-xs">
                      <span>{status.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendor Compliance</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceSummary.vendorCompliance.totalVendors}</div>
                <p className="text-xs text-muted-foreground">
                  Total vendors managed
                </p>
                <div className="mt-2 space-y-1">
                  {Object.entries(complianceSummary.vendorCompliance.byRiskLevel).map(([risk, count]) => (
                    <div key={risk} className="flex justify-between text-xs">
                      <span>{risk} Risk</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">License Compliance</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceSummary.licenseCompliance.compliantLicenses}</div>
                <p className="text-xs text-muted-foreground">
                  of {complianceSummary.licenseCompliance.totalLicenses} licenses compliant
                </p>
                <div className="mt-2 text-xs text-orange-600">
                  {complianceSummary.licenseCompliance.expiringSoon} expiring soon
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Access Compliance</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceSummary.accessCompliance.totalAccess}</div>
                <p className="text-xs text-muted-foreground">
                  Total access permissions
                </p>
                <div className="mt-2 space-y-1">
                  {Object.entries(complianceSummary.accessCompliance.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-xs">
                      <span>{status.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Detailed Reports */}
      {selectedReport !== 'compliance-summary' && reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {reportTypes.find(r => r.value === selectedReport)?.icon && 
                React.createElement(reportTypes.find(r => r.value === selectedReport)!.icon, { className: "h-5 w-5" })}
              {reportTypes.find(r => r.value === selectedReport)?.label} Report
            </CardTitle>
            <CardDescription>
              Generated on {new Date(reportData.generatedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!!reportData.data.summary && typeof reportData.data.summary === 'object' && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.data.summary as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold">{value as number}</div>
                      <div className="text-sm text-muted-foreground">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report-specific content */}
            <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.data.assets as unknown[])?.slice(0, 10).map((asset) => (
                      <TableRow key={(asset as Record<string, unknown>).id as string}>
                        <TableCell className="font-medium">{(asset as Record<string, unknown>).name as string}</TableCell>
                        <TableCell>{(asset as Record<string, unknown>).type as string}</TableCell>
                        <TableCell>{(asset as Record<string, unknown>).status as string}</TableCell>
                        <TableCell>{((asset as Record<string, unknown>).owner as Record<string, unknown>)?.name as string || 'Unassigned'}</TableCell>
                        <TableCell>{(asset as Record<string, unknown>).department as string || '-'}</TableCell>
                        <TableCell>{(asset as Record<string, unknown>).vendor as string || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(reportData.data.assets as unknown[])?.length > 10 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Showing first 10 of {(reportData.data.assets as unknown[])?.length} assets. Export for complete data.
                  </div>
                )}
              </div>

            {!!reportData.data.licenses && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Software</TableHead>
                      <TableHead>Publisher</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.data.licenses as unknown[])?.slice(0, 10).map((license) => (
                      <TableRow key={(license as Record<string, unknown>).id as string}>
                        <TableCell className="font-medium">{((license as Record<string, unknown>).software as Record<string, unknown>).name as string}</TableCell>
                        <TableCell>{((license as Record<string, unknown>).software as Record<string, unknown>).publisher as string || '-'}</TableCell>
                        <TableCell>{(license as Record<string, unknown>).seatsUsed as number} / {(license as Record<string, unknown>).seatsTotal as number}</TableCell>
                        <TableCell>{(license as Record<string, unknown>).utilization as number}%</TableCell>
                        <TableCell>{(license as Record<string, unknown>).expiryDate as string || 'No expiry'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            (license as Record<string, unknown>).complianceStatus === 'Compliant' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                          }`}>
                            {(license as Record<string, unknown>).complianceStatus as string}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(reportData.data.licenses as unknown[])?.length > 10 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Showing first 10 of {(reportData.data.licenses as unknown[])?.length} licenses. Export for complete data.
                  </div>
                )}
              </div>
            )}

            {!!reportData.data.accessRegistry && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead>Access Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Review Due</TableHead>
                      <TableHead>Last Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.data.accessRegistry as unknown[])?.slice(0, 10).map((access) => (
                      <TableRow key={(access as Record<string, unknown>).id as string}>
                        <TableCell className="font-medium">{(access as Record<string, unknown>).userId as string}</TableCell>
                        <TableCell>{(access as Record<string, unknown>).systemName as string}</TableCell>
                        <TableCell>{(access as Record<string, unknown>).accessLevel as string}</TableCell>
                        <TableCell>{(access as Record<string, unknown>).status as string}</TableCell>
                        <TableCell>{(access as Record<string, unknown>).reviewDueDate as string || 'No review'}</TableCell>
                        <TableCell>{((access as Record<string, unknown>).lastReview as Record<string, unknown>)?.reviewedAt as string || 'Never'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(reportData.data.accessRegistry as unknown[])?.length > 10 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Showing first 10 of {(reportData.data.accessRegistry as unknown[])?.length} access records. Export for complete data.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evidence Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Evidence
          </CardTitle>
          <CardDescription>
            Use these reports as evidence for compliance audits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">ISO 27001 Evidence</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Asset inventory and access control reports provide evidence for:
              </p>
              <ul className="text-sm space-y-1">
                <li>• A.8.1.1 - Inventory of assets</li>
                <li>• A.9.1.1 - Access control policy</li>
                <li>• A.9.2.1 - User registration and de-registration</li>
                <li>• A.9.2.3 - Management of privileged access rights</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">SOC 2 Evidence</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Reports support SOC 2 compliance requirements:
              </p>
              <ul className="text-sm space-y-1">
                <li>• CC6.1 - Logical and physical access controls</li>
                <li>• CC6.2 - Prior to issuing system credentials</li>
                <li>• CC6.3 - Access to data and software</li>
                <li>• CC6.7 - Data transmission and disposal</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PlatformAdminLayout>
  );
}
