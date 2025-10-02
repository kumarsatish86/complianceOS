import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiDocs = {
      title: 'Security Questionnaire Automation API',
      version: '1.0.0',
      description: 'Comprehensive API for managing security questionnaires, answer library, and analytics',
      baseUrl: '/api/admin/questionnaires',
      authentication: {
        type: 'Bearer Token',
        description: 'All endpoints require authentication via NextAuth session'
      },
      endpoints: {
        questionnaires: {
          list: {
            method: 'GET',
            path: '/questionnaires',
            description: 'Get list of questionnaires with filtering options',
            parameters: {
              organizationId: 'string (optional)',
              status: 'string (optional)',
              assignedTo: 'string (optional)',
              limit: 'number (default: 50)',
              offset: 'number (default: 0)'
            },
            response: {
              questionnaires: 'Array<QuestionnaireSummary>'
            }
          },
          create: {
            method: 'POST',
            path: '/questionnaires',
            description: 'Create new questionnaire from uploaded document',
            contentType: 'multipart/form-data',
            parameters: {
              file: 'File (required)',
              clientName: 'string (optional)',
              dueDate: 'string (optional)',
              priority: 'number (default: 5)',
              organizationId: 'string (required)'
            },
            response: {
              questionnaireId: 'string',
              message: 'string'
            }
          },
          details: {
            method: 'GET',
            path: '/questionnaires/{id}',
            description: 'Get detailed questionnaire with questions and answers',
            parameters: {
              id: 'string (required)',
              includeSuggestions: 'boolean (optional)'
            },
            response: {
              questionnaire: 'QuestionnaireDetails',
              questions: 'Array<QuestionWithAnswer>'
            }
          },
          update: {
            method: 'PUT',
            path: '/questionnaires/{id}',
            description: 'Update questionnaire (assign, change status)',
            parameters: {
              id: 'string (required)',
              action: 'string (assign|updateStatus)',
              assignedTo: 'string (optional)',
              status: 'string (optional)',
              notes: 'string (optional)'
            },
            response: {
              message: 'string'
            }
          }
        },
        answers: {
          save: {
            method: 'POST',
            path: '/questionnaires/{id}/answers',
            description: 'Save answer for a question',
            parameters: {
              id: 'string (required)',
              questionId: 'string (required)',
              answerText: 'string (required)',
              evidenceIds: 'Array<string> (optional)',
              sourceLibraryId: 'string (optional)',
              confidenceScore: 'number (optional)'
            },
            response: {
              answerId: 'string',
              message: 'string'
            }
          },
          submit: {
            method: 'PUT',
            path: '/questionnaires/{id}/answers',
            description: 'Submit answer for review',
            parameters: {
              id: 'string (required)',
              action: 'submit',
              answerId: 'string (required)',
              reviewerId: 'string (optional)'
            },
            response: {
              message: 'string'
            }
          },
          review: {
            method: 'PUT',
            path: '/questionnaires/{id}/answers',
            description: 'Review answer (approve/reject)',
            parameters: {
              id: 'string (required)',
              action: 'review',
              answerId: 'string (required)',
              decision: 'string (APPROVED|REJECTED)',
              reviewNotes: 'string (optional)',
              finalText: 'string (optional)'
            },
            response: {
              message: 'string'
            }
          }
        },
        suggestions: {
          generate: {
            method: 'GET',
            path: '/questionnaires/{id}/suggestions',
            description: 'Generate AI-powered answer suggestions',
            parameters: {
              id: 'string (required)',
              questionId: 'string (required)'
            },
            response: {
              suggestions: 'Array<AnswerSuggestion>'
            }
          }
        },
        exports: {
          create: {
            method: 'POST',
            path: '/questionnaires/{id}/export',
            description: 'Create export in specified format',
            parameters: {
              id: 'string (required)',
              format: 'string (EXCEL|PDF|CSV|WORD|ZIP_PACKAGE)',
              includeAnswers: 'boolean (default: true)',
              includeEvidence: 'boolean (default: false)',
              includeMetadata: 'boolean (default: true)',
              includeReviewHistory: 'boolean (default: true)',
              template: 'string (optional)',
              customFields: 'Array<string> (optional)'
            },
            response: {
              exportId: 'string',
              fileName: 'string',
              downloadUrl: 'string',
              expiresAt: 'string',
              message: 'string'
            }
          },
          history: {
            method: 'GET',
            path: '/questionnaires/{id}/export',
            description: 'Get export history for questionnaire',
            parameters: {
              id: 'string (required)'
            },
            response: {
              exports: 'Array<ExportRecord>'
            }
          }
        },
        analytics: {
          overview: {
            method: 'GET',
            path: '/questionnaires/analytics',
            description: 'Get comprehensive analytics and insights',
            parameters: {
              startDate: 'string (optional)',
              endDate: 'string (optional)'
            },
            response: {
              analytics: 'QuestionnaireAnalytics'
            }
          },
          metrics: {
            method: 'GET',
            path: '/questionnaires/metrics',
            description: 'Get real-time metrics for dashboard',
            response: {
              metrics: 'RealTimeMetrics'
            }
          }
        },
        answerLibrary: {
          list: {
            method: 'GET',
            path: '/answer-library',
            description: 'Get answer library entries with filtering',
            parameters: {
              category: 'string (optional)',
              search: 'string (optional)',
              limit: 'number (default: 50)',
              offset: 'number (default: 0)'
            },
            response: {
              entries: 'Array<AnswerLibraryEntry>'
            }
          },
          create: {
            method: 'POST',
            path: '/answer-library',
            description: 'Create new answer library entry',
            parameters: {
              action: 'create',
              category: 'string (required)',
              subcategory: 'string (optional)',
              keyPhrases: 'Array<string> (required)',
              standardAnswer: 'string (required)',
              evidenceReferences: 'Array<string> (optional)'
            },
            response: {
              entryId: 'string',
              message: 'string'
            }
          },
          import: {
            method: 'POST',
            path: '/answer-library',
            description: 'Import answer library entries from CSV',
            parameters: {
              action: 'import',
              csvData: 'string (required)'
            },
            response: {
              imported: 'number',
              errors: 'Array<string>',
              message: 'string'
            }
          },
          export: {
            method: 'POST',
            path: '/answer-library',
            description: 'Export answer library to CSV',
            parameters: {
              action: 'export'
            },
            response: {
              csvData: 'string'
            }
          },
          details: {
            method: 'GET',
            path: '/answer-library/{id}',
            description: 'Get answer library entry details',
            parameters: {
              id: 'string (required)'
            },
            response: {
              entry: 'AnswerLibraryEntry'
            }
          },
          update: {
            method: 'PUT',
            path: '/answer-library/{id}',
            description: 'Update answer library entry',
            parameters: {
              id: 'string (required)',
              action: 'update',
              category: 'string (optional)',
              subcategory: 'string (optional)',
              keyPhrases: 'Array<string> (optional)',
              standardAnswer: 'string (optional)',
              evidenceReferences: 'Array<string> (optional)',
              isActive: 'boolean (optional)'
            },
            response: {
              message: 'string'
            }
          },
          delete: {
            method: 'DELETE',
            path: '/answer-library/{id}',
            description: 'Delete answer library entry',
            parameters: {
              id: 'string (required)'
            },
            response: {
              message: 'string'
            }
          },
          stats: {
            method: 'GET',
            path: '/answer-library/stats',
            description: 'Get answer library statistics',
            response: {
              stats: 'AnswerLibraryStats'
            }
          }
        }
      },
      dataModels: {
        QuestionnaireSummary: {
          id: 'string',
          title: 'string',
          description: 'string (optional)',
          clientName: 'string (optional)',
          status: 'string',
          priority: 'number',
          dueDate: 'string (optional)',
          totalQuestions: 'number',
          completedQuestions: 'number',
          completionPercentage: 'number',
          assignedTo: 'string (optional)',
          assignedToName: 'string (optional)',
          uploadedBy: 'string',
          uploadedByName: 'string',
          createdAt: 'string',
          updatedAt: 'string'
        },
        QuestionWithAnswer: {
          id: 'string',
          section: 'string (optional)',
          subsection: 'string (optional)',
          orderIndex: 'number',
          questionText: 'string',
          questionType: 'string',
          optionsJson: 'object (optional)',
          requiredFlag: 'boolean',
          controlMapping: 'Array<string>',
          riskLevel: 'string (optional)',
          keywordsExtracted: 'Array<string>',
          dependencies: 'object (optional)',
          metadata: 'object (optional)',
          answer: 'Answer (optional)',
          suggestions: 'Array<AnswerSuggestion> (optional)'
        },
        Answer: {
          id: 'string',
          draftText: 'string (optional)',
          finalText: 'string (optional)',
          evidenceIds: 'Array<string>',
          status: 'string',
          confidenceScore: 'number (optional)',
          reviewerId: 'string (optional)',
          approverId: 'string (optional)',
          submittedAt: 'string (optional)',
          approvedAt: 'string (optional)',
          rejectionReason: 'string (optional)',
          revisionNotes: 'string (optional)',
          sourceLibraryId: 'string (optional)'
        },
        AnswerSuggestion: {
          suggestedAnswer: 'string',
          confidenceScore: 'number',
          sourceType: 'string',
          sourceId: 'string (optional)',
          evidenceIds: 'Array<string>',
          reasoning: 'string',
          metadata: 'object (optional)'
        },
        AnswerLibraryEntry: {
          id: 'string',
          category: 'string',
          subcategory: 'string (optional)',
          keyPhrases: 'Array<string>',
          standardAnswer: 'string',
          evidenceReferences: 'Array<string>',
          usageCount: 'number',
          confidenceScore: 'number',
          lastUsedAt: 'string (optional)',
          lastUpdated: 'string',
          createdBy: 'string',
          createdByName: 'string (optional)',
          isActive: 'boolean',
          metadata: 'object (optional)'
        },
        QuestionnaireAnalytics: {
          overview: 'object',
          trends: 'object',
          performance: 'object',
          insights: 'object',
          quality: 'object'
        },
        RealTimeMetrics: {
          activeQuestionnaires: 'number',
          pendingReviews: 'number',
          completedToday: 'number',
          averageCompletionTime: 'number'
        }
      },
      errorCodes: {
        400: 'Bad Request - Invalid parameters',
        401: 'Unauthorized - Authentication required',
        403: 'Forbidden - Insufficient permissions',
        404: 'Not Found - Resource not found',
        500: 'Internal Server Error - Server error'
      },
      examples: {
        createQuestionnaire: {
          method: 'POST',
          url: '/api/admin/questionnaires',
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          body: {
            file: 'questionnaire.pdf',
            clientName: 'Acme Corp',
            dueDate: '2024-12-31',
            priority: 3
          }
        },
        saveAnswer: {
          method: 'POST',
          url: '/api/admin/questionnaires/123/answers',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            questionId: 'q456',
            answerText: 'We implement multi-factor authentication for all user accounts...',
            evidenceIds: ['ev789'],
            confidenceScore: 85
          }
        },
        generateSuggestions: {
          method: 'GET',
          url: '/api/admin/questionnaires/123/suggestions?questionId=q456'
        },
        exportQuestionnaire: {
          method: 'POST',
          url: '/api/admin/questionnaires/123/export',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            format: 'EXCEL',
            includeAnswers: true,
            includeEvidence: true,
            includeMetadata: true
          }
        }
      }
    };

    return NextResponse.json(apiDocs);
  } catch (error) {
    console.error('Error generating API docs:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
