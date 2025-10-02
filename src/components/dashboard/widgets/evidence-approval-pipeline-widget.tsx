'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, 
  Clock, 
  AlertTriangle, 
  User,
  FileText,
  ExternalLink,
  Eye,
  EyeOff } from 'lucide-react';

interface EvidenceApprovalPipelineWidgetProps {
  organizationId: string;
  config?: {
    showBacklog?: boolean;
    showAssignees?: boolean;
    showTrend?: boolean;
    showDetails?: boolean;
  };
}

interface ApprovalPipelineData {
  totalPending: number;
  backlogByStage: {
    draft: number;
    review: number;
    approval: number;
    final: number;
  };
  averageProcessingTime: number;
  slaCompliance: number;
  approverWorkload: Array<{
    id: string;
    name: string;
    pendingCount: number;
    completedToday: number;
    averageTime: number;
  }>;
  agingAnalysis: {
    lessThan24h: number;
    lessThan72h: number;
    lessThan1Week: number;
    moreThan1Week: number;
  };
  trendData: Array<{
    date: string;
    pending: number;
    completed: number;
    averageTime: number;
  }>;
}

export function EvidenceApprovalPipelineWidget({ organizationId, config = {} }: EvidenceApprovalPipelineWidgetProps) {
  const [data, setData] = useState<ApprovalPipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showBacklog = true,
    showAssignees = true,
    showTrend = true
  } = config;

  useEffect(() => {
    fetchApprovalData();
  }, [organizationId]);

  const fetchApprovalData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockData: ApprovalPipelineData = {
        totalPending: 23,
        backlogByStage: {
          draft: 5,
          review: 8,
          approval: 7,
          final: 3
        },
        averageProcessingTime: 2.5, // days
        slaCompliance: 87.5,
        approverWorkload: [
          { id: 'user1', name: 'John Smith', pendingCount: 8, completedToday: 3, averageTime: 1.8 },
          { id: 'user2', name: 'Sarah Johnson', pendingCount: 6, completedToday: 2, averageTime: 2.2 },
          { id: 'user3', name: 'Mike Wilson', pendingCount: 5, completedToday: 4, averageTime: 1.5 },
          { id: 'user4', name: 'Lisa Brown', pendingCount: 4, completedToday: 1, averageTime: 3.1 }
        ],
        agingAnalysis: {
          lessThan24h: 8,
          lessThan72h: 7,
          lessThan1Week: 5,
          moreThan1Week: 3
        },
        trendData: [
          { date: '2024-01-01', pending: 18, completed: 12, averageTime: 2.8 },
          { date: '2024-01-08', pending: 22, completed: 15, averageTime: 2.5 },
          { date: '2024-01-15', pending: 23, completed: 18, averageTime: 2.5 },
          { date: '2024-01-22', pending: 20, completed: 16, averageTime: 2.3 },
          { date: '2024-01-29', pending: 23, completed: 14, averageTime: 2.5 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSlaColor = (compliance: number) => {
    if (compliance >= 90) return 'text-green-600';
    if (compliance >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSlaBgColor = (compliance: number) => {
    if (compliance >= 90) return 'bg-green-50 border-green-200';
    if (compliance >= 80) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getAgingColor = (count: number, total: number) => {
    const percentage = (count / total) * 100;
    if (percentage >= 50) return 'text-red-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };


  const getWorkloadColor = (count: number) => {
    if (count >= 8) return 'text-red-600';
    if (count >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getWorkloadBadge = (count: number) => {
    if (count >= 8) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
    } else if (count >= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Medium</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Low</Badge>;
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
          <CheckCircle className="h-8 w-8 mx-auto mb-2" />
          <p>No approval pipeline data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 ${getSlaBgColor(data.slaCompliance)}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Evidence Approval Pipeline</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.totalPending} pending</span>
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
          <div className="text-2xl font-bold text-blue-600 mb-1">{data.totalPending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getSlaColor(data.slaCompliance)} mb-1`}>
            {data.averageProcessingTime.toFixed(1)}d
          </div>
          <div className="text-sm text-gray-600">Avg. Time</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getSlaColor(data.slaCompliance)} mb-1`}>
            {data.slaCompliance.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">SLA Compliance</div>
        </div>
      </div>

      {/* Pipeline Stages */}
      {showBacklog && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Pipeline Stages</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 bg-gray-50 rounded border">
              <div className="text-lg font-bold text-gray-600">{data.backlogByStage.draft}</div>
              <div className="text-xs text-gray-600">Draft</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded border">
              <div className="text-lg font-bold text-yellow-600">{data.backlogByStage.review}</div>
              <div className="text-xs text-gray-600">Review</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded border">
              <div className="text-lg font-bold text-blue-600">{data.backlogByStage.approval}</div>
              <div className="text-xs text-gray-600">Approval</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded border">
              <div className="text-lg font-bold text-green-600">{data.backlogByStage.final}</div>
              <div className="text-xs text-gray-600">Final</div>
            </div>
          </div>
        </div>
      )}

      {/* Aging Analysis */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Aging Analysis</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Less than 24 hours</span>
            </div>
            <span className={`font-semibold ${getAgingColor(data.agingAnalysis.lessThan24h, data.totalPending)}`}>
              {data.agingAnalysis.lessThan24h}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Less than 72 hours</span>
            </div>
            <span className={`font-semibold ${getAgingColor(data.agingAnalysis.lessThan72h, data.totalPending)}`}>
              {data.agingAnalysis.lessThan72h}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Less than 1 week</span>
            </div>
            <span className={`font-semibold ${getAgingColor(data.agingAnalysis.lessThan1Week, data.totalPending)}`}>
              {data.agingAnalysis.lessThan1Week}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-700">More than 1 week</span>
            </div>
            <span className={`font-semibold ${getAgingColor(data.agingAnalysis.moreThan1Week, data.totalPending)}`}>
              {data.agingAnalysis.moreThan1Week}
            </span>
          </div>
        </div>
      </div>

      {/* Approver Workload */}
      {showAssignees && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Approver Workload</h4>
          <div className="space-y-2">
            {data.approverWorkload.slice(0, showDetails ? 4 : 2).map((approver) => (
              <div key={approver.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{approver.name}</div>
                    <div className="text-xs text-gray-500">
                      Completed today: {approver.completedToday} | Avg. time: {approver.averageTime.toFixed(1)}d
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${getWorkloadColor(approver.pendingCount)}`}>
                    {approver.pendingCount}
                  </span>
                  {getWorkloadBadge(approver.pendingCount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {showTrend && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Processing Trend</h4>
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.trendData.map((point) => (
              <div key={point.date} className="flex flex-col items-center">
                <div className="flex space-x-1 mb-1">
                  <div
                    className="w-3 bg-blue-500 rounded-t"
                    style={{ height: `${(point.pending / 30) * 60}px` }}
                    title={`Pending: ${point.pending}`}
                  ></div>
                  <div
                    className="w-3 bg-green-500 rounded-t"
                    style={{ height: `${(point.completed / 20) * 60}px` }}
                    title={`Completed: ${point.completed}`}
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
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">Pending</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-6">
        {data.slaCompliance >= 90 ? (
          <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Excellent</Badge>
        ) : data.slaCompliance >= 80 ? (
          <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Good</Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Needs Attention</Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          View Pipeline
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
