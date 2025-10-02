import { prisma } from './prisma';
import { DocumentParserService } from './document-parser';
import { AISuggestionEngine, AnswerSuggestion } from './ai-suggestion-engine';

export interface QuestionnaireSummary {
  id: string;
  title: string;
  description?: string;
  clientName?: string;
  status: string;
  priority: number;
  dueDate?: Date;
  totalQuestions: number;
  completedQuestions: number;
  completionPercentage: number;
  assignedTo?: string;
  assignedToName?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionnaireBasic {
  id: string;
  title: string;
  status: string;
  organizationId: string;
}

export interface QuestionWithAnswer {
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
    submittedAt?: Date;
    approvedAt?: Date;
    rejectionReason?: string;
    revisionNotes?: string;
    sourceLibraryId?: string;
  };
  suggestions?: AnswerSuggestion[];
}

export class QuestionnaireService {
  /**
   * Create questionnaire from uploaded document
   */
  static async createFromDocument(
    fileBuffer: Buffer,
    fileName: string,
    organizationId: string,
    uploadedBy: string,
    clientName?: string,
    dueDate?: Date,
    priority: number = 5
  ): Promise<string> {
    try {
      // Parse document
      const parsedData = await DocumentParserService.parseDocument(
        fileBuffer,
        fileName,
        organizationId,
        uploadedBy
      );

      // Override client name if provided
      if (clientName) {
        parsedData.clientName = clientName;
      }

      // Save parsed questionnaire
      const questionnaireId = await DocumentParserService.saveParsedQuestionnaire(
        parsedData,
        organizationId,
        uploadedBy
      );

      // Update questionnaire with additional metadata
      await prisma.questionnaire.update({
        where: { id: questionnaireId },
        data: {
          clientName: parsedData.clientName || clientName,
          dueDate,
          priority
        }
      });

      // Create activity log
      await prisma.questionnaireActivity.create({
        data: {
          questionnaireId,
          userId: uploadedBy,
          activityType: 'UPLOADED',
          description: `Uploaded and parsed questionnaire: ${fileName}`,
          metadata: {
            fileName,
            fileSize: fileBuffer.length,
            questionsCount: parsedData.questions.length
          }
        }
      });

      return questionnaireId;
    } catch (error) {
      throw new Error(`Failed to create questionnaire from document: ${error}`);
    }
  }

  /**
   * Get questionnaire by ID (simple validation method)
   */
  static async getQuestionnaireById(questionnaireId: string): Promise<QuestionnaireBasic | null> {
    try {
      const questionnaire = await prisma.questionnaire.findUnique({
        where: { id: questionnaireId },
        select: {
          id: true,
          title: true,
          status: true,
          organizationId: true
        }
      });
      return questionnaire;
    } catch (error) {
      throw new Error(`Failed to get questionnaire by ID: ${error}`);
    }
  }

