'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, 
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  Eye,
  EyeOff,
  BarChart3,
  Calendar } from 'lucide-react';

interface AuditHistoryTimelineWidgetProps {
  organizationId: string;
  config?: {
    showDetails?: boolean;
    showMetrics?: boolean;
    showTrend?: boolean;
    timeframe?: '1y' | '2y' | '3y';
  };
}

interface AuditHistoryData {
  totalAudits: number;
  completedAudits: number;
  activeAudits: number;
  auditTimeline: Array<{
    id: string;
    name: string;
    type: string;
    status: 'completed' | 'in_progress' | 'scheduled' | 'cancelled';
    startDate: string;
    endDate: string;
    duration: number;
    findings: number;
    complianceScore: number;
    auditor: string;
    framework: string;
  }>;
  auditMetrics: {
    averageDuration: number;
    averageFindings: number;
    averageComplianceScore: number;
    successRate: number;
  };
  frameworkBreakdown: Array<{
    framework: string;
    auditCount: number;
    averageScore: number;
    lastAudit: string;
  }>;
  trendData: Array<{
    quarter: string;
    auditCount: number;
    averageScore: number;
    findingsCount: number;
  }>;
  upcomingAudits: Array<{
    id: string;
    name: string;
    type: string;
    scheduledDate: string;
    daysUntil: number;
    preparationStatus: 'ready' | 'in_progress' | 'not_ready';
  }>;
}

