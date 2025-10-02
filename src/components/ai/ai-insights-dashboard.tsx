'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, AlertTriangle, TrendingUp, Lightbulb, Target, } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AIInsightsDashboardProps {
  organizationId: string;
  className?: string;
}

interface GapAnalysisResult {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendations: string[];
  priority: number;
}

interface OptimizationRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  potentialSavings: string;
  implementationEffort: string;
  impact: string;
}

interface AuditReadinessResult {
  assessment: string;
  confidence: number;
}

export function AIInsightsDashboard({ organizationId, className }: AIInsightsDashboardProps): React.JSX.Element {
  const [gaps, setGaps] = useState<GapAnalysisResult[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [auditReadiness, setAuditReadiness] = useState<AuditReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAIInsights = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load gaps analysis
      const gapsResponse = await fetch(`/api/ai/intelligence?organizationId=${organizationId}&type=gaps`);
      if (gapsResponse.ok) {
        const gapsData = await gapsResponse.json();
        setGaps(gapsData.slice(0, 5)); // Show top 5 gaps
      }

      // Load optimization recommendations
      const recommendationsResponse = await fetch(`/api/ai/intelligence?organizationId=${organizationId}&type=recommendations`);
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.slice(0, 3)); // Show top 3 recommendations
      }

      // Load audit readiness assessment
      const auditResponse = await fetch(`/api/ai/intelligence?organizationId=${organizationId}&type=audit-readiness`);
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditReadiness(auditData);
      }
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadAIInsights();
  }, [loadAIInsights]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 animate-spin" />
            <span>Loading AI insights...</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">AI Insights Dashboard</h2>
          <Badge variant="secondary">Powered by AI</Badge>
        </div>
        <Button onClick={loadAIInsights} variant="outline" size="sm">
          Refresh Insights
        </Button>
      </div>

      {/* Audit Readiness Assessment */}
      {auditReadiness && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Audit Readiness Assessment</h3>
            <Badge variant="outline" className="text-xs">
              Confidence: {Math.round(auditReadiness.confidence * 100)}%
            </Badge>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {auditReadiness.assessment}
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Gaps */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold">Critical Compliance Gaps</h3>
            <Badge variant="destructive">{gaps.length}</Badge>
          </div>
          <div className="space-y-3">
            {gaps.length === 0 ? (
              <p className="text-sm text-gray-500">No critical gaps identified</p>
            ) : (
              gaps.map((gap) => (
                <div key={gap.id} className="border-l-4 border-red-200 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{gap.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{gap.description}</p>
                    </div>
                    <Badge className={`text-xs ${getSeverityColor(gap.severity)}`}>
                      {gap.severity}
                    </Badge>
                  </div>
                  {gap.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Recommendations:</p>
                      <ul className="text-xs text-gray-600 mt-1">
                        {gap.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Optimization Recommendations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold">Optimization Opportunities</h3>
            <Badge variant="secondary">{recommendations.length}</Badge>
          </div>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-gray-500">No optimization opportunities identified</p>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.id} className="border-l-4 border-yellow-200 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Potential Savings: {rec.potentialSavings}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={`text-xs ${getImpactColor(rec.impact)}`}>
                        {rec.impact} Impact
                      </Badge>
                      <Badge className={`text-xs ${getEffortColor(rec.implementationEffort)}`}>
                        {rec.implementationEffort} Effort
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* AI Performance Metrics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">AI Performance Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">94.2%</div>
            <div className="text-sm text-gray-600">Query Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">1.2s</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">87%</div>
            <div className="text-sm text-gray-600">Confidence Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">1,247</div>
            <div className="text-sm text-gray-600">Total Queries</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
