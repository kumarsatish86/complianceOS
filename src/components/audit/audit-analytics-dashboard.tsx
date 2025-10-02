'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3,
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield,
  Target,
  Activity,
  FileText,
  TrendingUp } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalAudits: number;
    completedAudits: number;
    inProgressAudits: number;
    overdueAudits: number;
    totalControls: number;
    totalFindings: number;
    totalEvidence: number;
    completionRate: string;
  };
  trends: Array<{
    date: string;
    auditsCreated: number;
    auditsCompleted: number;
    findingsCreated: number;
  }>;
  compliance: {
    complianceRate: number;
    controlsByStatus: Record<string, number>;
    controlsByCategory: Record<string, number>;
    totalControls: number;
  };
  findings: {
    findingsBySeverity: Record<string, number>;
    findingsByStatus: Record<string, number>;
    averageResolutionTime: number;
    criticalFindings: number;
    highFindings: number;
    totalFindings: number;
  };
  efficiency: {
    averageAuditDuration: number;
    averageControlsPerAudit: number;
    averageFindingsPerAudit: number;
    efficiencyScore: number;
  };
  risk: {
    riskScore: number;
    riskLevel: string;
    openFindings: number;
    criticalOpen: number;
    highOpen: number;
    riskTrend: Array<{
      date: string;
      riskScore: number;
      auditRun: string;
    }>;
  };
  frameworks: Array<{
    name: string;
    auditCount: number;
    totalControls: number;
    totalFindings: number;
    complianceRate: string;
  }>;
  activities: {
    totalActivities: number;
    activitiesByType: Record<string, number>;
    activitiesByUser: Record<string, number>;
    recentActivities: Array<{
      activityType: string;
      performedBy: string;
      timestamp: string;
      targetEntity: string;
    }>;
  };
}

interface AuditAnalyticsDashboardProps {
  organizationId: string;
  auditRunId?: string;
}

export function AuditAnalyticsDashboard({ organizationId, auditRunId }: AuditAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        timeframe
      });

      if (auditRunId) {
        params.append('auditRunId', auditRunId);
      }

      const response = await fetch(`/api/admin/audit-analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, auditRunId, timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Analytics</h2>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'compliance', name: 'Compliance', icon: Shield },
            { id: 'findings', name: 'Findings', icon: AlertTriangle },
            { id: 'efficiency', name: 'Efficiency', icon: Target },
            { id: 'risk', name: 'Risk', icon: TrendingUp },
            { id: 'frameworks', name: 'Frameworks', icon: FileText },
            { id: 'activities', name: 'Activities', icon: Activity }
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Total Audits</p>
                  <p className="text-xl font-bold">{analytics.overview.totalAudits}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-xl font-bold">{analytics.overview.completedAudits}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-xl font-bold">{analytics.overview.inProgressAudits}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-xl font-bold">{analytics.overview.overdueAudits}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Completion Rate */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Completion Rate</h3>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.overview.completionRate}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analytics.overview.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Trends Chart Placeholder */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Audit Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Trend chart would be displayed here</p>
                <p className="text-sm text-gray-500">Integration with charting library needed</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Compliance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analytics.compliance.complianceRate}%
                </div>
                <p className="text-gray-600">Overall Compliance Rate</p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${analytics.compliance.complianceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Controls by Status</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.compliance.controlsByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm">{status.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Controls by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analytics.compliance.controlsByCategory).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-gray-600">{category}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Findings Tab */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Critical Findings</p>
                  <p className="text-xl font-bold">{analytics.findings.criticalFindings}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">High Findings</p>
                  <p className="text-xl font-bold">{analytics.findings.highFindings}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Avg Resolution</p>
                  <p className="text-xl font-bold">{analytics.findings.averageResolutionTime} days</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Findings by Severity</h3>
              <div className="space-y-3">
                {Object.entries(analytics.findings.findingsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center">
                    <span className="text-sm">{severity}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Findings by Status</h3>
              <div className="space-y-3">
                {Object.entries(analytics.findings.findingsByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm">{status.replace('_', ' ')}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Efficiency Tab */}
      {activeTab === 'efficiency' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Efficiency Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.efficiency.efficiencyScore}
                </div>
                <p className="text-sm text-gray-600">Efficiency Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.efficiency.averageAuditDuration}d
                </div>
                <p className="text-sm text-gray-600">Avg Duration</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.efficiency.averageControlsPerAudit}
                </div>
                <p className="text-sm text-gray-600">Avg Controls</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.efficiency.averageFindingsPerAudit}
                </div>
                <p className="text-sm text-gray-600">Avg Findings</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Risk Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">{analytics.risk.riskScore}</div>
                <p className="text-gray-600 mb-4">Risk Score</p>
                <Badge className={getRiskLevelColor(analytics.risk.riskLevel)}>
                  {analytics.risk.riskLevel} RISK
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-3">Risk Factors</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Open Findings</span>
                    <Badge variant="outline">{analytics.risk.openFindings}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Critical Open</span>
                    <Badge variant="outline">{analytics.risk.criticalOpen}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">High Open</span>
                    <Badge variant="outline">{analytics.risk.highOpen}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Frameworks Tab */}
      {activeTab === 'frameworks' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Framework Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Framework
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Controls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Findings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.frameworks.map((framework, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {framework.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {framework.auditCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {framework.totalControls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {framework.totalFindings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Badge variant="outline">{framework.complianceRate}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Activities by Type</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.activities.activitiesByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Activities by User</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.activities.activitiesByUser).map(([user, count]) => (
                    <div key={user} className="flex justify-between items-center">
                      <span className="text-sm">{user}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {analytics.activities.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{activity.activityType.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-500">by {activity.performedBy}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
