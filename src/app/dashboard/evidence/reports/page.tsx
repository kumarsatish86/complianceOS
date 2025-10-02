'use client';

import { useState, } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, 
  Download, 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock, } from 'lucide-react';

interface ReportData {
  reportType: string;
  generatedAt: string;
  organizationId: string;
  data: {
    frameworks: number;
    controls: {
      total: number;
      implemented: number;
      partial: number;
      notImplemented: number;
      byStatus: Record<string, number>;
    };
    evidence: {
      total: number;
      valid: number;
      expiring: number;
      expired: number;
      byStatus: Record<string, number>;
    };
    tasks: {
      total: number;
      completed: number;
      inProgress: number;
      overdue: number;
    };
    gapControls: Array<{
      id: string;
      name: string;
      description: string;
      status: string;
      criticality: string;
      framework: {
        name: string;
      };
      evidenceCount: number;
      taskCount: number;
    }>;
    summary: {
      total: number;
      completed: number;
      inProgress: number;
      overdue: number;
      byStatus: Record<string, number>;
    };
  };
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'overview', label: 'Overview Report', description: 'High-level compliance metrics and status' },
    { value: 'control-matrix', label: 'Control Matrix', description: 'Detailed control vs. evidence mapping' },
    { value: 'evidence-index', label: 'Evidence Index', description: 'Complete evidence inventory with metadata' },
    { value: 'expiring-evidence', label: 'Expiring Evidence', description: 'Evidence approaching expiry dates' },
    { value: 'gap-analysis', label: 'Gap Analysis', description: 'Detailed analysis of control deficiencies' },
    { value: 'task-summary', label: 'Task Summary', description: 'Task completion and assignment tracking' },
  ];

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports/compliance?type=${selectedReport}&organizationId=default-org`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportData.reportType) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Frameworks</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.frameworks}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Controls</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.controls.total}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Evidence</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.evidence.total}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.tasks.total}</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Control Status Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(reportData.data.controls.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{status}</span>
                      <span className="text-sm text-gray-600">{count as number}</span>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Evidence Status Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(reportData.data.evidence.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{status}</span>
                      <span className="text-sm text-gray-600">{count as number}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'gap-analysis':
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gap Analysis Summary</h3>
              <div className="text-sm text-gray-600">
                Found {reportData.data.gapControls.length} controls with GAP status
              </div>
            </Card>
            
            <div className="space-y-4">
              {reportData.data.gapControls.map((control) => (
                <Card key={control.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{control.name}</h4>
                      <p className="text-sm text-gray-600">{control.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {control.criticality}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {control.framework.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>Evidence: {control.evidenceCount}</div>
                      <div>Tasks: {control.taskCount}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'task-summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.summary.total}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.summary.overdue}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.summary.byStatus.COMPLETED || 0}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.data.summary.byStatus.IN_PROGRESS || 0}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Report data will be displayed here</p>
          </div>
        );
    }
  };

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
            <p className="text-gray-600">Generate and view comprehensive compliance reports</p>
          </div>
          <div className="flex gap-2">
            {reportData && (
              <Button variant="outline" onClick={downloadReport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
            <Button onClick={generateReport} disabled={loading} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* Report Type Selection */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {/* Select Report Type */}
              </label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Report Content */}
        {reportData && (
          <Card>
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {reportTypes.find(t => t.value === reportData.reportType)?.label}
                </h3>
                <div className="text-sm text-gray-500">
                  Generated: {new Date(reportData.generatedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="p-6">
              {renderReportContent()}
            </div>
          </Card>
        )}

        {!reportData && !loading && (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-4">Select a report type and click &quot;Generate Report&quot; to view compliance data</p>
            <Button onClick={generateReport} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Generate Report
            </Button>
          </Card>
        )}

        {loading && (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Generating report...</p>
          </Card>
        )}
      </div>
    </PlatformAdminLayout>
  );
}
