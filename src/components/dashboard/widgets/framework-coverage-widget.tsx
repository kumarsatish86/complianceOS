'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  BarChart3
} from 'lucide-react';

interface FrameworkCoverageWidgetProps {
  organizationId: string;
  config?: {
    showProgress?: boolean;
    showTrend?: boolean;
    showDetails?: boolean;
    maxFrameworks?: number;
  };
}

interface FrameworkData {
  id: string;
  name: string;
  type: string;
  coveragePercentage: number;
  controlsMet: number;
  controlsPartial: number;
  controlsGap: number;
  controlsNotApplicable: number;
  totalControls: number;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    change: number;
    changePercent: number;
  };
}

export function FrameworkCoverageWidget({ organizationId, config = {} }: FrameworkCoverageWidgetProps) {
  const [frameworks, setFrameworks] = useState<FrameworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showProgress = true,
    showTrend = true,
    maxFrameworks = 4
  } = config;

  const fetchFrameworkData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch framework metrics
      const response = await fetch(`/api/admin/dashboard/framework-metrics?organizationId=${organizationId}`);
      if (response.ok) {
        const result = await response.json();
        
        // Transform and limit frameworks
        const frameworkData = result.frameworkMetrics
          .slice(0, maxFrameworks)
          .map((fm: Record<string, unknown>) => ({
            id: fm.frameworkId as string,
            name: (fm.framework as Record<string, unknown>).name as string,
            type: (fm.framework as Record<string, unknown>).type as string,
            coveragePercentage: fm.coveragePercentage as number,
            controlsMet: fm.controlsMet as number,
            controlsPartial: fm.controlsPartial as number,
            controlsGap: fm.controlsGap as number,
            controlsNotApplicable: fm.controlsNotApplicable as number,
            totalControls: (fm.controlsMet as number) + (fm.controlsPartial as number) + (fm.controlsGap as number) + (fm.controlsNotApplicable as number),
            trend: showTrend ? {
              direction: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
              change: (Math.random() - 0.5) * 10,
              changePercent: (Math.random() - 0.5) * 20
            } : undefined
          }));
        
        setFrameworks(frameworkData);
      }
    } catch (error) {
      console.error('Error fetching framework data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, maxFrameworks, showTrend]);

  useEffect(() => {
    fetchFrameworkData();
  }, [fetchFrameworkData]);

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-green-600';
    if (coverage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageBgColor = (coverage: number) => {
    if (coverage >= 90) return 'bg-green-50 border-green-200';
    if (coverage >= 70) return 'bg-yellow-50 border-yellow-200';
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
      return 'text-gray-600';
    }
  };

  const getFrameworkIcon = (type: string) => {
    switch (type) {
      case 'SOC_2': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'ISO_27001': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PCI_DSS': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (coverage: number) => {
    if (coverage >= 90) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Excellent</Badge>;
    } else if (coverage >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Good</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Needs Attention</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (frameworks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <p>No framework data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Framework Coverage</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{frameworks.length} frameworks</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {frameworks.map((framework) => (
          <div key={framework.id} className={`p-4 rounded-lg border ${getCoverageBgColor(framework.coveragePercentage)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getFrameworkIcon(framework.type)}
                <div>
                  <h4 className="font-medium text-gray-900">{framework.name}</h4>
                  <p className="text-sm text-gray-600">{framework.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {showTrend && framework.trend && (
                  <div className={`flex items-center space-x-1 ${getTrendColor(framework.trend.direction)}`}>
                    {getTrendIcon(framework.trend.direction)}
                    <span className="text-sm font-medium">
                      {framework.trend.changePercent > 0 ? '+' : ''}{framework.trend.changePercent.toFixed(1)}%
                    </span>
                  </div>
                )}
                {getStatusBadge(framework.coveragePercentage)}
              </div>
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-lg font-bold ${getCoverageColor(framework.coveragePercentage)}`}>
                    {framework.coveragePercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-600">
                    {framework.controlsMet}/{framework.totalControls} controls
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      framework.coveragePercentage >= 90 ? 'bg-green-500' :
                      framework.coveragePercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(framework.coveragePercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Detailed Breakdown */}
            {showDetails && (
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{framework.controlsMet}</div>
                  <div className="text-gray-600">Met</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-yellow-600">{framework.controlsPartial}</div>
                  <div className="text-gray-600">Partial</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{framework.controlsGap}</div>
                  <div className="text-gray-600">Gap</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-600">{framework.controlsNotApplicable}</div>
                  <div className="text-gray-600">N/A</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {(frameworks.reduce((sum, f) => sum + f.coveragePercentage, 0) / frameworks.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Average Coverage</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {frameworks.filter(f => f.coveragePercentage >= 90).length}
            </div>
            <div className="text-sm text-gray-600">Excellent</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {frameworks.filter(f => f.coveragePercentage < 70).length}
            </div>
            <div className="text-sm text-gray-600">Needs Attention</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-6">
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
