'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line } from 'recharts';
import { TrendingDown,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Eye,
  EyeOff,
  Users,
  Target, } from 'lucide-react';

interface ComparativeAnalyticsWidgetProps {
  organizationId: string;
  config?: {
    showBenchmarks?: boolean;
    showTrends?: boolean;
    showDetails?: boolean;
    comparisonPeriod?: 'quarter' | 'year' | 'custom';
  };
}

interface ComparativeAnalyticsData {
  currentPeriod: {
    complianceScore: number;
    evidenceCount: number;
    auditCount: number;
    findingsCount: number;
    riskScore: number;
  };
  previousPeriod: {
    complianceScore: number;
    evidenceCount: number;
    auditCount: number;
    findingsCount: number;
    riskScore: number;
  };
  industryBenchmarks: {
    complianceScore: number;
    evidenceCount: number;
    auditCount: number;
    findingsCount: number;
    riskScore: number;
  };
  performanceComparison: Array<{
    metric: string;
    current: number;
    previous: number;
    benchmark: number;
    change: number;
    changePercent: number;
    status: 'improving' | 'declining' | 'stable';
  }>;
  trendAnalysis: Array<{
    period: string;
    complianceScore: number;
    evidenceCount: number;
    auditCount: number;
    findingsCount: number;
    riskScore: number;
  }>;
  frameworkComparison: Array<{
    framework: string;
    currentScore: number;
    previousScore: number;
    benchmarkScore: number;
    trend: number;
  }>;
  departmentComparison: Array<{
    department: string;
    complianceScore: number;
    evidenceCount: number;
    auditCount: number;
    findingsCount: number;
  }>;
}


