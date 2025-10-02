'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Eye,
  EyeOff,
  BarChart3,
  Target } from 'lucide-react';

interface RiskPostureOverviewWidgetProps {
  organizationId: string;
  config?: {
    showDetails?: boolean;
    showTrend?: boolean;
    showMitigation?: boolean;
  };
}

interface RiskPostureData {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalRisks: number;
  riskDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
    trend: number;
  }>;
  severityBreakdown: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    count: number;
    percentage: number;
  }>;
  riskTrends: Array<{
    date: string;
    riskScore: number;
    newRisks: number;
    mitigatedRisks: number;
  }>;
  topRisks: Array<{
    id: string;
    title: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    probability: number;
    impact: number;
    riskScore: number;
    owner: string;
    status: 'open' | 'mitigating' | 'monitoring' | 'closed';
    lastUpdated: string;
  }>;
  mitigationProgress: {
    totalMitigations: number;
    completedMitigations: number;
    inProgressMitigations: number;
    averageMitigationTime: number;
  };
  riskCategories: Array<{
    category: string;
    riskCount: number;
    averageScore: number;
    trend: number;
    topRisk: string;
  }>;
}

export function RiskPostureOverviewWidget({ organizationId, config = {} }: RiskPostureOverviewWidgetProps) {
  const [data, setData] = useState<RiskPostureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showTrend = true,
    showMitigation = true
  } = config;

  useEffect(() => {
    fetchRiskPostureData();
  }, [organizationId]);

  const fetchRiskPostureData = async () => {
    try {
      setLoading(true);
      
      // Mock risk posture data
      const mockData: RiskPostureData = {
        overallRiskScore: 6.8,
        riskLevel: 'medium',
        totalRisks: 24,
        riskDistribution: [
          { category: 'Security', count: 8, percentage: 33.3, trend: -12.5 },
          { category: 'Compliance', count: 6, percentage: 25, trend: 8.3 },
          { category: 'Operational', count: 5, percentage: 20.8, trend: -20 },
          { category: 'Financial', count: 3, percentage: 12.5, trend: 0 },
          { category: 'Reputational', count: 2, percentage: 8.3, trend: 50 }
        ],
        severityBreakdown: [
          { severity: 'critical', count: 2, percentage: 8.3 },
          { severity: 'high', count: 5, percentage: 20.8 },
          { severity: 'medium', count: 12, percentage: 50 },
          { severity: 'low', count: 5, percentage: 20.8 }
        ],
        riskTrends: [
          { date: '2024-01-01', riskScore: 7.2, newRisks: 3, mitigatedRisks: 2 },
          { date: '2024-01-08', riskScore: 6.9, newRisks: 2, mitigatedRisks: 3 },
          { date: '2024-01-15', riskScore: 6.8, newRisks: 4, mitigatedRisks: 2 },
          { date: '2024-01-22', riskScore: 6.7, newRisks: 1, mitigatedRisks: 4 },
          { date: '2024-01-29', riskScore: 6.8, newRisks: 3, mitigatedRisks: 2 }
        ],
        topRisks: [
          {
            id: 'risk1',
            title: 'Data Breach Vulnerability',
            category: 'Security',
            severity: 'critical',
            probability: 0.3,
            impact: 0.9,
            riskScore: 8.1,
            owner: 'John Smith',
            status: 'mitigating',
            lastUpdated: '2024-01-25'
          },
          {
            id: 'risk2',
            title: 'Regulatory Non-Compliance',
            category: 'Compliance',
            severity: 'high',
            probability: 0.4,
            impact: 0.7,
            riskScore: 7.0,
            owner: 'Sarah Johnson',
            status: 'monitoring',
            lastUpdated: '2024-01-20'
          },
          {
            id: 'risk3',
            title: 'System Downtime',
            category: 'Operational',
            severity: 'high',
            probability: 0.2,
            impact: 0.8,
            riskScore: 6.4,
            owner: 'Mike Wilson',
            status: 'open',
            lastUpdated: '2024-01-22'
          }
        ],
        mitigationProgress: {
          totalMitigations: 18,
          completedMitigations: 12,
          inProgressMitigations: 4,
          averageMitigationTime: 45
        },
        riskCategories: [
          {
            category: 'Security',
            riskCount: 8,
            averageScore: 7.2,
            trend: -12.5,
            topRisk: 'Data Breach Vulnerability'
          },
          {
            category: 'Compliance',
            riskCount: 6,
            averageScore: 6.8,
            trend: 8.3,
            topRisk: 'Regulatory Non-Compliance'
          },
          {
            category: 'Operational',
            riskCount: 5,
            averageScore: 6.1,
            trend: -20,
            topRisk: 'System Downtime'
          },
          {
            category: 'Financial',
            riskCount: 3,
            averageScore: 5.5,
            trend: 0,
            topRisk: 'Budget Overrun'
          },
          {
            category: 'Reputational',
            riskCount: 2,
            averageScore: 4.8,
            trend: 50,
            topRisk: 'Customer Trust Loss'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching risk posture data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskLevelBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-50 border-green-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'low': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Low</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
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
      case 'mitigating': return 'text-yellow-600';
      case 'monitoring': return 'text-blue-600';
      case 'closed': return 'text-green-600';
      default: return 'text-gray-600';
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
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <p>No risk posture data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 ${getRiskLevelBgColor(data.riskLevel)}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Risk Posture Overview</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.totalRisks} total risks</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Overall Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Overall Risk Score</h4>
          </div>
          {getRiskLevelBadge(data.riskLevel)}
        </div>
        <div className={`text-4xl font-bold ${getRiskLevelColor(data.riskLevel)} mb-2`}>
          {data.overallRiskScore.toFixed(1)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              data.riskLevel === 'low' ? 'bg-green-500' :
              data.riskLevel === 'medium' ? 'bg-yellow-500' :
              data.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min((data.overallRiskScore / 10) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 (Low Risk)</span>
          <span>10 (Critical Risk)</span>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Distribution by Category</h4>
        <div className="space-y-2">
          {data.riskDistribution.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{category.count}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{category.category}</div>
                  <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of total</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{category.count}</span>
                {showTrend && (
                  <div className={`flex items-center space-x-1 ${getTrendColor(category.trend)}`}>
                    {getTrendIcon(category.trend)}
                    <span className="text-sm font-medium">
                      {category.trend > 0 ? '+' : ''}{category.trend.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Severity Breakdown</h4>
        <div className="grid grid-cols-4 gap-2">
          {data.severityBreakdown.map((severity, index) => (
            <div key={index} className="text-center p-2 bg-white rounded border">
              <div className={`text-lg font-bold ${getSeverityColor(severity.severity)} mb-1`}>
                {severity.count}
              </div>
              <div className="text-xs text-gray-600 capitalize">
                {severity.severity}
              </div>
              <div className="text-xs text-gray-500">
                {severity.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Risks */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Risks Requiring Attention</h4>
        <div className="space-y-2">
          {data.topRisks.slice(0, showDetails ? 5 : 3).map((risk) => (
            <div key={risk.id} className="p-3 bg-white rounded border">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-gray-900">{risk.title}</h5>
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(risk.severity)}
                  <Badge className="bg-gray-100 text-gray-800">
                    {risk.riskScore.toFixed(1)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium ml-2">{risk.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Owner:</span>
                  <span className="font-medium ml-2">{risk.owner}</span>
                </div>
                <div>
                  <span className="text-gray-600">Probability:</span>
                  <span className="font-medium ml-2">{(risk.probability * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Impact:</span>
                  <span className="font-medium ml-2">{(risk.impact * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getStatusColor(risk.status)}`}>
                  {risk.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500">Updated: {risk.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mitigation Progress */}
      {showMitigation && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Mitigation Progress</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {data.mitigationProgress.completedMitigations}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {data.mitigationProgress.inProgressMitigations}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {data.mitigationProgress.totalMitigations}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {data.mitigationProgress.averageMitigationTime}d
              </div>
              <div className="text-sm text-gray-600">Avg. Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Categories */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Categories Analysis</h4>
          <div className="space-y-2">
            {data.riskCategories.map((category, index) => (
              <div key={index} className="p-3 bg-white rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{category.category}</h5>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{category.riskCount} risks</span>
                    <div className={`flex items-center space-x-1 ${getTrendColor(category.trend)}`}>
                      {getTrendIcon(category.trend)}
                      <span className="text-sm font-medium">
                        {category.trend > 0 ? '+' : ''}{category.trend.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average Score:</span>
                  <span className="font-semibold text-gray-900">{category.averageScore.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Top Risk:</span>
                  <span className="text-sm font-medium text-gray-900">{category.topRisk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {showTrend && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Trend</h4>
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.riskTrends.map((point) => (
              <div key={point.date} className="flex flex-col items-center">
                <div
                  className="w-6 bg-blue-500 rounded-t"
                  style={{ height: `${(point.riskScore / 10) * 80}px` }}
                  title={`Risk Score: ${point.riskScore.toFixed(1)}`}
                ></div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
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
