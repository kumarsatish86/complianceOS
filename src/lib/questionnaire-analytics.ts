import { prisma } from './prisma';

export interface QuestionnaireAnalytics {
  overview: {
    totalQuestionnaires: number;
    completedQuestionnaires: number;
    inProgressQuestionnaires: number;
    averageCompletionTime: number; // in days
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
      averageReviewTime: number; // in hours
      approvalRate: number; // percentage
      rejectionRate: number; // percentage
    };
  };
}

export class QuestionnaireAnalyticsService {
  /**
   * Get comprehensive analytics for questionnaires
   */
  static async getAnalytics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<QuestionnaireAnalytics> {
    try {
      const dateFilter = {
        ...(startDate && endDate && {
          startDate,
          endDate
        })
      };

      // Get overview statistics
      const overview = await this.getOverviewStats(organizationId, dateFilter);
      
      // Get trend data
      const trends = await this.getTrendData(organizationId, dateFilter);
      
      // Get performance metrics
      const performance = await this.getPerformanceMetrics(organizationId, dateFilter);
      
      // Get insights
      const insights = await this.getInsights(organizationId, dateFilter);
      
      // Get quality metrics
      const quality = await this.getQualityMetrics(organizationId, dateFilter);

      return {
        overview,
        trends,
        performance,
        insights,
        quality
      };
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error}`);
    }
  }

  /**
   * Get overview statistics
   */
  private static async getOverviewStats(organizationId: string, dateFilter: { startDate?: Date; endDate?: Date }) {
    const questionnaires = await prisma.questionnaire.findMany({
      where: {
        organizationId,
        ...dateFilter
      },
      include: {
        questions: {
          include: {
            answers: true
          }
        }
      }
    });

    const totalQuestionnaires = questionnaires.length;
    const completedQuestionnaires = questionnaires.filter(q => q.status === 'APPROVED').length;
    const inProgressQuestionnaires = questionnaires.filter(q => 
      ['IN_PROGRESS', 'UNDER_REVIEW'].includes(q.status)
    ).length;

    // Calculate average completion time
    const completedWithDates = questionnaires.filter(q => 
      q.status === 'APPROVED' && q.completionDate
    );
    const averageCompletionTime = completedWithDates.length > 0
      ? completedWithDates.reduce((sum, q) => {
          const timeDiff = q.completionDate!.getTime() - q.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / completedWithDates.length
      : 0;

    // Calculate total questions answered
    const totalQuestionsAnswered = questionnaires.reduce((sum, q) => {
      return sum + q.questions.filter(question => 
        question.answers.some(answer => answer.status === 'APPROVED')
      ).length;
    }, 0);

    const averageQuestionsPerQuestionnaire = totalQuestionnaires > 0
      ? questionnaires.reduce((sum, q) => sum + q.totalQuestions, 0) / totalQuestionnaires
      : 0;

    return {
      totalQuestionnaires,
      completedQuestionnaires,
      inProgressQuestionnaires,
      averageCompletionTime,
      totalQuestionsAnswered,
      averageQuestionsPerQuestionnaire
    };
  }

  /**
   * Get trend data
   */
  private static async getTrendData(organizationId: string, dateFilter: { startDate?: Date; endDate?: Date }) {
    const questionnaires = await prisma.questionnaire.findMany({
      where: {
        organizationId,
        ...dateFilter
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Group by month
    const monthlyData = new Map<string, { count: number; completed: number }>();
    
    questionnaires.forEach(q => {
      const month = q.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || { count: 0, completed: 0 };
      monthlyData.set(month, {
        count: existing.count + 1,
        completed: existing.completed + (q.status === 'APPROVED' ? 1 : 0)
      });
    });

    const questionnairesByMonth = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        completed: data.completed
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate completion rates by period
    const completionRates = questionnairesByMonth.map(data => ({
      period: data.month,
      rate: data.count > 0 ? (data.completed / data.count) * 100 : 0
    }));

    return {
      questionnairesByMonth,
      completionRates
    };
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics(organizationId: string, dateFilter: { startDate?: Date; endDate?: Date }) {
    // Top performers
    const userStats = await prisma.questionnaire.groupBy({
      by: ['uploadedBy'],
      where: {
        organizationId,
        status: 'APPROVED',
        ...dateFilter
      },
      _count: {
        id: true
      },
      _avg: {
        totalQuestions: true
      }
    });

    const topPerformers = await Promise.all(
      userStats.slice(0, 5).map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.uploadedBy },
          select: { name: true, email: true }
        });

        // Calculate average completion time for this user
        const userQuestionnaires = await prisma.questionnaire.findMany({
          where: {
            organizationId,
            uploadedBy: stat.uploadedBy,
            status: 'APPROVED',
            completionDate: { not: null },
            ...dateFilter
          },
          select: { createdAt: true, completionDate: true }
        });

        const averageCompletionTime = userQuestionnaires.length > 0
          ? userQuestionnaires.reduce((sum, q) => {
              const timeDiff = q.completionDate!.getTime() - q.createdAt.getTime();
              return sum + (timeDiff / (1000 * 60 * 60 * 24));
            }, 0) / userQuestionnaires.length
          : 0;

        return {
          userId: stat.uploadedBy,
          userName: user?.name || user?.email || 'Unknown',
          questionnairesCompleted: stat._count.id,
          averageCompletionTime
        };
      })
    );

    // Slowest questionnaires
    const slowestQuestionnaires = await prisma.questionnaire.findMany({
      where: {
        organizationId,
        status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] },
        ...dateFilter
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        totalQuestions: true,
        completedQuestions: true
      },
      orderBy: { createdAt: 'asc' },
      take: 5
    });

    const slowestWithDays = slowestQuestionnaires.map(q => {
      const daysInProgress = (Date.now() - q.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return {
        questionnaireId: q.id,
        title: q.title,
        daysInProgress: Math.round(daysInProgress),
        completionPercentage: q.totalQuestions > 0 ? (q.completedQuestions / q.totalQuestions) * 100 : 0
      };
    });

    return {
      topPerformers,
      slowestQuestionnaires: slowestWithDays
    };
  }

  /**
   * Get insights
   */
  private static async getInsights(organizationId: string, dateFilter: { startDate?: Date; endDate?: Date }) {
    // Most common question types
    const questionTypes = await prisma.question.groupBy({
      by: ['questionType'],
      where: {
        questionnaire: {
          organizationId,
          ...dateFilter
        }
      },
      _count: {
        id: true
      }
    });

    const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt._count.id, 0);
    const mostCommonQuestionTypes = questionTypes
      .map(qt => ({
        type: qt.questionType,
        count: qt._count.id,
        percentage: totalQuestions > 0 ? (qt._count.id / totalQuestions) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most used answer library entries
    const answerLibraryStats = await prisma.answerLibrary.findMany({
      where: {
        organizationId,
        usageCount: { gt: 0 }
      },
      select: {
        id: true,
        category: true,
        usageCount: true,
        confidenceScore: true
      },
      orderBy: { usageCount: 'desc' },
      take: 5
    });

    const mostUsedAnswerLibraryEntries = answerLibraryStats.map(entry => ({
      entryId: entry.id,
      category: entry.category,
      usageCount: entry.usageCount,
      confidenceScore: entry.confidenceScore
    }));

    // Framework distribution
    const questionnaires = await prisma.questionnaire.findMany({
      where: {
        organizationId,
        ...dateFilter
      },
      select: {
        frameworkMapping: true
      }
    });

    const frameworkCounts = new Map<string, number>();
    questionnaires.forEach(q => {
      q.frameworkMapping.forEach(framework => {
        frameworkCounts.set(framework, (frameworkCounts.get(framework) || 0) + 1);
      });
    });

    const totalFrameworks = Array.from(frameworkCounts.values()).reduce((sum, count) => sum + count, 0);
    const frameworkDistribution = Array.from(frameworkCounts.entries())
      .map(([framework, count]) => ({
        framework,
        count,
        percentage: totalFrameworks > 0 ? (count / totalFrameworks) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      mostCommonQuestionTypes,
      mostUsedAnswerLibraryEntries,
      frameworkDistribution
    };
  }

  /**
   * Get quality metrics
   */
  private static async getQualityMetrics(organizationId: string, dateFilter: { startDate?: Date; endDate?: Date }) {
    // Average confidence score
    const answers = await prisma.answer.findMany({
      where: {
        question: {
          questionnaire: {
            organizationId,
            ...dateFilter
          }
        },
        confidenceScore: { not: null }
      },
      select: {
        confidenceScore: true,
        status: true,
        submittedAt: true,
        approvedAt: true
      }
    });

    const averageConfidenceScore = answers.length > 0
      ? answers.reduce((sum, answer) => sum + (answer.confidenceScore || 0), 0) / answers.length
      : 0;

    // Answer quality trends (by month)
    const monthlyQuality = new Map<string, { totalConfidence: number; count: number }>();
    answers.forEach(answer => {
      const month = answer.submittedAt?.toISOString().substring(0, 7) || 'unknown';
      const existing = monthlyQuality.get(month) || { totalConfidence: 0, count: 0 };
      monthlyQuality.set(month, {
        totalConfidence: existing.totalConfidence + (answer.confidenceScore || 0),
        count: existing.count + 1
      });
    });

    const answerQualityTrends = Array.from(monthlyQuality.entries())
      .map(([period, data]) => ({
        period,
        averageConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
        totalAnswers: data.count
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Review efficiency
    const reviewedAnswers = answers.filter(answer => 
      answer.status === 'APPROVED' || answer.status === 'REJECTED'
    );

    const approvedAnswers = reviewedAnswers.filter(answer => answer.status === 'APPROVED');
    const rejectedAnswers = reviewedAnswers.filter(answer => answer.status === 'REJECTED');

    const approvalRate = reviewedAnswers.length > 0 ? (approvedAnswers.length / reviewedAnswers.length) * 100 : 0;
    const rejectionRate = reviewedAnswers.length > 0 ? (rejectedAnswers.length / reviewedAnswers.length) * 100 : 0;

    // Calculate average review time
    const answersWithReviewTime = reviewedAnswers.filter(answer => 
      answer.submittedAt && answer.approvedAt
    );

    const averageReviewTime = answersWithReviewTime.length > 0
      ? answersWithReviewTime.reduce((sum, answer) => {
          const timeDiff = answer.approvedAt!.getTime() - answer.submittedAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / answersWithReviewTime.length
      : 0;

    return {
      averageConfidenceScore,
      answerQualityTrends,
      reviewEfficiency: {
        averageReviewTime,
        approvalRate,
        rejectionRate
      }
    };
  }

  /**
   * Get real-time metrics for dashboard widgets
   */
  static async getRealTimeMetrics(organizationId: string): Promise<{
    activeQuestionnaires: number;
    pendingReviews: number;
    completedToday: number;
    averageCompletionTime: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        activeQuestionnaires,
        pendingReviews,
        completedToday,
        avgCompletionTime
      ] = await Promise.all([
        // Active questionnaires
        prisma.questionnaire.count({
          where: {
            organizationId,
            status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] }
          }
        }),
        
        // Pending reviews
        prisma.answer.count({
          where: {
            status: 'SUBMITTED',
            question: {
              questionnaire: {
                organizationId
              }
            }
          }
        }),
        
        // Completed today
        prisma.questionnaire.count({
          where: {
            organizationId,
            status: 'APPROVED',
            completionDate: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        
        // Average completion time
        prisma.questionnaire.aggregate({
          where: {
            organizationId,
            status: 'APPROVED',
            completionDate: { not: null }
          },
          _avg: {
            totalQuestions: true
          }
        })
      ]);

      return {
        activeQuestionnaires,
        pendingReviews,
        completedToday,
        averageCompletionTime: avgCompletionTime._avg.totalQuestions || 0
      };
    } catch (error) {
      throw new Error(`Failed to get real-time metrics: ${error}`);
    }
  }
}
