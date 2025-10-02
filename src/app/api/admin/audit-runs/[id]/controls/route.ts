import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { ControlStatus } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/audit-runs/[id]/controls - Get audit controls
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const auditRunId = id;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status') as ControlStatus | null;
    const reviewerId = searchParams.get('reviewerId');
    const approverId = searchParams.get('approverId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    await requireAuditPermission(organizationId);

    const where: {
      auditRunId: string;
      auditRun: { organizationId: string };
      status?: ControlStatus;
      reviewerId?: string;
      approverId?: string;
    } = {
      auditRunId,
      auditRun: {
        organizationId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (reviewerId) {
      where.reviewerId = reviewerId;
    }

    if (approverId) {
      where.approverId = approverId;
    }

    const auditControls = await prisma.auditControl.findMany({
      where,
      include: {
        control: {
          select: {
            id: true,
            name: true,
            description: true,
            criticality: true,
            category: true,
            framework: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        auditFindings: {
          select: {
            id: true,
            severity: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            auditFindings: true,
          },
        },
      },
      orderBy: [
        { control: { criticality: 'desc' } },
        { control: { name: 'asc' } },
      ],
    });

    return NextResponse.json({ auditControls });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching audit controls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/audit-runs/[id]/controls - Add controls to audit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const auditRunId = id;
    const body = await request.json();
    const { organizationId, controlIds, reviewerAssignments, approverAssignments } = body;

    if (!organizationId || !controlIds || !Array.isArray(controlIds)) {
      return NextResponse.json({
        error: 'Organization ID and control IDs are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireAuditPermission(organizationId);

    // Verify audit run exists and is not locked
    const auditRun = await prisma.auditRun.findFirst({
      where: {
        id: auditRunId,
        organizationId,
      },
    });

    if (!auditRun) {
      return NextResponse.json({ error: 'Audit run not found' }, { status: 404 });
    }

    if (auditRun.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot modify locked audit run' }, { status: 400 });
    }

    // Create audit controls
    const auditControls = await prisma.auditControl.createMany({
      data: controlIds.map((controlId: string) => ({
        auditRunId,
        controlId,
        reviewerId: reviewerAssignments?.[controlId] || null,
        approverId: approverAssignments?.[controlId] || null,
      })),
      skipDuplicates: true,
    });

    // Create tasks for evidence collection
    await prisma.task.createMany({
      data: controlIds.map((controlId: string) => ({
        organizationId,
        type: 'EVIDENCE_COLLECTION',
        controlId,
        auditRunId,
        auditPhase: 'EXECUTION',
        assigneeId: reviewerAssignments?.[controlId] || null,
        status: 'OPEN',
        priority: 'MEDIUM',
        comments: `Collect evidence for audit: ${auditRun.name}`,
        createdBy: session.user.id,
      })),
    });

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId,
        activityType: 'ASSIGNED',
        performedBy: session.user.id,
        targetEntity: 'audit_controls',
        newValue: JSON.stringify({ controlIds, count: controlIds.length }),
      },
    });

    return NextResponse.json({
      message: `${auditControls.count} controls added to audit successfully`,
      addedCount: auditControls.count,
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error adding controls to audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
