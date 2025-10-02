'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp,
  TrendingDown,
  BarChart3,
  ExternalLink,
  Download } from 'lucide-react';

interface TrendAnalysisWidgetProps {
  organizationId: string;
  config?: {
    timeframe?: '7d' | '30d' | '90d' | '1y';
    chartType?: 'line' | 'area';
    showMultipleMetrics?: boolean;
    showDetails?: boolean;
  };
}

interface TrendData {
  date: string;
  complianceScore: number;
  evidenceHealth: number;
  taskPerformance: number;
  auditReadiness: number;
}

export function TrendAnalysisWidget({ organizationId, config = {} }: TrendAnalysisWidgetProps) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    timeframe = '30d',
    chartType = 'line',
    showMultipleMetrics = true
  } = config;

  useEffect(() => {
    fetchTrendData();
  }, [organizationId, timeframe]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      
      // Mock trend data
      const mockData: TrendData[] = [
        { date: '2024-01-01', complianceScore: 75, evidenceHealth: 80, taskPerformance: 85, auditReadiness: 70 },
        { date: '2024-01-08', complianceScore: 78, evidenceHealth: 82, taskPerformance: 87, auditReadiness: 72 },
        { date: '2024-01-15', complianceScore: 82, evidenceHealth: 85, taskPerformance: 89, auditReadiness: 75 },
        { date: '2024-01-22', complianceScore: 85, evidenceHealth: 87, taskPerformance: 91, auditReadiness: 78 },
        { date: '2024-01-29', complianceScore: 88, evidenceHealth: 90, taskPerformance: 93, auditReadiness: 82 },
        { date: '2024-02-05', complianceScore: 90, evidenceHealth: 92, taskPerformance: 95, auditReadiness: 85 },
        { date: '2024-02-12', complianceScore: 92, evidenceHealth: 94, taskPerformance: 96, auditReadiness: 87 },
        { date: '2024-02-19', complianceScore: 94, evidenceHealth: 96, taskPerformance: 97, auditReadiness: 89 },
        { date: '2024-02-26', complianceScore: 96, evidenceHealth: 98, taskPerformance: 98, auditReadiness: 91 },
        { date: '2024-03-05', complianceScore: 98, evidenceHealth: 99, taskPerformance: 99, auditReadiness: 93 }
      ];
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (data: TrendData[], metric: keyof TrendData) => {
    if (data.length < 2) return { direction: 'stable', change: 0, changePercent: 0 };
    
    const firstValue = data[0][metric] as number;
    const lastValue = data[data.length - 1][metric] as number;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change,
      changePercent
    };
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
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
          <TrendingUp className="h-8 w-8 mx-auto mb-2" />
          <p>No trend data available</p>
        </div>
      </Card>
    );
  }

  const complianceTrend = calculateTrend(data, 'complianceScore');
  const evidenceTrend = calculateTrend(data, 'evidenceHealth');
  const taskTrend = calculateTrend(data, 'taskPerformance');
  const auditTrend = calculateTrend(data, 'auditReadiness');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Trend Analysis</h3>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={() => {/* Handle timeframe change */}}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="1y">1 year</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-white rounded border">
          <div className="flex items-center justify-center space-x-1 mb-1">
            {getTrendIcon(complianceTrend.direction)}
            <span className={`text-sm font-medium ${getTrendColor(complianceTrend.direction)}`}>
              {complianceTrend.changePercent > 0 ? '+' : ''}{complianceTrend.changePercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">Compliance Score</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="flex items-center justify-center space-x-1 mb-1">
            {getTrendIcon(evidenceTrend.direction)}
            <span className={`text-sm font-medium ${getTrendColor(evidenceTrend.direction)}`}>
              {evidenceTrend.changePercent > 0 ? '+' : ''}{evidenceTrend.changePercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">Evidence Health</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="flex items-center justify-center space-x-1 mb-1">
            {getTrendIcon(taskTrend.direction)}
            <span className={`text-sm font-medium ${getTrendColor(taskTrend.direction)}`}>
              {taskTrend.changePercent > 0 ? '+' : ''}{taskTrend.changePercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">Task Performance</div>
        </div>
        <div className="text-center p-3 bg-white rounded border">
          <div className="flex items-center justify-center space-x-1 mb-1">
            {getTrendIcon(auditTrend.direction)}
            <span className={`text-sm font-medium ${getTrendColor(auditTrend.direction)}`}>
              {auditTrend.changePercent > 0 ? '+' : ''}{auditTrend.changePercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">Audit Readiness</div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value: unknown, name: string) => [
                    `${(value as number).toFixed(1)}%`,
                    name.replace(/([A-Z])/g, ' $1').trim()
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="complianceScore" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Compliance Score"
                />
                {showMultipleMetrics && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="evidenceHealth" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Evidence Health"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="taskPerformance" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Task Performance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="auditReadiness" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Audit Readiness"
                    />
                  </>
                )}
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value: unknown, name: string) => [
                    `${(value as number).toFixed(1)}%`,
                    name.replace(/([A-Z])/g, ' $1').trim()
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="complianceScore" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Compliance Score"
                />
                {showMultipleMetrics && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="evidenceHealth" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Evidence Health"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="taskPerformance" 
                      stackId="3"
                      stroke="#F59E0B" 
                      fill="#F59E0B"
                      fillOpacity={0.6}
                      name="Task Performance"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="auditReadiness" 
                      stackId="4"
                      stroke="#EF4444" 
                      fill="#EF4444"
                      fillOpacity={0.6}
                      name="Audit Readiness"
                    />
                  </>
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="mb-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data[data.length - 1].complianceScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Current Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {complianceTrend.changePercent > 0 ? '+' : ''}{complianceTrend.changePercent.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Improvement</div>
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
