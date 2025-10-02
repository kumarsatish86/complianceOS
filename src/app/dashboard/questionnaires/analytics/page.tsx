'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3,
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Target,
  Award,
  RefreshCw } from 'lucide-react';

interface QuestionnaireAnalytics {
  overview: {
    totalQuestionnaires: number;
    completedQuestionnaires: number;
    inProgressQuestionnaires: number;
    averageCompletionTime: number;
    totalQuestionsAnswered: number;
    averageQuestionsPerQuestionnaire: number;
  };
  trends: {
    questionnairesByMonth: Array<{
      month: string;
      count: number;
      completed: number;
    }>;
    completionRates: Array<{
      period: string;
      rate: number;
    }>;
  };
  performance: {
    topPerformers: Array<{
      userId: string;
      userName: string;
      questionnairesCompleted: number;
      averageCompletionTime: number;
    }>;
    slowestQuestionnaires: Array<{
      questionnaireId: string;
      title: string;
      daysInProgress: number;
      completionPercentage: number;
    }>;
  };
  insights: {
    mostCommonQuestionTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    mostUsedAnswerLibraryEntries: Array<{
      entryId: string;
      category: string;
      usageCount: number;
      confidenceScore: number;
    }>;
    frameworkDistribution: Array<{
      framework: string;
      count: number;
      percentage: number;
    }>;
  };
  quality: {
    averageConfidenceScore: number;
    answerQualityTrends: Array<{
      period: string;
      averageConfidence: number;
      totalAnswers: number;
    }>;
    reviewEfficiency: {
      averageReviewTime: number;
      approvalRate: number;
      rejectionRate: number;
    };
  };
}

interface RealTimeMetrics {
  activeQuestionnaires: number;
  pendingReviews: number;
  completedToday: number;
  averageCompletionTime: number;
}

export default function QuestionnaireAnalyticsPage() {
  const [analytics, setAnalytics] = useState<QuestionnaireAnalytics | null>(null);
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch analytics
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const [analyticsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/admin/questionnaires/analytics?${params}`),
        fetch('/api/admin/questionnaires/metrics')
      ]);
      
      const analyticsData = await analyticsResponse.json();
      const metricsData = await metricsResponse.json();
      
      setAnalytics(analyticsData.analytics);
      setMetrics(metricsData.metrics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [dateRange, fetchData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getCompletionRate = () => {
    if (!analytics) return 0;
    return analytics.overview.totalQuestionnaires > 0
      ? (analytics.overview.completedQuestionnaires / analytics.overview.totalQuestionnaires) * 100
      : 0;
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading analytics...</p>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Questionnaire Analytics</h1>
            <p className="text-gray-600 mt-2">
              Insights and performance metrics for security questionnaires
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Questionnaires</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeQuestionnaires}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.pendingReviews}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.completedToday}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Completion Time</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.averageCompletionTime)} days</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Overview Stats */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Questionnaires</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalQuestionnaires}</p>
                  </div>
                  <BarChart3 className="h-12 w-12 text-blue-600" />
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Completion Rate</span>
                    <span>{Math.round(getCompletionRate())}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCompletionRate()}%` }}
                    ></div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalQuestionsAnswered}</p>
                  </div>
                  <Target className="h-12 w-12 text-green-600" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Avg {Math.round(analytics.overview.averageQuestionsPerQuestionnaire)} questions per questionnaire
                  </p>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Completion Time</p>
                    <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.overview.averageCompletionTime)} days</p>
                  </div>
                  <Clock className="h-12 w-12 text-purple-600" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    {analytics.overview.completedQuestionnaires} completed questionnaires
                  </p>
                </div>
              </Card>
            </div>

            {/* Performance Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Performers */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-600" />
                  Top Performers
                </h3>
                <div className="space-y-3">
                  {analytics.performance.topPerformers.map((performer, index) => (
                    <div key={performer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{performer.userName}</p>
                          <p className="text-sm text-gray-600">{performer.questionnairesCompleted} completed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{Math.round(performer.averageCompletionTime)} days</p>
                        <p className="text-xs text-gray-600">avg time</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Slowest Questionnaires */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-red-600" />
                  Slowest Questionnaires
                </h3>
                <div className="space-y-3">
                  {analytics.performance.slowestQuestionnaires.map((questionnaire) => (
                    <div key={questionnaire.questionnaireId} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 truncate">{questionnaire.title}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">{questionnaire.daysInProgress} days in progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(questionnaire.completionPercentage)}% complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Question Types */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Question Types</h3>
                <div className="space-y-2">
                  {analytics.insights.mostCommonQuestionTypes.map((type) => (
                    <div key={type.type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{type.type.replace('_', ' ')}</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${type.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{type.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Answer Library Usage */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Answer Library Usage</h3>
                <div className="space-y-2">
                  {analytics.insights.mostUsedAnswerLibraryEntries.map((entry) => (
                    <div key={entry.entryId} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{entry.category.replace('_', ' ')}</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{entry.usageCount}</span>
                        <span className="text-xs text-gray-500">({entry.confidenceScore}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Framework Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Framework Distribution</h3>
                <div className="space-y-2">
                  {analytics.insights.frameworkDistribution.map((framework) => (
                    <div key={framework.framework} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{framework.framework}</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${framework.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{framework.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quality Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Confidence Score</span>
                    <span className="text-lg font-bold text-gray-900">{Math.round(analytics.quality.averageConfidenceScore)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approval Rate</span>
                    <span className="text-lg font-bold text-green-600">{Math.round(analytics.quality.reviewEfficiency.approvalRate)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejection Rate</span>
                    <span className="text-lg font-bold text-red-600">{Math.round(analytics.quality.reviewEfficiency.rejectionRate)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Review Time</span>
                    <span className="text-lg font-bold text-gray-900">{Math.round(analytics.quality.reviewEfficiency.averageReviewTime)} hours</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
                <div className="space-y-2">
                  {analytics.trends.questionnairesByMonth.slice(-6).map((trend) => (
                    <div key={trend.month} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{formatDate(trend.month + '-01')}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">{trend.completed}/{trend.count}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${trend.count > 0 ? (trend.completed / trend.count) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </PlatformAdminLayout>
  );
}
