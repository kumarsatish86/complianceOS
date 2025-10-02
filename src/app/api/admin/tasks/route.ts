import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TaskStatus, TaskPriority, TaskType } from '@prisma/client';
import { requireEvidencePermission, checkEvidencePermission } from '@/lib/evidence-permissions';
import { Session } from 'next-auth';

// GET /api/admin/tasks - List tasks with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as TaskStatus;
    const priority = searchParams.get('priority') as TaskPriority;
    const type = searchParams.get('type') as TaskType;
    const assigneeId = searchParams.get('assigneeId');
    const controlId = searchParams.get('controlId');
    const evidenceId = searchParams.get('evidenceId');
    const overdue = searchParams.get('overdue'); // 'true' for overdue tasks

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    const hasReadPermission = await checkEvidencePermission(organizationId, 'tasks', 'read');
    if (!hasReadPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { comments: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (type) {
      where.type = type;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (controlId) {
      where.controlId = controlId;
    }

    if (evidenceId) {
      where.evidenceId = evidenceId;
    }

    if (overdue === 'true') {
      where.AND = [
        { dueDate: { lt: new Date() } },
        { status: { not: 'COMPLETED' } },
      ];
    }

    // Get total count
    const totalCount = await prisma.task.count({ where });

    // Get tasks with pagination
    const tasks = await prisma.task.findMany({
      where,
      include: {
        control: {
          select: {
            id: true,
            name: true,
            status: true,
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
            type: true,
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
        completer: {
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
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      type,
      controlId,
      evidenceId,
      assigneeId,
      status = 'OPEN',
      dueDate,
      priority = 'MEDIUM',
      comments,
    } = body;

    if (!organizationId || !type) {
      return NextResponse.json({
        error: 'Organization ID and type are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireEvidencePermission(organizationId, 'tasks', 'create');

    // Validate that either controlId or evidenceId is provided
    if (!controlId && !evidenceId) {
      return NextResponse.json({
        error: 'Either controlId or evidenceId must be provided'
      }, { status: 400 });
    }

    // Verify control belongs to organization if provided
    if (controlId) {
      const control = await prisma.control.findFirst({
        where: {
          id: controlId,
          organizationId: organizationId,
        },
      });

      if (!control) {
        return NextResponse.json({ error: 'Control not found or access denied' }, { status: 404 });
      }
    }

    // Verify evidence belongs to organization if provided
    if (evidenceId) {
      const evidence = await prisma.evidence.findFirst({
        where: {
          id: evidenceId,
          organizationId: organizationId,
        },
      });

      if (!evidence) {
        return NextResponse.json({ error: 'Evidence not found or access denied' }, { status: 404 });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        organizationId,
        type,
        controlId,
        evidenceId,
        assigneeId,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        comments,
        createdBy: session.user.id,
      },
      include: {
        control: {
          select: {
            id: true,
            name: true,
            status: true,
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
            type: true,
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
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