  /**
   * Get questionnaire summaries for organization
   */
  static async getQuestionnaireSummaries(
    organizationId: string,
    status?: string,
    assignedTo?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<QuestionnaireSummary[]> {
    try {
      const questionnaires = await prisma.questionnaire.findMany({
        where: {
          organizationId,
          ...(status && { status: status as 'UPLOADED' | 'PARSING' | 'PARSED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'EXPORTED' | 'DELIVERED' | 'ARCHIVED' }),
          ...(assignedTo && { assignedTo })
        },
        include: {
          uploader: {
            select: { name: true, email: true }
          },
          assignee: {
            select: { name: true, email: true }
          }
        },
        orderBy: [
          { priority: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      });

      return questionnaires.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description || undefined,
        clientName: q.clientName || undefined,
        status: q.status,
        priority: q.priority,
        dueDate: q.dueDate || undefined,
        totalQuestions: q.totalQuestions,
        completedQuestions: q.completedQuestions,
        completionPercentage: q.totalQuestions > 0 ? (q.completedQuestions / q.totalQuestions) * 100 : 0,
        assignedTo: q.assignedTo || undefined,
        assignedToName: q.assignee?.name || q.assignee?.email || undefined,
        uploadedBy: q.uploadedBy,
        uploadedByName: q.uploader?.name || q.uploader?.email || 'Unknown',
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      }));
    } catch (error) {
      throw new Error(`Failed to get questionnaire summaries: ${error}`);
    }
  }

  /**
   * Get questionnaire details with questions and answers
   */
  static async getQuestionnaireDetails(
    questionnaireId: string,
    organizationId: string,
    includeSuggestions: boolean = false
  ): Promise<{
    questionnaire: Record<string, unknown>;
    questions: QuestionWithAnswer[];
  }> {
    try {
      const questionnaire = await prisma.questionnaire.findFirst({
        where: {
          id: questionnaireId,
          organizationId
        },
        include: {
          uploader: {
            select: { name: true, email: true }
          },
          assignee: {
            select: { name: true, email: true }
          }
        }
      });

      if (!questionnaire) {
        throw new Error('Questionnaire not found');
      }

      const questions = await prisma.question.findMany({
        where: { questionnaireId },
        include: {
          answers: {
            include: {
              reviewer: {
                select: { name: true, email: true }
              },
              approver: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { orderIndex: 'asc' }
      });

      const questionsWithAnswers: QuestionWithAnswer[] = [];

      for (const question of questions) {
        const questionWithAnswer: QuestionWithAnswer = {
          id: question.id,
          section: question.section || undefined,
          subsection: question.subsection || undefined,
          orderIndex: question.orderIndex,
          questionText: question.questionText,
          questionType: question.questionType,
          optionsJson: question.optionsJson as Record<string, unknown> || undefined,
          requiredFlag: question.requiredFlag,
          controlMapping: question.controlMapping,
          riskLevel: question.riskLevel || undefined,
          keywordsExtracted: question.keywordsExtracted,
          dependencies: question.dependencies as Record<string, unknown> || undefined,
          metadata: question.metadata as Record<string, unknown> || undefined
        };

        // Add answer if exists
        if (question.answers.length > 0) {
          const answer = question.answers[0]; // Take the first answer
          questionWithAnswer.answer = {
            id: answer.id,
            draftText: answer.draftText || undefined,
            finalText: answer.finalText || undefined,
            evidenceIds: answer.evidenceIds,
            status: answer.status,
            confidenceScore: answer.confidenceScore || undefined,
            reviewerId: answer.reviewerId || undefined,
            approverId: answer.approverId || undefined,
            submittedAt: answer.submittedAt || undefined,
            approvedAt: answer.approvedAt || undefined,
            rejectionReason: answer.rejectionReason || undefined,
            revisionNotes: answer.revisionNotes || undefined,
            sourceLibraryId: answer.sourceLibraryId || undefined
          };
        }

        // Add AI suggestions if requested
        if (includeSuggestions && !questionWithAnswer.answer) {
          try {
            const suggestions = await AISuggestionEngine.generateSuggestions(
              question.id,
              organizationId
            );
            questionWithAnswer.suggestions = suggestions;
          } catch (error) {
            console.error('Failed to generate suggestions:', error);
          }
        }

        questionsWithAnswers.push(questionWithAnswer);
      }

      return {
        questionnaire,
        questions: questionsWithAnswers
      };
    } catch (error) {
      throw new Error(`Failed to get questionnaire details: ${error}`);
    }
  }

  /**
   * Save answer for a question
   */
  static async saveAnswer(
    questionId: string,
    answerText: string,
    evidenceIds: string[],
    userId: string,
    sourceLibraryId?: string,
    confidenceScore?: number
  ): Promise<string> {
    try {
      // Check if answer already exists
      const existingAnswer = await prisma.answer.findFirst({
        where: { questionId }
      });

      let answer;
      if (existingAnswer) {
        // Update existing answer
        answer = await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: {
            draftText: answerText,
            evidenceIds,
            sourceLibraryId,
            confidenceScore,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new answer
        answer = await prisma.answer.create({
          data: {
            questionId,
            draftText: answerText,
            evidenceIds,
            sourceLibraryId,
            confidenceScore,
            status: 'DRAFT'
          }
        });
      }

      // Update question completion status
      await this.updateQuestionnaireProgress(questionId);

      // Create activity log
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { questionnaire: true }
      });

      if (question) {
        await prisma.questionnaireActivity.create({
          data: {
            questionnaireId: question.questionnaireId,
            userId,
            activityType: 'ANSWERED',
            description: `Answered question: ${question.questionText.substring(0, 100)}...`,
          }
        });
      }

      return answer.id;
    } catch (error) {
      throw new Error(`Failed to save answer: ${error}`);
    }
  }

  /**
   * Submit answer for review
   */
  static async submitAnswer(
    answerId: string,
    userId: string,
    reviewerId?: string
  ): Promise<void> {
    try {
      const answer = await prisma.answer.update({
        where: { id: answerId },
        data: {
          finalText: undefined, // Will be set during review
          status: 'SUBMITTED',
          reviewerId,
          submittedAt: new Date()
        },
        include: {
          question: {
            include: {
              questionnaire: true
            }
          }
        }
      });

      // Create activity log
      await prisma.questionnaireActivity.create({
        data: {
          questionnaireId: answer.question.questionnaireId,
          userId,
          activityType: 'SUBMITTED',
          description: `Submitted answer for review`,
          metadata: {
            answerId,
            reviewerId
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to submit answer: ${error}`);
    }
  }

  /**
   * Review answer
   */
  static async reviewAnswer(
    answerId: string,
    reviewerId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
    finalText?: string
  ): Promise<void> {
    try {
      const answer = await prisma.answer.update({
        where: { id: answerId },
        data: {
          status: decision,
          reviewerId,
          finalText: finalText || undefined,
          rejectionReason: decision === 'REJECTED' ? reviewNotes : undefined,
          revisionNotes: reviewNotes,
          approvedAt: decision === 'APPROVED' ? new Date() : undefined
        },
        include: {
          question: {
            include: {
              questionnaire: true
            }
          }
        }
      });

      // Update questionnaire progress
      await this.updateQuestionnaireProgress(answer.questionId);

      // Create activity log
      await prisma.questionnaireActivity.create({
        data: {
          questionnaireId: answer.question.questionnaireId,
          userId: reviewerId,
          activityType: decision === 'APPROVED' ? 'REVIEWED' : 'REJECTED',
          description: `Answer ${decision.toLowerCase()}: ${reviewNotes || 'No additional notes'}`,
          metadata: {
            answerId,
            decision,
            reviewNotes
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to review answer: ${error}`);
    }
  }

  /**
   * Assign questionnaire to user
   */
  static async assignQuestionnaire(
    questionnaireId: string,
    assignedTo: string,
    assignedBy: string
  ): Promise<void> {
    try {
      await prisma.questionnaire.update({
        where: { id: questionnaireId },
        data: {
          assignedTo,
          status: 'IN_PROGRESS'
        }
      });

      // Create activity log
      await prisma.questionnaireActivity.create({
        data: {
          questionnaireId,
          userId: assignedBy,
          activityType: 'ASSIGNED',
          description: `Assigned questionnaire to user`,
          metadata: {
            assignedTo
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to assign questionnaire: ${error}`);
    }
  }

  /**
   * Update questionnaire status
   */
  static async updateStatus(
    questionnaireId: string,
    status: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      await prisma.questionnaire.update({
        where: { id: questionnaireId },
        data: {
          status: status as 'UPLOADED' | 'PARSING' | 'PARSED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'EXPORTED' | 'DELIVERED' | 'ARCHIVED',
          completionDate: status === 'APPROVED' ? new Date() : undefined
        }
      });

      // Create activity log
      await prisma.questionnaireActivity.create({
        data: {
          questionnaireId,
          userId,
          activityType: 'STATUS_CHANGED',
          description: `Status changed to ${status}${notes ? `: ${notes}` : ''}`,
          metadata: {
            newStatus: status,
            notes
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to update status: ${error}`);
    }
  }

  /**
   * Update questionnaire progress
   */
  private static async updateQuestionnaireProgress(questionId: string): Promise<void> {
    try {
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          questionnaire: true,
          answers: true
        }
      });

      if (!question) return;

      const questionnaire = question.questionnaire;
      const totalQuestions = questionnaire.totalQuestions;
      
      // Count completed questions
      const completedQuestions = await prisma.question.count({
        where: {
          questionnaireId: questionnaire.id,
          answers: {
            some: {
              status: 'APPROVED'
            }
          }
        }
      });

      // Update questionnaire progress
      await prisma.questionnaire.update({
        where: { id: questionnaire.id },
        data: {
          completedQuestions
        }
      });

      // Update status if all questions are completed
      if (completedQuestions === totalQuestions && questionnaire.status === 'IN_PROGRESS') {
        await prisma.questionnaire.update({
          where: { id: questionnaire.id },
          data: {
            status: 'UNDER_REVIEW'
          }
        });
      }
    } catch (error) {
      console.error('Failed to update questionnaire progress:', error);
    }
  }

  /**
   * Get questionnaire statistics
   */
  static async getQuestionnaireStats(organizationId: string): Promise<{
    total: number;
    inProgress: number;
    underReview: number;
    approved: number;
    overdue: number;
    averageCompletionTime: number;
  }> {
    try {
      const questionnaires = await prisma.questionnaire.findMany({
        where: { organizationId },
        select: {
          status: true,
          dueDate: true,
          completionDate: true,
          createdAt: true
        }
      });

      const stats = {
        total: questionnaires.length,
        inProgress: questionnaires.filter(q => q.status === 'IN_PROGRESS').length,
        underReview: questionnaires.filter(q => q.status === 'UNDER_REVIEW').length,
        approved: questionnaires.filter(q => q.status === 'APPROVED').length,
        overdue: questionnaires.filter(q => 
          q.dueDate && q.dueDate < new Date() && q.status !== 'APPROVED'
        ).length,
        averageCompletionTime: 0
      };

      // Calculate average completion time
      const completedQuestionnaires = questionnaires.filter(q => q.completionDate);
      if (completedQuestionnaires.length > 0) {
        const totalTime = completedQuestionnaires.reduce((sum, q) => {
          const timeDiff = q.completionDate!.getTime() - q.createdAt.getTime();
          return sum + timeDiff;
        }, 0);
        stats.averageCompletionTime = totalTime / completedQuestionnaires.length / (1000 * 60 * 60 * 24); // Convert to days
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get questionnaire stats: ${error}`);
    }
  }
}