export function AuditHistoryTimelineWidget({ organizationId, config = {} }: AuditHistoryTimelineWidgetProps) {
  const [data, setData] = useState<AuditHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showMetrics = true,
    showTrend = true,
    timeframe = '2y'
  } = config;

  useEffect(() => {
    fetchAuditHistoryData();
  }, [organizationId, timeframe]);

  const fetchAuditHistoryData = async () => {
    try {
      setLoading(true);
      
      // Mock audit history data
      const mockData: AuditHistoryData = {
        totalAudits: 12,
        completedAudits: 9,
        activeAudits: 2,
        auditTimeline: [
          {
            id: 'audit1',
            name: 'SOC 2 Type II 2024',
            type: 'SOC_2',
            status: 'completed',
            startDate: '2024-01-15',
            endDate: '2024-02-15',
            duration: 31,
            findings: 3,
            complianceScore: 95,
            auditor: 'Deloitte',
            framework: 'SOC 2'
          },
          {
            id: 'audit2',
            name: 'ISO 27001 Certification',
            type: 'ISO_27001',
            status: 'completed',
            startDate: '2023-10-01',
            endDate: '2023-12-15',
            duration: 75,
            findings: 8,
            complianceScore: 87,
            auditor: 'PwC',
            framework: 'ISO 27001'
          },
          {
            id: 'audit3',
            name: 'PCI DSS Assessment',
            type: 'PCI_DSS',
            status: 'in_progress',
            startDate: '2024-02-01',
            endDate: '2024-03-15',
            duration: 43,
            findings: 5,
            complianceScore: 82,
            auditor: 'KPMG',
            framework: 'PCI DSS'
          },
          {
            id: 'audit4',
            name: 'Internal Security Review',
            type: 'INTERNAL',
            status: 'completed',
            startDate: '2023-08-01',
            endDate: '2023-08-15',
            duration: 15,
            findings: 2,
            complianceScore: 92,
            auditor: 'Internal Team',
            framework: 'Internal'
          },
          {
            id: 'audit5',
            name: 'SOC 2 Type I 2023',
            type: 'SOC_2',
            status: 'completed',
            startDate: '2023-06-01',
            endDate: '2023-07-01',
            duration: 30,
            findings: 4,
            complianceScore: 89,
            auditor: 'EY',
            framework: 'SOC 2'
          }
        ],
        auditMetrics: {
          averageDuration: 39,
          averageFindings: 4.4,
          averageComplianceScore: 89,
          successRate: 92.3
        },
        frameworkBreakdown: [
          {
            framework: 'SOC 2',
            auditCount: 4,
            averageScore: 92,
            lastAudit: '2024-02-15'
          },
          {
            framework: 'ISO 27001',
            auditCount: 3,
            averageScore: 87,
            lastAudit: '2023-12-15'
          },
          {
            framework: 'PCI DSS',
            auditCount: 2,
            averageScore: 85,
            lastAudit: '2024-03-15'
          },
          {
            framework: 'Internal',
            auditCount: 3,
            averageScore: 91,
            lastAudit: '2023-08-15'
          }
        ],
        trendData: [
          { quarter: 'Q1 2023', auditCount: 2, averageScore: 88, findingsCount: 6 },
          { quarter: 'Q2 2023', auditCount: 3, averageScore: 89, findingsCount: 8 },
          { quarter: 'Q3 2023', auditCount: 2, averageScore: 91, findingsCount: 4 },
          { quarter: 'Q4 2023', auditCount: 2, averageScore: 87, findingsCount: 10 },
          { quarter: 'Q1 2024', auditCount: 3, averageScore: 92, findingsCount: 8 }
        ],
        upcomingAudits: [
          {
            id: 'upcoming1',
            name: 'SOC 2 Type II 2025',
            type: 'SOC_2',
            scheduledDate: '2025-01-15',
            daysUntil: 365,
            preparationStatus: 'ready'
          },
          {
            id: 'upcoming2',
            name: 'ISO 27001 Recertification',
            type: 'ISO_27001',
            scheduledDate: '2024-10-01',
            daysUntil: 180,
            preparationStatus: 'in_progress'
          },
          {
            id: 'upcoming3',
            name: 'PCI DSS Annual Assessment',
            type: 'PCI_DSS',
            scheduledDate: '2024-06-01',
            daysUntil: 90,
            preparationStatus: 'not_ready'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching audit history data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'scheduled': return <Badge className="bg-yellow-100 text-yellow-800"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };


  const getPreparationStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'not_ready': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Not Ready</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2" />
          <p>No audit history data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Audit History Timeline</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.totalAudits} total audits</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-blue-600 mb-1">{data.totalAudits}</div>
          <div className="text-sm text-gray-600">Total Audits</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-green-600 mb-1">{data.completedAudits}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-yellow-600 mb-1">{data.activeAudits}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Audit History</h4>
        <div className="space-y-3">
          {data.auditTimeline.slice(0, showDetails ? 5 : 3).map((audit) => (
            <div key={audit.id} className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h5 className="font-medium text-gray-900">{audit.name}</h5>
                </div>
                {getStatusBadge(audit.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Framework:</span>
                  <span className="font-medium ml-2">{audit.framework}</span>
                </div>
                <div>
                  <span className="text-gray-600">Auditor:</span>
                  <span className="font-medium ml-2">{audit.auditor}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium ml-2">{audit.duration} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Findings:</span>
                  <span className="font-medium ml-2">{audit.findings}</span>
                </div>
                <div>
                  <span className="text-gray-600">Score:</span>
                  <span className={`font-medium ml-2 ${getScoreColor(audit.complianceScore)}`}>
                    {audit.complianceScore}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium ml-2">
                    {formatDate(audit.startDate)} - {formatDate(audit.endDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Framework Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Framework Performance</h4>
        <div className="space-y-2">
          {data.frameworkBreakdown.map((framework, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{framework.auditCount}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{framework.framework}</div>
                  <div className="text-xs text-gray-500">Last: {formatDate(framework.lastAudit)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${getScoreColor(framework.averageScore)}`}>
                  {framework.averageScore}%
                </div>
                <div className="text-xs text-gray-500">avg score</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Metrics */}
      {showMetrics && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Audit Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {data.auditMetrics.averageDuration.toFixed(0)}d
              </div>
              <div className="text-sm text-gray-600">Avg. Duration</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {data.auditMetrics.averageComplianceScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg. Score</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {data.auditMetrics.averageFindings.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg. Findings</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {data.auditMetrics.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Audits */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Upcoming Audits</h4>
          <div className="space-y-2">
            {data.upcomingAudits.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{audit.name}</div>
                    <div className="text-xs text-gray-500">Scheduled: {formatDate(audit.scheduledDate)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{audit.daysUntil} days</span>
                  {getPreparationStatusBadge(audit.preparationStatus)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {showTrend && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Audit Performance Trend</h4>
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.trendData.map((point) => (
              <div key={point.quarter} className="flex flex-col items-center">
                <div className="flex space-x-1 mb-1">
                  <div
                    className="w-4 bg-blue-500 rounded-t"
                    style={{ height: `${(point.auditCount / 5) * 60}px` }}
                    title={`Audits: ${point.auditCount}`}
                  ></div>
                  <div
                    className="w-4 bg-green-500 rounded-t"
                    style={{ height: `${(point.averageScore / 100) * 60}px` }}
                    title={`Score: ${point.averageScore}%`}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {point.quarter}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">Audit Count</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Average Score</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Timeline
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
