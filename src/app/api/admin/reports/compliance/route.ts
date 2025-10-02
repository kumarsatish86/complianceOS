import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requireEvidencePermission } from '@/lib/evidence-permissions';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// GET /api/admin/reports/compliance - Generate compliance reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const reportType = searchParams.get('type') || 'overview';
    const frameworkId = searchParams.get('frameworkId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    await requireEvidencePermission(organizationId, 'reports', 'read');

    let reportData;

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(organizationId);
        break;
      case 'control-matrix':
        reportData = await generateControlMatrixReport(organizationId, frameworkId || undefined);
        break;
      case 'evidence-index':
        reportData = await generateEvidenceIndexReport(organizationId);
        break;
      case 'expiring-evidence':
        reportData = await generateExpiringEvidenceReport(organizationId);
        break;
      case 'gap-analysis':
        reportData = await generateGapAnalysisReport(organizationId, frameworkId || undefined);
        break;
      case 'task-summary':
        reportData = await generateTaskSummaryReport(organizationId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      reportType,
      generatedAt: new Date().toISOString(),
      organizationId,
      data: reportData,
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error generating compliance report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateOverviewReport(organizationId: string) {
  const [
    frameworks,
    controls,
    evidence,
    tasks,
  ] = await Promise.all([
    prisma.framework.findMany({
      where: { organizationId, isActive: true },
      include: {
        _count: {
          select: { controls: true },
        },
      },
    }),
    prisma.control.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }),
    prisma.evidence.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }),
  ]);

  return {
    frameworks: frameworks.length,
    controls: {
      total: controls.reduce((sum, c) => sum + c._count.id, 0),
      byStatus: controls.reduce((acc, c) => {
        acc[c.status] = c._count.id;
        return acc;
      }, {} as Record<string, number>),
    },
    evidence: {
      total: evidence.reduce((sum, e) => sum + e._count.id, 0),
      byStatus: evidence.reduce((acc, e) => {
        acc[e.status] = e._count.id;
        return acc;
      }, {} as Record<string, number>),
    },
    tasks: {
      total: tasks.reduce((sum, t) => sum + t._count.id, 0),
      byStatus: tasks.reduce((acc, t) => {
        acc[t.status] = t._count.id;
        return acc;
      }, {} as Record<string, number>),
    },
  };
}

async function generateControlMatrixReport(organizationId: string, frameworkId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { organizationId };
  if (frameworkId) {
    where.frameworkId = frameworkId;
  }

  const controls = await prisma.control.findMany({
    where,
    include: {
      framework: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      evidenceLinks: {
        include: {
          evidence: {
            select: {
              id: true,
              title: true,
              status: true,
              expiryDate: true,
            },
          },
        },
      },
      _count: {
        select: {
          evidenceLinks: true,
          tasks: true,
        },
      },
    },
    orderBy: [
      { framework: { name: 'asc' } },
      { name: 'asc' },
    ],
  });

  return {
    controls: controls.map(control => ({
      id: control.id,
      name: control.name,
      description: control.description,
      framework: control.framework,
      status: control.status,
      criticality: control.criticality,
      owner: control.owner,
      evidenceCount: control._count.evidenceLinks,
      taskCount: control._count.tasks,
      evidence: control.evidenceLinks.map(link => ({
        id: link.evidence.id,
        title: link.evidence.title,
        status: link.evidence.status,
        expiryDate: link.evidence.expiryDate,
        effectivenessRating: link.effectivenessRating,
      })),
    })),
  };
}

async function generateEvidenceIndexReport(organizationId: string) {
  const evidence = await prisma.evidence.findMany({
    where: { organizationId },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      controlLinks: {
        include: {
          control: {
            select: {
              id: true,
              name: true,
              framework: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      },
      tagLinks: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
      _count: {
        select: {
          versions: true,
          controlLinks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    evidence: evidence.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      status: item.status,
      uploader: item.uploader,
      uploadedAt: item.addedAt,
      expiryDate: item.expiryDate,
      version: item.version,
      controlCount: item._count.controlLinks,
      versionCount: item._count.versions,
      controls: item.controlLinks.map(link => ({
        id: link.control.id,
        name: link.control.name,
        framework: link.control.framework,
        effectivenessRating: link.effectivenessRating,
      })),
      tags: item.tagLinks.map(link => link.tag),
    })),
  };
}

async function generateExpiringEvidenceReport(organizationId: string) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringEvidence = await prisma.evidence.findMany({
    where: {
      organizationId,
      expiryDate: {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      },
      status: {
        in: ['APPROVED', 'SUBMITTED'],
      },
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      controlLinks: {
        include: {
          control: {
            select: {
              id: true,
              name: true,
              framework: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { expiryDate: 'asc' },
  });

  return {
    expiringEvidence: expiringEvidence.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      uploader: item.uploader,
      expiryDate: item.expiryDate,
      daysUntilExpiry: item.expiryDate ? 
        Math.ceil((item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        null,
      controls: item.controlLinks.map(link => ({
        id: link.control.id,
        name: link.control.name,
        framework: link.control.framework,
      })),
    })),
  };
}

async function generateGapAnalysisReport(organizationId: string, frameworkId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { 
    organizationId,
    status: 'GAP',
  };
  if (frameworkId) {
    where.frameworkId = frameworkId;
  }

  const gapControls = await prisma.control.findMany({
    where,
    include: {
      framework: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      evidenceLinks: {
        include: {
          evidence: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
      tasks: {
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { criticality: 'desc' },
      { name: 'asc' },
    ],
  });

  return {
    gapControls: gapControls.map(control => ({
      id: control.id,
      name: control.name,
      description: control.description,
      framework: control.framework,
      criticality: control.criticality,
      owner: control.owner,
      evidenceCount: control.evidenceLinks.length,
      taskCount: control.tasks.length,
      evidence: control.evidenceLinks.map(link => ({
        id: link.evidence.id,
        title: link.evidence.title,
        status: link.evidence.status,
      })),
      tasks: control.tasks.map(task => ({
        id: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        dueDate: task.dueDate,
      })),
    })),
  };
}

async function generateTaskSummaryReport(organizationId: string) {
  const tasks = await prisma.task.findMany({
    where: { organizationId },
    include: {
      control: {
        select: {
          id: true,
          name: true,
          framework: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      evidence: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
  });

  const overdueTasks = tasks.filter(task => 
    task.dueDate && task.dueDate < new Date() && task.status !== 'COMPLETED'
  );

  const dueTodayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString() && task.status !== 'COMPLETED';
  });

  return {
    summary: {
      total: tasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      byStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: tasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    tasks: tasks.map(task => ({
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee,
      creator: task.creator,
      control: task.control,
      evidence: task.evidence,
      comments: task.comments,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    })),
    overdueTasks: overdueTasks.map(task => ({
      id: task.id,
      type: task.type,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee,
      control: task.control,
      evidence: task.evidence,
    })),
    dueTodayTasks: dueTodayTasks.map(task => ({
      id: task.id,
      type: task.type,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee,
      control: task.control,
      evidence: task.evidence,
    })),
  };
}
