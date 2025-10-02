import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { AuditRunStatus, AuditType } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/audit-runs - List audit runs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as AuditRunStatus | null;
    const auditType = searchParams.get('auditType') as AuditType | null;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    await requireAuditPermission(organizationId);

    const skip = (page - 1) * limit;
    const where: {
      organizationId: string;
      status?: AuditRunStatus;
      auditType?: AuditType;
    } = { organizationId };

    if (status) {
      where.status = status;
    }

    if (auditType) {
      where.auditType = auditType;
    }

    const [auditRuns, total] = await Promise.all([
      prisma.auditRun.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          framework: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              auditControls: true,
              auditFindings: true,
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditRun.count({ where }),
    ]);

    return NextResponse.json({
      auditRuns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching audit runs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/audit-runs - Create new audit run
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      name,
      description,
      frameworkId,
      scope,
      startDate,
      endDate,
      auditType,
      externalAuditorInfo,
      controlIds,
      reviewerAssignments,
      approverAssignments,
    } = body;

    if (!organizationId || !name || !startDate || !endDate) {
      return NextResponse.json({
        error: 'Organization ID, name, start date, and end date are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireAuditPermission(organizationId);

    // Create audit run
    const auditRun = await prisma.auditRun.create({
      data: {
        organizationId,
        name,
        description,
        frameworkId,
        scope,
        createdBy: session.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        auditType: auditType || 'INTERNAL',
        externalAuditorInfo,
        status: 'DRAFT',
      },
    });

    // Create audit controls if control IDs provided
    if (controlIds && controlIds.length > 0) {
      await prisma.auditControl.createMany({
        data: controlIds.map((controlId: string) => ({
          auditRunId: auditRun.id,
          controlId,
          reviewerId: reviewerAssignments?.[controlId] || null,
          approverId: approverAssignments?.[controlId] || null,
        })),
      });

      // Create tasks for evidence collection
      await prisma.task.createMany({
        data: controlIds.map((controlId: string) => ({
          organizationId,
          type: 'EVIDENCE_COLLECTION',
          controlId,
          auditRunId: auditRun.id,
          auditPhase: 'EXECUTION',
          assigneeId: reviewerAssignments?.[controlId] || null,
          status: 'OPEN',
          priority: 'MEDIUM',
          comments: `Collect evidence for audit: ${name}`,
          createdBy: session.user.id,
        })),
      });
    }

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId: auditRun.id,
        activityType: 'CREATED',
        performedBy: session.user.id,
        targetEntity: 'audit_run',
        newValue: JSON.stringify({ name, status: 'DRAFT' }),
      },
    });

    return NextResponse.json({
      auditRun,
      message: 'Audit run created successfully',
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating audit run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
