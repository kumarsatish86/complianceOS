'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock } from 'lucide-react';

interface AnalyticsData {
  complianceScore: {
    current: number;
    previous: number;
    trend: number;
  };
  evidenceHealth: {
    current: number;
    expiring: number;
    total: number;
  };
  taskPerformance: {
    completionRate: number;
    overdue: number;
    total: number;
  };
  auditReadiness: {
    score: number;
    activeAudits: number;
    readyAudits: number;
  };
  trends: {
    compliance: Array<{ date: string; value: number }>;
    evidence: Array<{ date: string; value: number }>;
    tasks: Array<{ date: string; value: number }>;
  };
}

export default function SecurityPostureAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [organizationId] = useState('org-123'); // This should come from auth context

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        organizationId,
        timeframe,
        includeTrends: 'true'
      });

      const response = await fetch(`/api/admin/dashboard/metrics?${params}`);
      if (response.ok) {
        const result = await response.json();
        
        // Transform API response to analytics data
        const analyticsData: AnalyticsData = {
          complianceScore: {
            current: result.currentMetrics.COMPLIANCE_SCORE?.value || 0,
            previous: 85, // This would come from historical data
            trend: result.trends?.COMPLIANCE_SCORE?.changePercent || 0
          },
          evidenceHealth: {
            current: result.currentMetrics.EVIDENCE_HEALTH?.value || 0,
            expiring: result.currentMetrics.EVIDENCE_HEALTH?.metadata?.expiring30Days || 0,
            total: result.currentMetrics.EVIDENCE_HEALTH?.metadata?.totalEvidence || 0
          },
          taskPerformance: {
            completionRate: result.currentMetrics.TASK_PERFORMANCE?.value || 0,
            overdue: result.currentMetrics.TASK_PERFORMANCE?.metadata?.overdueTasks || 0,
            total: result.currentMetrics.TASK_PERFORMANCE?.metadata?.totalTasks || 0
          },
          auditReadiness: {
            score: result.currentMetrics.AUDIT_READINESS?.value || 0,
            activeAudits: result.currentMetrics.AUDIT_READINESS?.metadata?.activeAudits || 0,
            readyAudits: 0 // This would be calculated
          },
          trends: {
            compliance: result.trends?.COMPLIANCE_SCORE?.dataPoints || [],
            evidence: result.trends?.EVIDENCE_HEALTH?.dataPoints || [],
            tasks: result.trends?.TASK_PERFORMANCE?.dataPoints || []
          }
        };
        
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, timeframe]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, fetchAnalyticsData]);

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const handleExport = () => {
    // TODO: Implement analytics export
    console.log('Export analytics');
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  if (!data) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No analytics data available
            </h3>
            <p className="text-gray-600 mb-6">
              Analytics data will appear here once you have compliance data in your system.
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </Card>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Posture Analytics</h1>
            <p className="text-gray-600 mt-1">
              Advanced analytics and trend analysis for compliance monitoring
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Compliance Score */}
          <Card className={`p-6 border-2 ${getScoreBgColor(data.complianceScore.current)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-700">Compliance Score</h3>
              </div>
              <div className={`flex items-center space-x-1 ${getTrendColor(data.complianceScore.trend)}`}>
                {getTrendIcon(data.complianceScore.trend)}
                <span className="text-sm font-medium">
                  {data.complianceScore.trend > 0 ? '+' : ''}{data.complianceScore.trend.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(data.complianceScore.current)} mb-2`}>
              {data.complianceScore.current.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              Previous: {data.complianceScore.previous.toFixed(1)}%
            </div>
          </Card>

          {/* Evidence Health */}
          <Card className={`p-6 border-2 ${getScoreBgColor(data.evidenceHealth.current)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-700">Evidence Health</h3>
              </div>
              <Badge className={
                data.evidenceHealth.expiring > 10 ? 'bg-red-100 text-red-800' :
                data.evidenceHealth.expiring > 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }>
                {data.evidenceHealth.expiring} expiring
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(data.evidenceHealth.current)} mb-2`}>
              {data.evidenceHealth.current.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              {data.evidenceHealth.total} total evidence items
            </div>
          </Card>

          {/* Task Performance */}
          <Card className={`p-6 border-2 ${getScoreBgColor(data.taskPerformance.completionRate)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-medium text-gray-700">Task Performance</h3>
              </div>
              <Badge className={
                data.taskPerformance.overdue > 5 ? 'bg-red-100 text-red-800' :
                data.taskPerformance.overdue > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }>
                {data.taskPerformance.overdue} overdue
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(data.taskPerformance.completionRate)} mb-2`}>
              {data.taskPerformance.completionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              {data.taskPerformance.total} total tasks
            </div>
          </Card>

          {/* Audit Readiness */}
          <Card className={`p-6 border-2 ${getScoreBgColor(data.auditReadiness.score)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-medium text-gray-700">Audit Readiness</h3>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {data.auditReadiness.activeAudits} active
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(data.auditReadiness.score)} mb-2`}>
              {data.auditReadiness.score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              {data.auditReadiness.readyAudits} ready for audit
            </div>
          </Card>
        </div>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Compliance Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Compliance Trend</h3>
              <Badge className={
                data.complianceScore.trend > 0 ? 'bg-green-100 text-green-800' :
                data.complianceScore.trend < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }>
                {data.complianceScore.trend > 0 ? 'Improving' :
                 data.complianceScore.trend < 0 ? 'Declining' : 'Stable'}
              </Badge>
            </div>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Data points: {data.trends.compliance.length}</p>
              </div>
            </div>
          </Card>

          {/* Evidence Health Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Evidence Health Trend</h3>
              <Badge className={
                data.evidenceHealth.expiring > 10 ? 'bg-red-100 text-red-800' :
                data.evidenceHealth.expiring > 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }>
                {data.evidenceHealth.expiring > 10 ? 'Critical' :
                 data.evidenceHealth.expiring > 5 ? 'Warning' : 'Healthy'}
              </Badge>
            </div>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Data points: {data.trends.evidence.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {data.complianceScore.current >= 90 ? 'Excellent' :
                 data.complianceScore.current >= 70 ? 'Good' : 'Needs Attention'}
              </div>
              <div className="text-sm text-gray-600">Overall Compliance Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {data.evidenceHealth.expiring === 0 ? 'All Current' :
                 data.evidenceHealth.expiring <= 5 ? 'Mostly Current' : 'Attention Needed'}
              </div>
              <div className="text-sm text-gray-600">Evidence Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {data.taskPerformance.overdue === 0 ? 'On Track' :
                 data.taskPerformance.overdue <= 3 ? 'Minor Delays' : 'Behind Schedule'}
              </div>
              <div className="text-sm text-gray-600">Task Status</div>
            </div>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