export function ComparativeAnalyticsWidget({ organizationId, config = {} }: ComparativeAnalyticsWidgetProps) {
  const [data, setData] = useState<ComparativeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showBenchmarks = true,
    showTrends = true,
    comparisonPeriod = 'quarter'
  } = config;

  useEffect(() => {
    fetchComparativeData();
  }, [organizationId, comparisonPeriod]);

  const fetchComparativeData = async () => {
    try {
      setLoading(true);
      
      // Mock comparative analytics data
      const mockData: ComparativeAnalyticsData = {
        currentPeriod: {
          complianceScore: 87.5,
          evidenceCount: 156,
          auditCount: 3,
          findingsCount: 12,
          riskScore: 6.8
        },
        previousPeriod: {
          complianceScore: 82.3,
          evidenceCount: 142,
          auditCount: 2,
          findingsCount: 18,
          riskScore: 7.2
        },
        industryBenchmarks: {
          complianceScore: 85.0,
          evidenceCount: 148,
          auditCount: 2.5,
          findingsCount: 15,
          riskScore: 6.5
        },
        performanceComparison: [
          {
            metric: 'Compliance Score',
            current: 87.5,
            previous: 82.3,
            benchmark: 85.0,
            change: 5.2,
            changePercent: 6.3,
            status: 'improving'
          },
          {
            metric: 'Evidence Count',
            current: 156,
            previous: 142,
            benchmark: 148,
            change: 14,
            changePercent: 9.9,
            status: 'improving'
          },
          {
            metric: 'Audit Count',
            current: 3,
            previous: 2,
            benchmark: 2.5,
            change: 1,
            changePercent: 50.0,
            status: 'improving'
          },
          {
            metric: 'Findings Count',
            current: 12,
            previous: 18,
            benchmark: 15,
            change: -6,
            changePercent: -33.3,
            status: 'improving'
          },
          {
            metric: 'Risk Score',
            current: 6.8,
            previous: 7.2,
            benchmark: 6.5,
            change: -0.4,
            changePercent: -5.6,
            status: 'improving'
          }
        ],
        trendAnalysis: [
          { period: 'Q1 2023', complianceScore: 78, evidenceCount: 120, auditCount: 1, findingsCount: 25, riskScore: 7.8 },
          { period: 'Q2 2023', complianceScore: 80, evidenceCount: 128, auditCount: 1, findingsCount: 22, riskScore: 7.5 },
          { period: 'Q3 2023', complianceScore: 82, evidenceCount: 135, auditCount: 2, findingsCount: 20, riskScore: 7.3 },
          { period: 'Q4 2023', complianceScore: 82.3, evidenceCount: 142, auditCount: 2, findingsCount: 18, riskScore: 7.2 },
          { period: 'Q1 2024', complianceScore: 87.5, evidenceCount: 156, auditCount: 3, findingsCount: 12, riskScore: 6.8 }
        ],
        frameworkComparison: [
          {
            framework: 'SOC 2',
            currentScore: 95,
            previousScore: 89,
            benchmarkScore: 92,
            trend: 6.7
          },
          {
            framework: 'ISO 27001',
            currentScore: 87,
            previousScore: 82,
            benchmarkScore: 85,
            trend: 6.1
          },
          {
            framework: 'PCI DSS',
            currentScore: 82,
            previousScore: 78,
            benchmarkScore: 80,
            trend: 5.1
          }
        ],
        departmentComparison: [
          {
            department: 'IT Security',
            complianceScore: 92,
            evidenceCount: 45,
            auditCount: 2,
            findingsCount: 3
          },
          {
            department: 'HR',
            complianceScore: 85,
            evidenceCount: 28,
            auditCount: 1,
            findingsCount: 2
          },
          {
            department: 'Finance',
            complianceScore: 88,
            evidenceCount: 32,
            auditCount: 1,
            findingsCount: 4
          },
          {
            department: 'Operations',
            complianceScore: 82,
            evidenceCount: 35,
            auditCount: 1,
            findingsCount: 3
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching comparative data:', error);
    } finally {
      setLoading(false);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improving': return <Badge className="bg-green-100 text-green-800"><TrendingUp className="h-3 w-3 mr-1" />Improving</Badge>;
      case 'declining': return <Badge className="bg-red-100 text-red-800"><TrendingDown className="h-3 w-3 mr-1" />Declining</Badge>;
      case 'stable': return <Badge className="bg-gray-100 text-gray-800"><Target className="h-3 w-3 mr-1" />Stable</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
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
          <p>No comparative analytics data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Comparative Analytics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={comparisonPeriod}
            onChange={() => {/* Handle period change */}}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
            <option value="custom">Custom</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Comparison</h4>
        <div className="space-y-3">
          {data.performanceComparison.map((metric, index) => (
            <div key={index} className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{metric.metric}</h5>
                {getStatusBadge(metric.status)}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{metric.current.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">Current</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">{metric.previous.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">Previous</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{metric.benchmark.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">Benchmark</div>
                </div>
              </div>
              <div className="flex items-center justify-center mt-2">
                <div className={`flex items-center space-x-1 ${getChangeColor(metric.change)}`}>
                  {getChangeIcon(metric.change)}
                  <span className="text-sm font-medium">
                    {metric.change > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Framework Comparison */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Framework Performance</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.frameworkComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="framework" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="currentScore" fill="#3B82F6" name="Current" />
              <Bar dataKey="previousScore" fill="#10B981" name="Previous" />
              <Bar dataKey="benchmarkScore" fill="#F59E0B" name="Benchmark" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Comparison */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Department Performance</h4>
          <div className="space-y-2">
            {data.departmentComparison.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{dept.department}</div>
                    <div className="text-xs text-gray-500">
                      {dept.evidenceCount} evidence • {dept.auditCount} audits • {dept.findingsCount} findings
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{dept.complianceScore}%</div>
                  <div className="text-xs text-gray-500">compliance</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      {showTrends && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Trend Analysis</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="complianceScore" stroke="#3B82F6" strokeWidth={2} name="Compliance Score" />
                <Line type="monotone" dataKey="evidenceCount" stroke="#10B981" strokeWidth={2} name="Evidence Count" />
                <Line type="monotone" dataKey="auditCount" stroke="#F59E0B" strokeWidth={2} name="Audit Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Benchmark Comparison */}
      {showBenchmarks && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Industry Benchmark Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {data.currentPeriod.complianceScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Your Compliance</div>
              <div className="text-xs text-gray-500">
                vs {data.industryBenchmarks.complianceScore}% industry avg
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {data.currentPeriod.evidenceCount}
              </div>
              <div className="text-sm text-gray-600">Your Evidence</div>
              <div className="text-xs text-gray-500">
                vs {data.industryBenchmarks.evidenceCount} industry avg
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {data.currentPeriod.auditCount}
              </div>
              <div className="text-sm text-gray-600">Your Audits</div>
              <div className="text-xs text-gray-500">
                vs {data.industryBenchmarks.auditCount} industry avg
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {data.currentPeriod.findingsCount}
              </div>
              <div className="text-sm text-gray-600">Your Findings</div>
              <div className="text-xs text-gray-500">
                vs {data.industryBenchmarks.findingsCount} industry avg
              </div>
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
