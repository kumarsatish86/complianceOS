import { prisma } from '@/lib/prisma';
import { TaskType, TaskPriority } from '@prisma/client';

export interface TaskGenerationRule {
  type: TaskType;
  priority: TaskPriority;
  dueDateOffset: number; // days from creation
  conditions: {
    evidenceExpiryDays?: number;
    controlReviewDays?: number;
    status?: string;
  };
}

export class TaskAutomationService {
  private static instance: TaskAutomationService;
  private rules: TaskGenerationRule[] = [
    {
      type: 'EVIDENCE_RENEWAL',
      priority: 'HIGH',
      dueDateOffset: 30,
      conditions: {
        evidenceExpiryDays: 90, // Generate task 90 days before expiry
      },
    },
    {
      type: 'CONTROL_REVIEW',
      priority: 'MEDIUM',
      dueDateOffset: 90,
      conditions: {
        controlReviewDays: 365, // Annual control review
      },
    },
    {
      type: 'EVIDENCE_COLLECTION',
      priority: 'HIGH',
      dueDateOffset: 7,
      conditions: {
        status: 'GAP', // Generate for controls with GAP status
      },
    },
    {
      type: 'GAP_REMEDIATION',
      priority: 'HIGH',
      dueDateOffset: 14,
      conditions: {
        status: 'GAP',
      },
    },
  ];

  public static getInstance(): TaskAutomationService {
    if (!TaskAutomationService.instance) {
      TaskAutomationService.instance = new TaskAutomationService();
    }
    return TaskAutomationService.instance;
  }

  /**
   * Generate tasks based on evidence expiry
   */
  async generateEvidenceRenewalTasks(organizationId: string): Promise<void> {
    const rule = this.rules.find(r => r.type === 'EVIDENCE_RENEWAL');
    if (!rule) return;

    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + (rule.conditions.evidenceExpiryDays || 90));

    const expiringEvidence = await prisma.evidence.findMany({
      where: {
        organizationId,
        expiryDate: {
          lte: expiryThreshold,
          gte: new Date(), // Not expired yet
        },
        status: {
          in: ['APPROVED', 'SUBMITTED'],
        },
      },
      include: {
        controlLinks: {
          include: {
            control: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    for (const evidence of expiringEvidence) {
      // Check if task already exists
      const existingTask = await prisma.task.findFirst({
        where: {
          organizationId,
          type: 'EVIDENCE_RENEWAL',
          evidenceId: evidence.id,
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      });

      if (existingTask) continue;

      // Create task for each linked control
      for (const link of evidence.controlLinks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + rule.dueDateOffset);

        await prisma.task.create({
          data: {
            organizationId,
            type: 'EVIDENCE_RENEWAL',
            controlId: link.control.id,
            evidenceId: evidence.id,
            assigneeId: link.control.owner?.id,
            status: 'OPEN',
            priority: rule.priority,
            dueDate,
            comments: `Evidence "${evidence.title}" expires on ${evidence.expiryDate?.toLocaleDateString()}. Please renew or replace this evidence.`,
            createdBy: 'system', // Will be replaced with actual system user ID
          },
        });
      }
    }
  }

  /**
   * Generate tasks for control reviews
   */
  async generateControlReviewTasks(organizationId: string): Promise<void> {
    const rule = this.rules.find(r => r.type === 'CONTROL_REVIEW');
    if (!rule) return;

    const reviewThreshold = new Date();
    reviewThreshold.setDate(reviewThreshold.getDate() - (rule.conditions.controlReviewDays || 365));

    const controlsNeedingReview = await prisma.control.findMany({
      where: {
        organizationId,
        OR: [
          { nextReviewDate: { lte: new Date() } },
          { nextReviewDate: null },
        ],
        updatedAt: {
          lte: reviewThreshold,
        },
      },
      include: {
        owner: true,
      },
    });

    for (const control of controlsNeedingReview) {
      // Check if task already exists
      const existingTask = await prisma.task.findFirst({
        where: {
          organizationId,
          type: 'CONTROL_REVIEW',
          controlId: control.id,
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      });

      if (existingTask) continue;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + rule.dueDateOffset);

      await prisma.task.create({
        data: {
          organizationId,
          type: 'CONTROL_REVIEW',
          controlId: control.id,
          assigneeId: control.owner?.id,
          status: 'OPEN',
          priority: rule.priority,
          dueDate,
          comments: `Control "${control.name}" requires annual review. Please assess current implementation and evidence.`,
          createdBy: 'system', // Will be replaced with actual system user ID
        },
      });
    }
  }

  /**
   * Generate tasks for gap remediation
   */
  async generateGapRemediationTasks(organizationId: string): Promise<void> {
    const rule = this.rules.find(r => r.type === 'GAP_REMEDIATION');
    if (!rule) return;

    const controlsWithGaps = await prisma.control.findMany({
      where: {
        organizationId,
        status: 'GAP',
        criticality: 'HIGH',
      },
      include: {
        owner: true,
        evidenceLinks: true,
      },
    });

    for (const control of controlsWithGaps) {
      // Check if task already exists
      const existingTask = await prisma.task.findFirst({
        where: {
          organizationId,
          type: 'GAP_REMEDIATION',
          controlId: control.id,
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      });

      if (existingTask) continue;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + rule.dueDateOffset);

      await prisma.task.create({
        data: {
          organizationId,
          type: 'GAP_REMEDIATION',
          controlId: control.id,
          assigneeId: control.owner?.id,
          status: 'OPEN',
          priority: rule.priority,
          dueDate,
          comments: `High-priority control "${control.name}" has GAP status. Please implement required controls and provide evidence.`,
          createdBy: 'system', // Will be replaced with actual system user ID
        },
      });
    }
  }

  /**
   * Generate all automated tasks for an organization
   */
  async generateAllTasks(organizationId: string): Promise<{
    evidenceRenewal: number;
    controlReview: number;
    gapRemediation: number;
  }> {
    const results = {
      evidenceRenewal: 0,
      controlReview: 0,
      gapRemediation: 0,
    };

    try {
      await this.generateEvidenceRenewalTasks(organizationId);
      await this.generateControlReviewTasks(organizationId);
      await this.generateGapRemediationTasks(organizationId);

      // Count generated tasks
      const taskCounts = await prisma.task.groupBy({
        by: ['type'],
        where: {
          organizationId,
          createdBy: 'system',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        _count: {
          id: true,
        },
      });

      taskCounts.forEach(count => {
        switch (count.type) {
          case 'EVIDENCE_RENEWAL':
            results.evidenceRenewal = count._count.id;
            break;
          case 'CONTROL_REVIEW':
            results.controlReview = count._count.id;
            break;
          case 'GAP_REMEDIATION':
            results.gapRemediation = count._count.id;
            break;
        }
      });

      return results;
    } catch (error) {
      console.error('Error generating automated tasks:', error);
      throw error;
    }
  }

  /**
   * Update task status based on control status changes
   */
  async updateTaskStatusFromControlStatus(
    organizationId: string,
    controlId: string,
    newStatus: string
  ): Promise<void> {
    if (newStatus === 'MET') {
      // Complete related tasks when control is met
      await prisma.task.updateMany({
        where: {
          organizationId,
          controlId,
          type: {
            in: ['EVIDENCE_COLLECTION', 'GAP_REMEDIATION'],
          },
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
  }
}

export const taskAutomation = TaskAutomationService.getInstance();
