'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Eye,
  EyeOff,
  BarChart3,
  Users } from 'lucide-react';

interface FindingsManagementAnalyticsWidgetProps {
  organizationId: string;
  config?: {
    showSeverity?: boolean;
    showOwners?: boolean;
    showTrend?: boolean;
    showDetails?: boolean;
  };
}

interface FindingsManagementData {
  totalFindings: number;
  openFindings: number;
  resolvedFindings: number;
  severityDistribution: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    count: number;
    percentage: number;
    trend: number;
  }>;
  statusDistribution: Array<{
    status: 'open' | 'in_progress' | 'pending_validation' | 'mitigated' | 'closed';
    count: number;
    percentage: number;
  }>;
  ownerPerformance: Array<{
    id: string;
    name: string;
    assignedFindings: number;
    resolvedFindings: number;
    averageResolutionTime: number;
    performance: 'excellent' | 'good' | 'needs_improvement';
  }>;
  remediationMetrics: {
    averageResolutionTime: number;
    slaCompliance: number;
    recurrenceRate: number;
    costImpact: number;
  };
  trendData: Array<{
    date: string;
    newFindings: number;
    resolvedFindings: number;
    openFindings: number;
  }>;
  topFindings: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: string;
    owner: string;
    daysOpen: number;
    impact: string;
  }>;
}

