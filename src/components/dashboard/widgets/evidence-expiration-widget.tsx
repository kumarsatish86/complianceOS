'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  ExternalLink,
  Calendar,
  TrendingUp } from 'lucide-react';

interface EvidenceExpirationWidgetProps {
  organizationId: string;
  config?: {
    __alertThreshold?: number;
    showTrend?: boolean;
    showDetails?: boolean;
  };
}

interface EvidenceData {
  value: number;
  metadata: {
    totalEvidence: number;
    expiring30Days: number;
    expiring60Days: number;
    expiring90Days: number;
    reusePercentage: number;
    approvalBacklog: number;
  };
}

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
}

export function EvidenceExpirationWidget({ organizationId, config = {} }: EvidenceExpirationWidgetProps) {
  const [data, setData] = useState<EvidenceData | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showTrend = true
  } = config;

  const fetchEvidenceData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        metricType: 'EVIDENCE_HEALTH',
        includeTrends: showTrend.toString()
      });

      const response = await fetch(`/api/admin/dashboard/metrics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.currentMetrics.EVIDENCE_HEALTH);
        if (showTrend && result.trends) {
          setTrend(result.trends.EVIDENCE_HEALTH);
        }
      }
    } catch (error) {
      console.error('Error fetching evidence data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, showTrend]);

  useEffect(() => {
    fetchEvidenceData();
  }, [fetchEvidenceData]);

  const getHealthColor = (healthScore: number) => {
    if (healthScore >= 90) return 'text-green-600';
    if (healthScore >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (healthScore: number) => {
    if (healthScore >= 90) return 'bg-green-50 border-green-200';
    if (healthScore >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getSeverityLevel = (expiring30Days: number, totalEvidence: number) => {
    const percentage = totalEvidence > 0 ? (expiring30Days / totalEvidence) * 100 : 0;
    if (percentage >= 20) return 'critical';
    if (percentage >= 10) return 'warning';
    return 'good';
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
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
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>No evidence data available</p>
        </div>
      </Card>
    );
  }

  const severityLevel = getSeverityLevel(data.metadata.expiring30Days, data.metadata.totalEvidence);

  return (
    <Card className={`p-6 border-2 ${getHealthBgColor(data.value)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Evidence Expiration</h3>
        </div>
        {showTrend && trend && (
          <div className={`flex items-center space-x-1 ${getSeverityColor(trend.direction)}`}>
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">
              {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Health Score */}
      <div className="mb-4">
        <div className={`text-3xl font-bold ${getHealthColor(data.value)} mb-1`}>
          {data.value.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">
          Evidence Health Score
        </div>
      </div>

      {/* Expiration Timeline */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">30 Days</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${getSeverityColor(severityLevel)}`}>
              {data.metadata.expiring30Days}
            </span>
            {getSeverityIcon(severityLevel)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">60 Days</span>
          </div>
          <span className="font-semibold text-yellow-600">
            {data.metadata.expiring60Days}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">90 Days</span>
          </div>
          <span className="font-semibold text-blue-600">
            {data.metadata.expiring90Days}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <Badge 
          className={
            severityLevel === 'critical' ? 'bg-red-100 text-red-800' :
            severityLevel === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }
        >
          {severityLevel === 'critical' ? (
            <><AlertTriangle className="h-3 w-3 mr-1" /> Critical
          </>
          ) : severityLevel === 'warning' ? (
            <><Clock className="h-3 w-3 mr-1" /> Warning
          </>
          ) : (
            <><CheckCircle className="h-3 w-3 mr-1" /> Healthy
          </>
          )}
        </Badge>
      </div>

      {/* Additional Metrics */}
      {showDetails && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Evidence</span>
            <span className="font-medium">{data.metadata.totalEvidence}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Reuse Rate</span>
            <span className="font-medium">{data.metadata.reusePercentage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Approval Backlog</span>
            <span className="font-medium">{data.metadata.approvalBacklog}</span>
          </div>
        </div>
      )}

      {!showDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(true)}
          className="w-full mb-4"
        >
          Show Additional Metrics
        </Button>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          {/* Manage Evidence */}
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
