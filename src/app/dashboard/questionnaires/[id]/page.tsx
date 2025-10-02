'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft,
  Save,
  Send,
  Lightbulb,
  Edit,
  Download,
  RefreshCw } from 'lucide-react';

interface QuestionWithAnswer {
  id: string;
  section?: string;
  subsection?: string;
  orderIndex: number;
  questionText: string;
  questionType: string;
  optionsJson?: Record<string, unknown>;
  requiredFlag: boolean;
  controlMapping: string[];
  riskLevel?: string;
  keywordsExtracted: string[];
  dependencies?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  answer?: {
    id: string;
    draftText?: string;
    finalText?: string;
    evidenceIds: string[];
    status: string;
    confidenceScore?: number;
    reviewerId?: string;
    approverId?: string;
    submittedAt?: string;
    approvedAt?: string;
    rejectionReason?: string;
    revisionNotes?: string;
    sourceLibraryId?: string;
  };
  suggestions?: Array<{
    suggestedAnswer: string;
    confidenceScore: number;
    sourceType: string;
    sourceId?: string;
    evidenceIds: string[];
    reasoning: string;
    metadata?: Record<string, unknown>;
  }>;
}

interface QuestionnaireDetails {
  questionnaire: {
    id: string;
    title: string;
    description?: string;
    clientName?: string;
    status: string;
    priority: number;
    dueDate?: string;
    totalQuestions: number;
    completedQuestions: number;
    uploadedBy: string;
    uploadedByName: string;
    assignee?: string;
    assigneeName?: string;
    createdAt: string;
    updatedAt: string;
  };
  questions: QuestionWithAnswer[];
}

export default function QuestionnaireDetailsPage() {
  const params = useParams();
  const questionnaireId = params.id as string;
  
  const [details, setDetails] = useState<QuestionnaireDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAnswers, setSavingAnswers] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});

  const fetchQuestionnaireDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/questionnaires/${questionnaireId}?includeSuggestions=true`);
      const data = await response.json();
      setDetails(data);
      
      // Initialize answers from existing data
      const initialAnswers: Record<string, string> = {};
      data.questions.forEach((q: QuestionWithAnswer) => {
        if (q.answer?.draftText) {
          initialAnswers[q.id] = q.answer.draftText;
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching questionnaire details:', error);
    } finally {
      setLoading(false);
    }
  }, [questionnaireId]);

  useEffect(() => {
    fetchQuestionnaireDetails();
  }, [questionnaireId, fetchQuestionnaireDetails]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const saveAnswer = async (questionId: string) => {
    try {
      setSavingAnswers(prev => new Set(prev).add(questionId));
      
      const response = await fetch(`/api/admin/questionnaires/${questionnaireId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answerText: answers[questionId],
          evidenceIds: []
        })
      });

      if (response.ok) {
        // Refresh the question data
        await fetchQuestionnaireDetails();
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setSavingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const submitAnswer = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/questionnaires/${questionnaireId}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          answerId: details?.questions.find(q => q.id === questionId)?.answer?.id
        })
      });

      if (response.ok) {
        await fetchQuestionnaireDetails();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const applySuggestion = (questionId: string, suggestion: Record<string, unknown>) => {
    setAnswers({ ...answers, [questionId]: suggestion.suggestedAnswer as string });
    setShowSuggestions({ ...showSuggestions, [questionId]: false });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading questionnaire...</p>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  if (!details) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Questionnaire not found</p>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{details.questionnaire.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(details.questionnaire.status)}`}>
                {details.questionnaire.status.replace('_', ' ')}
              </span>
              {details.questionnaire.clientName && (
                <span>Client: {details.questionnaire.clientName}</span>
              )}
              {details.questionnaire.dueDate && (
                <span>Due: {new Date(details.questionnaire.dueDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Progress Overview</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuestionnaireDetails}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{details.questionnaire.totalQuestions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{details.questionnaire.completedQuestions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((details.questionnaire.completedQuestions / details.questionnaire.totalQuestions) * 100)}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(details.questionnaire.completedQuestions / details.questionnaire.totalQuestions) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          {details.questions.map((question, index) => (
            <Card key={question.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                    {question.riskLevel && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(question.riskLevel)}`}>
                        {question.riskLevel}
                      </span>
                    )}
                    {question.requiredFlag && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                    {question.answer && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.answer.status)}`}>
                        {question.answer.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  
                  {question.section && (
                    <p className="text-sm text-gray-600 mb-2">{question.section}</p>
                  )}
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {question.questionText}
                  </h3>
                  
                  {question.keywordsExtracted.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {question.keywordsExtracted.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {question.suggestions && question.suggestions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuggestions({ ...showSuggestions, [question.id]: !showSuggestions[question.id] })}
                    >
                      <Lightbulb className="h-4 w-4" />
                      AI Suggestions ({question.suggestions.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Suggestions */}
              {showSuggestions[question.id] && question.suggestions && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">AI Suggestions</h4>
                  <div className="space-y-3">
                    {question.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="p-3 bg-white rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            {suggestion.sourceType.replace('_', ' ')} • {suggestion.confidenceScore}% confidence
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applySuggestion(question.id, suggestion)}
                          >
                            Use This
                          </Button>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{suggestion.suggestedAnswer}</p>
                        <p className="text-xs text-gray-500">{suggestion.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer Input */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`answer-${question.id}`}>Your Answer</Label>
                  <textarea
                    id={`answer-${question.id}`}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter your answer here..."
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveAnswer(question.id)}
                    disabled={!answers[question.id] || savingAnswers.has(question.id)}
                  >
                    {savingAnswers.has(question.id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Draft
                  </Button>
                  
                  {question.answer && question.answer.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => submitAnswer(question.id)}
                    >
                      <Send className="h-4 w-4" />
                      Submit for Review
                    </Button>
                  )}
                </div>
              </div>

              {/* Review Information */}
              {question.answer && question.answer.status !== 'DRAFT' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Review Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {question.answer.submittedAt && (
                      <p>Submitted: {new Date(question.answer.submittedAt).toLocaleString()}</p>
                    )}
                    {question.answer.approvedAt && (
                      <p>Approved: {new Date(question.answer.approvedAt).toLocaleString()}</p>
                    )}
                    {question.answer.rejectionReason && (
                      <p className="text-red-600">Rejection Reason: {question.answer.rejectionReason}</p>
                    )}
                    {question.answer.revisionNotes && (
                      <p>Revision Notes: {question.answer.revisionNotes}</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </PlatformAdminLayout>
  );
}
