'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  Eye,
  EyeOff,
  TrendingUp } from 'lucide-react';

interface AuditReadinessScorecardWidgetProps {
  organizationId: string;
  config?: {
    showDetails?: boolean;
    showEvidence?: boolean;
    showTrend?: boolean;
  };
}

interface AuditReadinessData {
  overallReadiness: number;
  activeAudits: number;
  readyAudits: number;
  auditBreakdown: Array<{
    id: string;
    name: string;
    type: string;
    readiness: number;
    controls: number;
    evidenceLinked: number;
    status: 'ready' | 'in_progress' | 'not_ready';
    dueDate: string;
  }>;
  evidenceStatus: {
    totalRequired: number;
    collected: number;
    pending: number;
    expired: number;
  };
  controlStatus: {
    totalControls: number;
    readyControls: number;
    partialControls: number;
    gapControls: number;
  };
  readinessFactors: Array<{
    factor: string;
    score: number;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}

export function AuditReadinessScorecardWidget({ organizationId, config = {} }: AuditReadinessScorecardWidgetProps) {
  const [data, setData] = useState<AuditReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);

  const {
    showEvidence = true
  } = config;

  useEffect(() => {
    fetchAuditReadinessData();
  }, [organizationId]);

  const fetchAuditReadinessData = async () => {
    try {
      setLoading(true);
      
      // Mock audit readiness data
      const mockData: AuditReadinessData = {
        overallReadiness: 82.5,
        activeAudits: 3,
        readyAudits: 2,
        auditBreakdown: [
          {
            id: 'audit1',
            name: 'SOC 2 Type II',
            type: 'SOC_2',
            readiness: 95,
            controls: 50,
            evidenceLinked: 48,
            status: 'ready',
            dueDate: '2024-03-15'
          },
          {
            id: 'audit2',
            name: 'ISO 27001',
            type: 'ISO_27001',
            readiness: 78,
            controls: 40,
            evidenceLinked: 31,
            status: 'in_progress',
            dueDate: '2024-04-20'
          },
          {
            id: 'audit3',
            name: 'PCI DSS',
            type: 'PCI_DSS',
            readiness: 65,
            controls: 35,
            evidenceLinked: 23,
            status: 'not_ready',
            dueDate: '2024-05-10'
          }
        ],
        evidenceStatus: {
          totalRequired: 125,
          collected: 102,
          pending: 18,
          expired: 5
        },
        controlStatus: {
          totalControls: 125,
          readyControls: 102,
          partialControls: 15,
          gapControls: 8
        },
        readinessFactors: [
          {
            factor: 'Evidence Collection',
            score: 85,
            impact: 'high',
            recommendation: 'Complete pending evidence collection for 18 items'
          },
          {
            factor: 'Control Implementation',
            score: 78,
            impact: 'high',
            recommendation: 'Address 8 control gaps before audit'
          },
          {
            factor: 'Documentation',
            score: 92,
            impact: 'medium',
            recommendation: 'Update 3 outdated policy documents'
          },
          {
            factor: 'Training Completion',
            score: 88,
            impact: 'medium',
            recommendation: 'Complete security awareness training for 12 users'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching audit readiness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 90) return 'text-green-600';
    if (readiness >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReadinessBgColor = (readiness: number) => {
    if (readiness >= 90) return 'bg-green-50 border-green-200';
    if (readiness >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'not_ready': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Not Ready</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };


  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High Impact</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Impact</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low Impact</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
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
          <ClipboardCheck className="h-8 w-8 mx-auto mb-2" />
          <p>No audit readiness data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 ${getReadinessBgColor(data.overallReadiness)}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Audit Readiness Scorecard</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.activeAudits} active audits</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Overall Readiness Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Overall Readiness</h4>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{data.readyAudits}/{data.activeAudits} ready</span>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </div>
        <div className={`text-4xl font-bold ${getReadinessColor(data.overallReadiness)} mb-2`}>
          {data.overallReadiness.toFixed(1)}%
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              data.overallReadiness >= 90 ? 'bg-green-500' :
              data.overallReadiness >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(data.overallReadiness, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Audit Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Audit Status</h4>
        <div className="space-y-3">
          {data.auditBreakdown.map((audit) => (
            <div key={audit.id} className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h5 className="font-medium text-gray-900">{audit.name}</h5>
                </div>
                {getStatusBadge(audit.status)}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Readiness:</span>
                <span className={`font-semibold ${getReadinessColor(audit.readiness)}`}>
                  {audit.readiness.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Evidence:</span>
                <span className="text-sm font-medium text-gray-900">
                  {audit.evidenceLinked}/{audit.controls} controls
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className="text-sm font-medium text-gray-900">{audit.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Status */}
      {showEvidence && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Evidence Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-green-600">{data.evidenceStatus.collected}</div>
              <div className="text-sm text-gray-600">Collected</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-yellow-600">{data.evidenceStatus.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600">{data.evidenceStatus.totalRequired}</div>
              <div className="text-sm text-gray-600">Total Required</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-red-600">{data.evidenceStatus.expired}</div>
              <div className="text-sm text-gray-600">Expired</div>
            </div>
          </div>
        </div>
      )}

      {/* Control Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Control Status</h4>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">{data.controlStatus.readyControls}</div>
            <div className="text-xs text-gray-600">Ready</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-lg font-bold text-yellow-600">{data.controlStatus.partialControls}</div>
            <div className="text-xs text-gray-600">Partial</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-lg font-bold text-red-600">{data.controlStatus.gapControls}</div>
            <div className="text-xs text-gray-600">Gap</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{data.controlStatus.totalControls}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Readiness Factors */}
      {showDetails && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Readiness Factors</h4>
          <div className="space-y-2">
            {data.readinessFactors.map((factor, index) => (
              <div key={index} className="p-3 bg-white rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{factor.factor}</h5>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${getReadinessColor(factor.score)}`}>
                      {factor.score.toFixed(1)}%
                    </span>
                    {getImpactBadge(factor.impact)}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      factor.score >= 90 ? 'bg-green-500' :
                      factor.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(factor.score, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-600">{factor.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-6">
        {data.overallReadiness >= 90 ? (
          <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Audit Ready</Badge>
        ) : data.overallReadiness >= 70 ? (
          <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Almost Ready</Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Needs Work</Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
