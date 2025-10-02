'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Calendar } from 'lucide-react';

interface PolicyComplianceTrackingWidgetProps {
  organizationId: string;
  config?: {
    showDetails?: boolean;
    showTrend?: boolean;
    showViolations?: boolean;
  };
}

interface PolicyComplianceData {
  totalPolicies: number;
  compliantPolicies: number;
  nonCompliantPolicies: number;
  policyStatus: Array<{
    policy: string;
    category: string;
    status: 'compliant' | 'non_compliant' | 'under_review' | 'pending_approval';
    lastReview: string;
    nextReview: string;
    violations: number;
    complianceScore: number;
  }>;
  violationTrends: Array<{
    date: string;
    violations: number;
    resolved: number;
    newViolations: number;
  }>;
  topViolations: Array<{
    id: string;
    policy: string;
    violation: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    count: number;
    trend: number;
    resolution: string;
  }>;
  complianceMetrics: {
    overallCompliance: number;
    averageReviewTime: number;
    violationResolutionRate: number;
    policyUpdateFrequency: number;
  };
  categoryBreakdown: Array<{
    category: string;
    policyCount: number;
    complianceRate: number;
    violations: number;
    trend: number;
  }>;
  upcomingReviews: Array<{
    id: string;
    policy: string;
    category: string;
    reviewDate: string;
    daysUntil: number;
    priority: 'high' | 'medium' | 'low';
    reviewer: string;
  }>;
}

