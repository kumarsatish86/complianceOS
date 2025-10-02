'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface ComplianceScoreWidgetProps {
  organizationId: string;
  config?: {
    showTrend?: boolean;
    showBreakdown?: boolean;
    threshold?: {
      green: number;
      yellow: number;
    };
  };
}

interface ComplianceData {
  value: number;
  metadata: {
    frameworks: number;
    average: number;
    breakdown: Array<{
      framework: string;
      coverage: number;
    }>;
  };
}

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
}

export function ComplianceScoreWidget({ organizationId, config = {} }: ComplianceScoreWidgetProps) {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(config.showBreakdown || false);

  const {
    showTrend = true,
    threshold = { green: 90, yellow: 70 }
  } = config;

  const fetchComplianceData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        metricType: 'COMPLIANCE_SCORE',
        includeTrends: showTrend.toString()
      });

      const response = await fetch(`/api/admin/dashboard/metrics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.currentMetrics.COMPLIANCE_SCORE);
        if (showTrend && result.trends) {
          setTrend(result.trends.COMPLIANCE_SCORE);
        }
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, showTrend]);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  const getScoreColor = (score: number) => {
    if (score >= threshold.green) return 'text-green-600';
    if (score >= threshold.yellow) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= threshold.green) return 'bg-green-50 border-green-200';
    if (score >= threshold.yellow) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
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
          <p>No compliance data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 ${getScoreBgColor(data.value)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Compliance Score</h3>
        </div>
        {showTrend && trend && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend.direction)}`}>
            {getTrendIcon(trend.direction)}
            <span className="text-sm font-medium">
              {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className={`text-4xl font-bold ${getScoreColor(data.value)} mb-2`}>
          {data.value.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">
          Across {data.metadata.frameworks} frameworks
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              data.value >= threshold.green ? 'bg-green-500' :
              data.value >= threshold.yellow ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(data.value, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <Badge 
          className={
            data.value >= threshold.green ? 'bg-green-100 text-green-800' :
            data.value >= threshold.yellow ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }
        >
          {data.value >= threshold.green ? (
            <><CheckCircle className="h-3 w-3 mr-1" /> Excellent
          </>
          ) : data.value >= threshold.yellow ? (
            <><AlertTriangle className="h-3 w-3 mr-1" /> Good
          </>
          ) : (
            <><AlertTriangle className="h-3 w-3 mr-1" /> Needs Attention
          </>
          )}
        </Badge>
      </div>

      {/* Framework Breakdown */}
      {showBreakdown && data.metadata.breakdown && data.metadata.breakdown.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Framework Breakdown</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              Hide Details
            </Button>
          </div>
          <div className="space-y-1">
            {data.metadata.breakdown.map((framework, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{framework.framework}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${
                        framework.coverage >= threshold.green ? 'bg-green-500' :
                        framework.coverage >= threshold.yellow ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(framework.coverage, 100)}%` }}
                    ></div>
                  </div>
                  <span className={`font-medium ${getScoreColor(framework.coverage)}`}>
                    {framework.coverage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showBreakdown && data.metadata.breakdown && data.metadata.breakdown.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBreakdown(true)}
          className="w-full"
        >
          Show Framework Breakdown
        </Button>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-4">
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