export function FindingsManagementAnalyticsWidget({ organizationId, config = {} }: FindingsManagementAnalyticsWidgetProps) {
  const [data, setData] = useState<FindingsManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showSeverity = true,
    showOwners = true,
    showTrend = true
  } = config;

  useEffect(() => {
    fetchFindingsData();
  }, [organizationId]);

  const fetchFindingsData = async () => {
    try {
      setLoading(true);
      
      // Mock findings management data
      const mockData: FindingsManagementData = {
        totalFindings: 45,
        openFindings: 23,
        resolvedFindings: 22,
        severityDistribution: [
          { severity: 'critical', count: 3, percentage: 6.7, trend: -25 },
          { severity: 'high', count: 8, percentage: 17.8, trend: -12.5 },
          { severity: 'medium', count: 18, percentage: 40, trend: 5.6 },
          { severity: 'low', count: 16, percentage: 35.6, trend: 8.3 }
        ],
        statusDistribution: [
          { status: 'open', count: 12, percentage: 26.7 },
          { status: 'in_progress', count: 11, percentage: 24.4 },
          { status: 'pending_validation', count: 8, percentage: 17.8 },
          { status: 'mitigated', count: 9, percentage: 20 },
          { status: 'closed', count: 5, percentage: 11.1 }
        ],
        ownerPerformance: [
          {
            id: 'user1',
            name: 'John Smith',
            assignedFindings: 12,
            resolvedFindings: 8,
            averageResolutionTime: 5.2,
            performance: 'excellent'
          },
          {
            id: 'user2',
            name: 'Sarah Johnson',
            assignedFindings: 10,
            resolvedFindings: 6,
            averageResolutionTime: 7.8,
            performance: 'good'
          },
          {
            id: 'user3',
            name: 'Mike Wilson',
            assignedFindings: 8,
            resolvedFindings: 4,
            averageResolutionTime: 12.5,
            performance: 'needs_improvement'
          }
        ],
        remediationMetrics: {
          averageResolutionTime: 7.3,
          slaCompliance: 78.5,
          recurrenceRate: 12.5,
          costImpact: 125000
        },
        trendData: [
          { date: '2024-01-01', newFindings: 8, resolvedFindings: 6, openFindings: 25 },
          { date: '2024-01-08', newFindings: 5, resolvedFindings: 7, openFindings: 23 },
          { date: '2024-01-15', newFindings: 7, resolvedFindings: 4, openFindings: 26 },
          { date: '2024-01-22', newFindings: 4, resolvedFindings: 8, openFindings: 22 },
          { date: '2024-01-29', newFindings: 6, resolvedFindings: 5, openFindings: 23 }
        ],
        topFindings: [
          {
            id: 'finding1',
            title: 'Insufficient Access Controls',
            severity: 'critical',
            status: 'in_progress',
            owner: 'John Smith',
            daysOpen: 15,
            impact: 'Potential unauthorized access to sensitive data'
          },
          {
            id: 'finding2',
            title: 'Missing Security Patches',
            severity: 'high',
            status: 'open',
            owner: 'Sarah Johnson',
            daysOpen: 8,
            impact: 'Systems vulnerable to known exploits'
          },
          {
            id: 'finding3',
            title: 'Weak Password Policy',
            severity: 'medium',
            status: 'pending_validation',
            owner: 'Mike Wilson',
            daysOpen: 12,
            impact: 'Increased risk of account compromise'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching findings data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100';
      case 'high': return 'bg-orange-100';
      case 'medium': return 'bg-yellow-100';
      case 'low': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Low</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600';
      case 'in_progress': return 'text-yellow-600';
      case 'pending_validation': return 'text-blue-600';
      case 'mitigated': return 'text-green-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };


  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'excellent': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Excellent</Badge>;
      case 'good': return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Good</Badge>;
      case 'needs_improvement': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Needs Improvement</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-red-600';
    if (trend < 0) return 'text-green-600';
    return 'text-gray-600';
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
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>No findings management data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Findings Management Analytics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.totalFindings} total findings</span>
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
          <div className="text-2xl font-bold text-blue-600 mb-1">{data.totalFindings}</div>
          <div className="text-sm text-gray-600">Total Findings</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-red-600 mb-1">{data.openFindings}</div>
          <div className="text-sm text-gray-600">Open</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-green-600 mb-1">{data.resolvedFindings}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
      </div>

      {/* Severity Distribution */}
      {showSeverity && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Severity Distribution</h4>
          <div className="space-y-2">
            {data.severityDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getSeverityBgColor(item.severity)}`}></div>
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(item.severity)}
                    <span className="text-sm font-medium text-gray-900 capitalize">{item.severity}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-900">{item.count}</span>
                  <span className="text-sm text-gray-600">({item.percentage.toFixed(1)}%)</span>
                  {showTrend && (
                    <div className={`flex items-center space-x-1 ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                      <span className="text-sm font-medium">
                        {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Status Distribution</h4>
        <div className="grid grid-cols-5 gap-2">
          {data.statusDistribution.map((item, index) => (
            <div key={index} className="text-center p-2 bg-white rounded border">
              <div className={`text-lg font-bold ${getStatusColor(item.status)} mb-1`}>
                {item.count}
              </div>
              <div className="text-xs text-gray-600 capitalize">
                {item.status.replace('_', ' ')}
              </div>
              <div className="text-xs text-gray-500">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Owner Performance */}
      {showOwners && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Owner Performance</h4>
          <div className="space-y-2">
            {data.ownerPerformance.map((owner) => (
              <div key={owner.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                    <div className="text-xs text-gray-500">
                      {owner.resolvedFindings}/{owner.assignedFindings} resolved
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {owner.averageResolutionTime.toFixed(1)}d avg
                    </div>
                    <div className="text-xs text-gray-500">resolution time</div>
                  </div>
                  {getPerformanceBadge(owner.performance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remediation Metrics */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Remediation Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {data.remediationMetrics.averageResolutionTime.toFixed(1)}d
              </div>
              <div className="text-sm text-gray-600">Avg. Resolution Time</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {data.remediationMetrics.slaCompliance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">SLA Compliance</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {data.remediationMetrics.recurrenceRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Recurrence Rate</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-red-600 mb-1">
                ${(data.remediationMetrics.costImpact / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-gray-600">Cost Impact</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Findings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Findings Requiring Attention</h4>
        <div className="space-y-2">
          {data.topFindings.slice(0, showDetails ? 5 : 3).map((finding) => (
            <div key={finding.id} className="p-3 bg-white rounded border">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-gray-900">{finding.title}</h5>
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(finding.severity)}
                  <Badge className="bg-gray-100 text-gray-800">
                    {finding.daysOpen} days open
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Owner: {finding.owner}</span>
                <span className={`text-sm font-medium ${getStatusColor(finding.status)}`}>
                  {finding.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600">{finding.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      {showTrend && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Findings Trend</h4>
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.trendData.map((point) => (
              <div key={point.date} className="flex flex-col items-center">
                <div className="flex space-x-1 mb-1">
                  <div
                    className="w-3 bg-red-500 rounded-t"
                    style={{ height: `${(point.newFindings / 10) * 60}px` }}
                    title={`New: ${point.newFindings}`}
                  ></div>
                  <div
                    className="w-3 bg-green-500 rounded-t"
                    style={{ height: `${(point.resolvedFindings / 10) * 60}px` }}
                    title={`Resolved: ${point.resolvedFindings}`}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">New</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