export function PolicyComplianceTrackingWidget({ organizationId, config = {} }: PolicyComplianceTrackingWidgetProps) {
  const [data, setData] = useState<PolicyComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showTrend = true,
    showViolations = true
  } = config;

  useEffect(() => {
    fetchPolicyComplianceData();
  }, [organizationId]);

  const fetchPolicyComplianceData = async () => {
    try {
      setLoading(true);
      
      // Mock policy compliance data
      const mockData: PolicyComplianceData = {
        totalPolicies: 28,
        compliantPolicies: 22,
        nonCompliantPolicies: 6,
        policyStatus: [
          {
            policy: 'Information Security Policy',
            category: 'Security',
            status: 'compliant',
            lastReview: '2024-01-15',
            nextReview: '2024-07-15',
            violations: 0,
            complianceScore: 95
          },
          {
            policy: 'Data Protection Policy',
            category: 'Privacy',
            status: 'non_compliant',
            lastReview: '2024-01-10',
            nextReview: '2024-04-10',
            violations: 3,
            complianceScore: 75
          },
          {
            policy: 'Access Control Policy',
            category: 'Security',
            status: 'under_review',
            lastReview: '2023-12-01',
            nextReview: '2024-03-01',
            violations: 2,
            complianceScore: 85
          },
          {
            policy: 'Incident Response Policy',
            category: 'Security',
            status: 'compliant',
            lastReview: '2024-01-20',
            nextReview: '2024-07-20',
            violations: 0,
            complianceScore: 92
          },
          {
            policy: 'Employee Handbook',
            category: 'HR',
            status: 'pending_approval',
            lastReview: '2023-11-15',
            nextReview: '2024-05-15',
            violations: 1,
            complianceScore: 88
          }
        ],
        violationTrends: [
          { date: '2024-01-01', violations: 12, resolved: 8, newViolations: 4 },
          { date: '2024-01-08', violations: 8, resolved: 6, newViolations: 2 },
          { date: '2024-01-15', violations: 10, resolved: 7, newViolations: 3 },
          { date: '2024-01-22', violations: 6, resolved: 8, newViolations: 2 },
          { date: '2024-01-29', violations: 4, resolved: 5, newViolations: 1 }
        ],
        topViolations: [
          {
            id: 'violation1',
            policy: 'Data Protection Policy',
            violation: 'Unauthorized data sharing',
            severity: 'high',
            count: 5,
            trend: -20,
            resolution: 'Implement data loss prevention tools'
          },
          {
            id: 'violation2',
            policy: 'Access Control Policy',
            violation: 'Shared account usage',
            severity: 'medium',
            count: 3,
            trend: 0,
            resolution: 'Enforce individual account requirements'
          },
          {
            id: 'violation3',
            policy: 'Information Security Policy',
            violation: 'Weak password usage',
            severity: 'medium',
            count: 2,
            trend: -50,
            resolution: 'Implement password complexity requirements'
          }
        ],
        complianceMetrics: {
          overallCompliance: 78.6,
          averageReviewTime: 15,
          violationResolutionRate: 85.7,
          policyUpdateFrequency: 6
        },
        categoryBreakdown: [
          {
            category: 'Security',
            policyCount: 12,
            complianceRate: 83.3,
            violations: 4,
            trend: -15
          },
          {
            category: 'Privacy',
            policyCount: 8,
            complianceRate: 75,
            violations: 6,
            trend: 10
          },
          {
            category: 'HR',
            policyCount: 5,
            complianceRate: 80,
            violations: 2,
            trend: -25
          },
          {
            category: 'Operations',
            policyCount: 3,
            complianceRate: 66.7,
            violations: 3,
            trend: 0
          }
        ],
        upcomingReviews: [
          {
            id: 'review1',
            policy: 'Access Control Policy',
            category: 'Security',
            reviewDate: '2024-03-01',
            daysUntil: 15,
            priority: 'high',
            reviewer: 'John Smith'
          },
          {
            id: 'review2',
            policy: 'Data Protection Policy',
            category: 'Privacy',
            reviewDate: '2024-04-10',
            daysUntil: 55,
            priority: 'high',
            reviewer: 'Sarah Johnson'
          },
          {
            id: 'review3',
            policy: 'Employee Handbook',
            category: 'HR',
            reviewDate: '2024-05-15',
            daysUntil: 90,
            priority: 'medium',
            reviewer: 'Mike Wilson'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching policy compliance data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'non_compliant': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Non-Compliant</Badge>;
      case 'under_review': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'pending_approval': return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
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


  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
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
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>No policy compliance data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Policy Compliance Tracking</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.totalPolicies} policies</span>
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
          <div className="text-2xl font-bold text-blue-600 mb-1">{data.totalPolicies}</div>
          <div className="text-sm text-gray-600">Total Policies</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-green-600 mb-1">{data.compliantPolicies}</div>
          <div className="text-sm text-gray-600">Compliant</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-2xl font-bold text-red-600 mb-1">{data.nonCompliantPolicies}</div>
          <div className="text-sm text-gray-600">Non-Compliant</div>
        </div>
      </div>

      {/* Policy Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Policy Status Overview</h4>
        <div className="space-y-2">
          {data.policyStatus.slice(0, showDetails ? 5 : 3).map((policy, index) => (
            <div key={index} className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h5 className="font-medium text-gray-900">{policy.policy}</h5>
                </div>
                {getStatusBadge(policy.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium ml-2">{policy.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Violations:</span>
                  <span className="font-medium ml-2">{policy.violations}</span>
                </div>
                <div>
                  <span className="text-gray-600">Score:</span>
                  <span className="font-medium ml-2">{policy.complianceScore}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Next Review:</span>
                  <span className="font-medium ml-2">{formatDate(policy.nextReview)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Compliance by Category</h4>
        <div className="space-y-2">
          {data.categoryBreakdown.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{category.policyCount}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{category.category}</div>
                  <div className="text-xs text-gray-500">{category.violations} violations</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-900">{category.complianceRate.toFixed(1)}%</span>
                <div className={`flex items-center space-x-1 ${getTrendColor(category.trend)}`}>
                  {getTrendIcon(category.trend)}
                  <span className="text-sm font-medium">
                    {category.trend > 0 ? '+' : ''}{category.trend.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Violations */}
      {showViolations && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Policy Violations</h4>
          <div className="space-y-2">
            {data.topViolations.map((violation) => (
              <div key={violation.id} className="p-3 bg-white rounded border">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{violation.violation}</h5>
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(violation.severity)}
                    <Badge className="bg-gray-100 text-gray-800">{violation.count} occurrences</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Policy: {violation.policy}</span>
                  <div className={`flex items-center space-x-1 ${getTrendColor(violation.trend)}`}>
                    {getTrendIcon(violation.trend)}
                    <span className="text-sm font-medium">
                      {violation.trend > 0 ? '+' : ''}{violation.trend.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-blue-600">{violation.resolution}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Metrics */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Compliance Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {data.complianceMetrics.overallCompliance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Compliance</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {data.complianceMetrics.violationResolutionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Resolution Rate</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {data.complianceMetrics.averageReviewTime}d
              </div>
              <div className="text-sm text-gray-600">Avg. Review Time</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {data.complianceMetrics.policyUpdateFrequency}m
              </div>
              <div className="text-sm text-gray-600">Update Frequency</div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Reviews */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Upcoming Policy Reviews</h4>
          <div className="space-y-2">
            {data.upcomingReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{review.policy}</div>
                    <div className="text-xs text-gray-500">{review.category} • Reviewer: {review.reviewer}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{review.daysUntil} days</span>
                  {getPriorityBadge(review.priority)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violation Trend Chart */}
      {showTrend && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Violation Trends</h4>
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.violationTrends.map((point) => (
              <div key={point.date} className="flex flex-col items-center">
                <div className="flex space-x-1 mb-1">
                  <div
                    className="w-3 bg-red-500 rounded-t"
                    style={{ height: `${(point.violations / 15) * 60}px` }}
                    title={`Violations: ${point.violations}`}
                  ></div>
                  <div
                    className="w-3 bg-green-500 rounded-t"
                    style={{ height: `${(point.resolved / 10) * 60}px` }}
                    title={`Resolved: ${point.resolved}`}
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
              <span className="text-xs text-gray-600">Violations</span>
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
