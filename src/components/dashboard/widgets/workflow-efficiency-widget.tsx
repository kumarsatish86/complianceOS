'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Users } from 'lucide-react';

interface WorkflowEfficiencyWidgetProps {
  organizationId: string;
  config?: {
    showBottlenecks?: boolean;
    showTrend?: boolean;
    showDetails?: boolean;
    timeframe?: '7d' | '30d' | '90d';
  };
}

interface WorkflowEfficiencyData {
  overallEfficiency: number;
  averageProcessingTime: number;
  bottleneckAnalysis: Array<{
    stage: string;
    averageTime: number;
    bottleneckScore: number;
    improvement: string;
  }>;
  resourceUtilization: Array<{
    resource: string;
    utilization: number;
    capacity: number;
    efficiency: number;
  }>;
  workflowMetrics: {
    totalWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    averageCompletionTime: number;
  };
  trendData: Array<{
    date: string;
    efficiency: number;
    processingTime: number;
    throughput: number;
  }>;
}

export function WorkflowEfficiencyWidget({ organizationId, config = {} }: WorkflowEfficiencyWidgetProps) {
  const [data, setData] = useState<WorkflowEfficiencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showBottlenecks = true,
    showTrend = true,
    timeframe = '30d'
  } = config;

  useEffect(() => {
    fetchEfficiencyData();
  }, [organizationId, timeframe]);

  const fetchEfficiencyData = async () => {
    try {
      setLoading(true);
      
      // Mock workflow efficiency data
      const mockData: WorkflowEfficiencyData = {
        overallEfficiency: 78.5,
        averageProcessingTime: 2.3, // days
        bottleneckAnalysis: [
          {
            stage: 'Initial Review',
            averageTime: 1.2,
            bottleneckScore: 85,
            improvement: 'Implement automated pre-screening'
          },
          {
            stage: 'Approval Process',
            averageTime: 0.8,
            bottleneckScore: 65,
            improvement: 'Reduce approval layers'
          },
          {
            stage: 'Final Validation',
            averageTime: 0.3,
            bottleneckScore: 25,
            improvement: 'Streamline validation criteria'
          }
        ],
        resourceUtilization: [
          {
            resource: 'Review Team',
            utilization: 85,
            capacity: 100,
            efficiency: 78
          },
          {
            resource: 'Approval Team',
            utilization: 70,
            capacity: 80,
            efficiency: 82
          },
          {
            resource: 'Validation Team',
            utilization: 60,
            capacity: 70,
            efficiency: 85
          }
        ],
        workflowMetrics: {
          totalWorkflows: 156,
          completedWorkflows: 142,
          failedWorkflows: 8,
          averageCompletionTime: 2.3
        },
        trendData: [
          { date: '2024-01-01', efficiency: 72, processingTime: 2.8, throughput: 45 },
          { date: '2024-01-08', efficiency: 75, processingTime: 2.6, throughput: 48 },
          { date: '2024-01-15', efficiency: 78, processingTime: 2.4, throughput: 52 },
          { date: '2024-01-22', efficiency: 80, processingTime: 2.3, throughput: 55 },
          { date: '2024-01-29', efficiency: 78, processingTime: 2.3, throughput: 54 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching efficiency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBgColor = (efficiency: number) => {
    if (efficiency >= 80) return 'bg-green-50 border-green-200';
    if (efficiency >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getBottleneckColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBottleneckBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Moderate</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Low</Badge>;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-green-600';
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
          <p>No workflow efficiency data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 ${getEfficiencyBgColor(data.overallEfficiency)}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Workflow Efficiency Metrics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.workflowMetrics.totalWorkflows} workflows</span>
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
        <div className="text-center">
          <div className={`text-2xl font-bold ${getEfficiencyColor(data.overallEfficiency)} mb-1`}>
            {data.overallEfficiency.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Overall Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {data.averageProcessingTime.toFixed(1)}d
          </div>
          <div className="text-sm text-gray-600">Avg. Processing Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {data.workflowMetrics.completedWorkflows}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Bottleneck Analysis */}
      {showBottlenecks && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Bottleneck Analysis</h4>
          <div className="space-y-3">
            {data.bottleneckAnalysis.map((bottleneck, index) => (
              <div key={index} className="p-3 bg-white rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{bottleneck.stage}</h5>
                  {getBottleneckBadge(bottleneck.bottleneckScore)}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average Time:</span>
                  <span className={`font-semibold ${getBottleneckColor(bottleneck.bottleneckScore)}`}>
                    {bottleneck.averageTime.toFixed(1)} days
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      bottleneck.bottleneckScore >= 80 ? 'bg-red-500' :
                      bottleneck.bottleneckScore >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(bottleneck.bottleneckScore, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-600">{bottleneck.improvement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Utilization */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Resource Utilization</h4>
        <div className="space-y-2">
          {data.resourceUtilization.map((resource, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{resource.resource}</div>
                  <div className="text-xs text-gray-500">
                    Capacity: {resource.capacity} | Efficiency: {resource.efficiency}%
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold ${getUtilizationColor(resource.utilization)}`}>
                  {resource.utilization}%
                </span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      resource.utilization >= 90 ? 'bg-red-500' :
                      resource.utilization >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Metrics */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Workflow Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-lg font-bold text-blue-600">{data.workflowMetrics.totalWorkflows}</div>
              <div className="text-sm text-gray-600">Total Workflows</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-lg font-bold text-red-600">{data.workflowMetrics.failedWorkflows}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {showTrend && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Efficiency Trend</h4>
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.trendData.map((point) => (
              <div key={point.date} className="flex flex-col items-center">
                <div
                  className="w-6 bg-blue-500 rounded-t"
                  style={{ height: `${(point.efficiency / 100) * 80}px` }}
                  title={`Efficiency: ${point.efficiency}%`}
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
        {data.overallEfficiency >= 80 ? (
          <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Excellent</Badge>
        ) : data.overallEfficiency >= 60 ? (
          <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Good</Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Needs Improvement</Badge>
        )}
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
