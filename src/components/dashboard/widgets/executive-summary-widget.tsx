'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  ExternalLink,
  Download,
  Eye,
  EyeOff } from 'lucide-react';

interface ExecutiveSummaryWidgetProps {
  organizationId: string;
  config?: {
    showDetails?: boolean;
    showTrends?: boolean;
    showRecommendations?: boolean;
  };
}

interface ExecutiveSummaryData {
  overallCompliance: {
    score: number;
    trend: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  keyMetrics: {
    frameworks: number;
    controls: number;
    evidence: number;
    audits: number;
  };
  criticalIssues: Array<{
    id: string;
    title: string;
    severity: 'high' | 'medium' | 'low';
    impact: string;
    recommendation: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    impact: string;
    date: string;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  nextActions: Array<{
    id: string;
    action: string;
    owner: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
}

export function ExecutiveSummaryWidget({ organizationId, config = {} }: ExecutiveSummaryWidgetProps) {
  const [data, setData] = useState<ExecutiveSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showTrends = true,
    showRecommendations = true
  } = config;

  useEffect(() => {
    fetchExecutiveData();
  }, [organizationId]);

  const fetchExecutiveData = async () => {
    try {
      setLoading(true);
      
      // Mock executive summary data
      const mockData: ExecutiveSummaryData = {
        overallCompliance: {
          score: 87.5,
          trend: 12.3,
          status: 'good'
        },
        keyMetrics: {
          frameworks: 3,
          controls: 156,
          evidence: 234,
          audits: 2
        },
        criticalIssues: [
          {
            id: 'issue1',
            title: 'Access Control Gaps',
            severity: 'high',
            impact: 'Potential unauthorized access to sensitive systems',
            recommendation: 'Implement multi-factor authentication and regular access reviews'
          },
          {
            id: 'issue2',
            title: 'Evidence Expiration',
            severity: 'medium',
            impact: '15 evidence items expiring within 30 days',
            recommendation: 'Establish automated renewal process and early warning system'
          }
        ],
        achievements: [
          {
            id: 'ach1',
            title: 'SOC 2 Type II Certification',
            impact: 'Achieved 95% compliance score',
            date: '2024-01-15'
          },
          {
            id: 'ach2',
            title: 'ISO 27001 Implementation',
            impact: 'Completed 85% of required controls',
            date: '2024-02-01'
          }
        ],
        recommendations: [
          {
            id: 'rec1',
            title: 'Implement Automated Monitoring',
            priority: 'high',
            effort: 'medium',
            impact: 'Reduce manual effort by 60% and improve accuracy'
          },
          {
            id: 'rec2',
            title: 'Enhance Training Program',
            priority: 'medium',
            effort: 'low',
            impact: 'Improve employee awareness and reduce security incidents'
          }
        ],
        nextActions: [
          {
            id: 'action1',
            action: 'Complete access control review',
            owner: 'John Smith',
            dueDate: '2024-03-15',
            status: 'in_progress'
          },
          {
            id: 'action2',
            action: 'Update security policies',
            owner: 'Sarah Johnson',
            dueDate: '2024-03-20',
            status: 'pending'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching executive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-50 border-green-200';
      case 'good': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };


  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Low</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
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
          <p>No executive summary data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 ${getStatusBgColor(data.overallCompliance.status)}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Executive Summary</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(data.overallCompliance.status)}
            <h4 className="text-lg font-semibold text-gray-900">Overall Compliance Score</h4>
          </div>
          {showTrends && (
            <div className={`flex items-center space-x-1 ${data.overallCompliance.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.overallCompliance.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {data.overallCompliance.trend > 0 ? '+' : ''}{data.overallCompliance.trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`text-4xl font-bold ${getStatusColor(data.overallCompliance.status)} mb-2`}>
          {data.overallCompliance.score.toFixed(1)}%
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              data.overallCompliance.status === 'excellent' ? 'bg-green-500' :
              data.overallCompliance.status === 'good' ? 'bg-blue-500' :
              data.overallCompliance.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(data.overallCompliance.score, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-blue-600">{data.keyMetrics.frameworks}</div>
          <div className="text-sm text-gray-600">Frameworks</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-green-600">{data.keyMetrics.controls}</div>
          <div className="text-sm text-gray-600">Controls</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-purple-600">{data.keyMetrics.evidence}</div>
          <div className="text-sm text-gray-600">Evidence Items</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-orange-600">{data.keyMetrics.audits}</div>
          <div className="text-sm text-gray-600">Active Audits</div>
        </div>
      </div>

      {/* Critical Issues */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Critical Issues Requiring Attention</h4>
        <div className="space-y-3">
          {data.criticalIssues.slice(0, showDetails ? 3 : 2).map((issue) => (
            <div key={issue.id} className="p-3 bg-white rounded border">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-gray-900">{issue.title}</h5>
                {getSeverityBadge(issue.severity)}
              </div>
              <p className="text-sm text-gray-600 mb-2">{issue.impact}</p>
              <p className="text-sm text-blue-600">{issue.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Achievements</h4>
        <div className="space-y-2">
          {data.achievements.slice(0, showDetails ? 3 : 2).map((achievement) => (
            <div key={achievement.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
              <div>
                <div className="text-sm font-medium text-green-900">{achievement.title}</div>
                <div className="text-xs text-green-700">{achievement.impact}</div>
              </div>
              <div className="text-xs text-green-600">{achievement.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Strategic Recommendations</h4>
          <div className="space-y-2">
            {data.recommendations.map((rec) => (
              <div key={rec.id} className="p-3 bg-white rounded border">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{rec.title}</h5>
                  <Badge className={`${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{rec.impact}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Effort: {rec.effort}</span>
                  <span>Impact: {rec.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Actions */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Next Actions</h4>
          <div className="space-y-2">
            {data.nextActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <div className="text-sm font-medium text-gray-900">{action.action}</div>
                  <div className="text-xs text-gray-500">Owner: {action.owner}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">{action.dueDate}</div>
                  <Badge className={`text-xs ${
                    action.status === 'completed' ? 'bg-green-100 text-green-800' :
                    action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {action.status.replace('_', ' ')}
                  </Badge>
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
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
