'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare,
  Clock,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  TrendingUp } from 'lucide-react';

interface TaskManagementWidgetProps {
  organizationId: string;
  config?: {
    __showAssignees?: boolean;
    showSLA?: boolean;
    showTrend?: boolean;
    showDetails?: boolean;
  };
}

interface TaskData {
  value: number;
  metadata: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    averageCompletionTime: number;
    slaComplianceRate: number;
  };
}

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
}

export function TaskManagementWidget({ organizationId, config = {} }: TaskManagementWidgetProps) {
  const [data, setData] = useState<TaskData | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showSLA = true,
    showTrend = true
  } = config;

  const fetchTaskData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        metricType: 'TASK_PERFORMANCE',
        includeTrends: showTrend.toString()
      });

      const response = await fetch(`/api/admin/dashboard/metrics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.currentMetrics.TASK_PERFORMANCE);
        if (showTrend && result.trends) {
          setTrend(result.trends.TASK_PERFORMANCE);
        }
      }
    } catch (error) {
      console.error('Error fetching task data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, showTrend]);

  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return 'text-green-600';
    if (direction === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceBgColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-50 border-green-200';
    if (rate >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getSLAStatus = (rate: number) => {
    if (rate >= 95) return 'excellent';
    if (rate >= 85) return 'good';
    if (rate >= 70) return 'warning';
    return 'critical';
  };

  const getSLAIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getSLAColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
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
          <CheckSquare className="h-8 w-8 mx-auto mb-2" />
          <p>No task data available</p>
        </div>
      </Card>
    );
  }

  const slaStatus = getSLAStatus(data.metadata.slaComplianceRate || 0);

  return (
    <Card className={`p-6 border-2 ${getPerformanceBgColor(data.value)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Task Performance</h3>
        </div>
        {showTrend && trend && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend.direction)}`}>
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">
              {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Completion Rate */}
      <div className="mb-4">
        <div className={`text-3xl font-bold ${getPerformanceColor(data.value)} mb-1`}>
          {data.value.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">
          Completion Rate
        </div>
      </div>

      {/* Task Status Overview */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <span className="font-semibold text-green-600">
            {data.metadata.completedTasks}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <span className="font-semibold text-blue-600">
            {data.metadata.totalTasks - data.metadata.completedTasks - data.metadata.overdueTasks}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-red-600">
              {data.metadata.overdueTasks}
            </span>
            {data.metadata.overdueTasks > 0 && (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* SLA Compliance */}
      {showSLA && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">SLA Compliance</span>
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${getSLAColor(slaStatus)}`}>
                {data.metadata.slaComplianceRate?.toFixed(1) || 0}%
              </span>
              {getSLAIcon(slaStatus)}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                slaStatus === 'excellent' || slaStatus === 'good' ? 'bg-green-500' :
                slaStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(data.metadata.slaComplianceRate || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      {showDetails && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Tasks</span>
            <span className="font-medium">{data.metadata.totalTasks}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Avg. Completion Time</span>
            <span className="font-medium">
              {formatTime(data.metadata.averageCompletionTime || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overdue Rate</span>
            <span className="font-medium">
              {data.metadata.totalTasks > 0 
                ? ((data.metadata.overdueTasks / data.metadata.totalTasks) * 100).toFixed(1)
                : 0}%
            </span>
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

      {/* Status Badge */}
      <div className="mb-4">
        <Badge 
          className={
            data.value >= 90 ? 'bg-green-100 text-green-800' :
            data.value >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }
        >
          {data.value >= 90 ? (
            <><CheckSquare className="h-3 w-3 mr-1" /> Excellent
          </>
          ) : data.value >= 70 ? (
            <><Clock className="h-3 w-3 mr-1" /> Good
          </>
          ) : (
            <><AlertTriangle className="h-3 w-3 mr-1" /> Needs Attention
          </>
          )}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Tasks
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
