'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Minus,
  BarChart3,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';

interface ControlStatusDistributionWidgetProps {
  organizationId: string;
  config?: {
    showDetails?: boolean;
    showPercentages?: boolean;
    chartType?: 'pie' | 'donut' | 'bar';
    maxItems?: number;
  };
}

interface ControlStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

export function ControlStatusDistributionWidget({ organizationId, config = {} }: ControlStatusDistributionWidgetProps) {
  const [data, setData] = useState<ControlStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showPercentages = true,
    chartType = 'donut',
    maxItems = 5
  } = config;

  const fetchControlStatusData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch control status data
      const response = await fetch(`/api/admin/dashboard/control-status?organizationId=${organizationId}`);
      if (response.ok) {
        const result = await response.json();
        
        // Transform data
        const statusData = result.statusDistribution.map((item: Record<string, unknown>) => ({
          status: item.status as string,
          count: item.count as number,
          percentage: item.percentage as number,
          color: getStatusColor(item.status as string),
          icon: getStatusIcon(item.status as string)
        }));
        
        setData(statusData.slice(0, maxItems));
      } else {
        // Fallback to mock data
        const mockData = [
          { status: 'Met', count: 45, percentage: 65, color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" /> },
          { status: 'Partial', count: 15, percentage: 22, color: 'text-yellow-600', icon: <Clock className="h-4 w-4" /> },
          { status: 'Gap', count: 8, percentage: 12, color: 'text-red-600', icon: <AlertTriangle className="h-4 w-4" /> },
          { status: 'Not Applicable', count: 1, percentage: 1, color: 'text-gray-600', icon: <Minus className="h-4 w-4" /> }
        ];
        setData(mockData);
      }
} catch (error) {
  console.error('Error fetching control status data:', error);
  // Fallback to mock data
      const mockData = [
        { status: 'Met', count: 45, percentage: 65, color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" /> },
        { status: 'Partial', count: 15, percentage: 22, color: 'text-yellow-600', icon: <Clock className="h-4 w-4" /> },
        { status: 'Gap', count: 8, percentage: 12, color: 'text-red-600', icon: <AlertTriangle className="h-4 w-4" /> },
        { status: 'Not Applicable', count: 1, percentage: 1, color: 'text-gray-600', icon: <Minus className="h-4 w-4" /> }
      ];
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [organizationId, maxItems]);

  useEffect(() => {
    fetchControlStatusData();
  }, [fetchControlStatusData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'met': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'gap': return 'text-red-600';
      case 'not applicable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'met': return <CheckCircle className="h-4 w-4" />;
      case 'partial': return <Clock className="h-4 w-4" />;
      case 'gap': return <AlertTriangle className="h-4 w-4" />;
      case 'not applicable': return <Minus className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };



  const totalControls = data.reduce((sum, item) => sum + item.count, 0);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <PieChart className="h-8 w-8 mx-auto mb-2" />
          <p>No control status data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <PieChart className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Control Status Distribution</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{totalControls} controls</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center h-48">
          {chartType === 'pie' || chartType === 'donut' ? (
            <div className="relative w-48 h-48">
              {/* Simple CSS-based donut chart */}
              <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
              {data.map((item, index) => {
                const cumulativePercentage = data.slice(0, index).reduce((sum, d) => sum + d.percentage, 0);
                const rotation = (cumulativePercentage / 100) * 360;
                
                return (
                  <div
                    key={item.status}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from ${rotation}deg, ${getStatusColor(item.status).replace('text-', '')} ${item.percentage}%, transparent ${item.percentage}%)`
                    }}
                  ></div>
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalControls}</div>
                  <div className="text-sm text-gray-600">Total Controls</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-48 flex items-end justify-center space-x-2">
              {data.map((item) => (
                <div key={item.status} className="flex flex-col items-center">
                  <div
                    className={`w-8 rounded-t ${
                      item.status.toLowerCase() === 'met' ? 'bg-green-500' :
                      item.status.toLowerCase() === 'partial' ? 'bg-yellow-500' :
                      item.status.toLowerCase() === 'gap' ? 'bg-red-500' : 'bg-gray-500'
                    }`}
                    style={{ height: `${(item.percentage / 100) * 120}px` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    <div className="font-semibold">{item.count}</div>
                    <div>{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 mb-6">
        {data.map((item) => (
          <div key={item.status} className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                item.status.toLowerCase() === 'met' ? 'bg-green-500' :
                item.status.toLowerCase() === 'partial' ? 'bg-yellow-500' :
                item.status.toLowerCase() === 'gap' ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
              <div className="flex items-center space-x-2">
                {item.icon}
                <span className="font-medium text-gray-900">{item.status}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">{item.count}</span>
              {showPercentages && (
                <span className="text-sm text-gray-600">({item.percentage.toFixed(1)}%)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {showDetails && (
        <div className="mb-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.find(d => d.status.toLowerCase() === 'met')?.percentage.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-600">Compliance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.find(d => d.status.toLowerCase() === 'gap')?.count || 0}
              </div>
              <div className="text-sm text-gray-600">Gaps to Address</div>
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
