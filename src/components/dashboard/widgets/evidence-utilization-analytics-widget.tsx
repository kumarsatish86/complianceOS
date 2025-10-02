'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3,
  FileText,
  Recycle,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff, } from 'lucide-react';

interface EvidenceUtilizationAnalyticsWidgetProps {
  organizationId: string;
  config?: {
    showReuse?: boolean;
    showTrend?: boolean;
    showDetails?: boolean;
    timeframe?: '7d' | '30d' | '90d';
  };
}

interface EvidenceUtilizationData {
  totalEvidence: number;
  reusedEvidence: number;
  reusePercentage: number;
  averageReuseCount: number;
  topReusedEvidence: Array<{
    id: string;
    name: string;
    reuseCount: number;
    lastUsed: string;
  }>;
  utilizationTrend: Array<{
    date: string;
    reusePercentage: number;
    totalEvidence: number;
  }>;
  lifecycleStages: {
    draft: number;
    review: number;
    approved: number;
    archived: number;
  };
  qualityMetrics: {
    averageQualityScore: number;
    highQualityCount: number;
    lowQualityCount: number;
  };
}

export function EvidenceUtilizationAnalyticsWidget({ organizationId, config = {} }: EvidenceUtilizationAnalyticsWidgetProps) {
  const [data, setData] = useState<EvidenceUtilizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showReuse = true,
    showTrend = true,
    timeframe = '30d'
  } = config;

  useEffect(() => {
    fetchUtilizationData();
  }, [organizationId, timeframe]);

  const fetchUtilizationData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockData: EvidenceUtilizationData = {
        totalEvidence: 156,
        reusedEvidence: 98,
        reusePercentage: 62.8,
        averageReuseCount: 2.3,
        topReusedEvidence: [
          { id: 'ev1', name: 'Security Policy Document', reuseCount: 8, lastUsed: '2024-01-15' },
          { id: 'ev2', name: 'Access Control Matrix', reuseCount: 6, lastUsed: '2024-01-14' },
          { id: 'ev3', name: 'Incident Response Plan', reuseCount: 5, lastUsed: '2024-01-13' },
          { id: 'ev4', name: 'Risk Assessment Report', reuseCount: 4, lastUsed: '2024-01-12' },
          { id: 'ev5', name: 'Training Records', reuseCount: 3, lastUsed: '2024-01-11' }
        ],
        utilizationTrend: [
          { date: '2024-01-01', reusePercentage: 58.2, totalEvidence: 142 },
          { date: '2024-01-08', reusePercentage: 60.1, totalEvidence: 145 },
          { date: '2024-01-15', reusePercentage: 62.8, totalEvidence: 156 },
          { date: '2024-01-22', reusePercentage: 64.2, totalEvidence: 158 },
          { date: '2024-01-29', reusePercentage: 65.8, totalEvidence: 162 }
        ],
        lifecycleStages: {
          draft: 12,
          review: 8,
          approved: 125,
          archived: 11
        },
        qualityMetrics: {
          averageQualityScore: 87.5,
          highQualityCount: 98,
          lowQualityCount: 15
        }
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching utilization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReuseColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReuseBgColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-50 border-green-200';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Excellent</Badge>;
    } else if (score >= 80) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Good</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Needs Improvement</Badge>;
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
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p>No evidence utilization data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 ${getReuseBgColor(data.reusePercentage)}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Recycle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Evidence Utilization Analytics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.totalEvidence} total evidence</span>
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
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className={`text-3xl font-bold ${getReuseColor(data.reusePercentage)} mb-1`}>
            {data.reusePercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Reuse Rate</div>
          <div className="text-xs text-gray-500 mt-1">
            {data.reusedEvidence} of {data.totalEvidence} evidence items reused
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {data.averageReuseCount.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Avg. Reuse Count</div>
          <div className="text-xs text-gray-500 mt-1">
            Times each evidence item is reused on average
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Evidence Reuse Rate</span>
          <span className={`text-sm font-medium ${getReuseColor(data.reusePercentage)}`}>
            {data.reusePercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              data.reusePercentage >= 70 ? 'bg-green-500' :
              data.reusePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(data.reusePercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Top Reused Evidence */}
      {showReuse && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Most Reused Evidence</h4>
          <div className="space-y-2">
            {data.topReusedEvidence.slice(0, showDetails ? 5 : 3).map((evidence, index) => (
              <div key={evidence.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{evidence.name}</div>
                    <div className="text-xs text-gray-500">Last used: {evidence.lastUsed}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-blue-600">{evidence.reuseCount}</span>
                  <span className="text-xs text-gray-500">times</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lifecycle Stages */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Evidence Lifecycle Stages</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-600">{data.lifecycleStages.draft}</div>
              <div className="text-xs text-gray-600">Draft</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-lg font-bold text-yellow-600">{data.lifecycleStages.review}</div>
              <div className="text-xs text-gray-600">Review</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{data.lifecycleStages.approved}</div>
              <div className="text-xs text-gray-600">Approved</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-600">{data.lifecycleStages.archived}</div>
              <div className="text-xs text-gray-600">Archived</div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Metrics */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quality Metrics</h4>
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Average Quality Score</div>
                <div className="text-xs text-gray-500">Based on completeness and accuracy</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-lg font-bold ${getQualityColor(data.qualityMetrics.averageQualityScore)}`}>
                {data.qualityMetrics.averageQualityScore.toFixed(1)}
              </span>
              {getQualityBadge(data.qualityMetrics.averageQualityScore)}
            </div>
          </div>
        </div>
      )}

      {/* Utilization Trend */}
      {showTrend && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Utilization Trend</h4>
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.utilizationTrend.map((point) => (
              <div key={point.date} className="flex flex-col items-center">
                <div
                  className="w-6 bg-blue-500 rounded-t"
                  style={{ height: `${(point.reusePercentage / 100) * 80}px` }}
                ></div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-6">
        {getQualityBadge(data.reusePercentage)}
      </div>

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
