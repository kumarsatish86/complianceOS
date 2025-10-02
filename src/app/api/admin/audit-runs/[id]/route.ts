import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission, canModifyAuditRun } from '@/lib/audit-permissions';
import { Session } from 'next-auth';
// import { AuditRunStatus } from '@prisma/client';

// GET /api/admin/audit-runs/[id] - Get audit run details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: auditRunId } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    await requireAuditPermission(organizationId);

    const auditRun = await prisma.auditRun.findFirst({
      where: {
        id: auditRunId,
        organizationId,
      },
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
            version: true,
          },
        },
        auditControls: {
          include: {
            control: {
              select: {
                id: true,
                name: true,
                description: true,
                criticality: true,
                category: true,
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
          },
        },
        auditFindings: {
          include: {
            control: {
              select: {
                id: true,
                name: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            control: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        auditActivities: {
          include: {
            performer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            auditControls: true,
            auditFindings: true,
            tasks: true,
            auditEvidenceLinks: true,
          },
        },
      },
    });

    if (!auditRun) {
      return NextResponse.json({ error: 'Audit run not found' }, { status: 404 });
    }

    return NextResponse.json({ auditRun });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching audit run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/audit-runs/[id] - Update audit run
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: auditRunId } = await params;
    const body = await request.json();
    const { organizationId, ...updateData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user can modify this audit run
    const canModify = await canModifyAuditRun(organizationId, auditRunId);
    if (!canModify) {
      return NextResponse.json({ error: 'Cannot modify this audit run' }, { status: 403 });
    }

    // Check if audit run is locked
    const existingAuditRun = await prisma.auditRun.findFirst({
      where: {
        id: auditRunId,
        organizationId,
      },
    });

    if (!existingAuditRun) {
      return NextResponse.json({ error: 'Audit run not found' }, { status: 404 });
    }

    if (existingAuditRun.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot modify locked audit run' }, { status: 400 });
    }

    // Update audit run
    const updatedAuditRun = await prisma.auditRun.update({
      where: { id: auditRunId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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
      },
    });

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId,
        activityType: 'UPDATED',
        performedBy: session.user.id,
        targetEntity: 'audit_run',
        oldValue: JSON.stringify(existingAuditRun),
        newValue: JSON.stringify(updatedAuditRun),
      },
    });

    return NextResponse.json({
      auditRun: updatedAuditRun,
      message: 'Audit run updated successfully',
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error updating audit run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/audit-runs/[id] - Delete audit run
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: auditRunId } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check delete permission
    await requireAuditPermission(organizationId);

    // Check if user can modify this audit run
    const canModify = await canModifyAuditRun(organizationId, auditRunId);
    if (!canModify) {
      return NextResponse.json({ error: 'Cannot delete this audit run' }, { status: 403 });
    }

    // Check if audit run is locked
    const existingAuditRun = await prisma.auditRun.findFirst({
      where: {
        id: auditRunId,
        organizationId,
      },
    });

    if (!existingAuditRun) {
      return NextResponse.json({ error: 'Audit run not found' }, { status: 404 });
    }

    if (existingAuditRun.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot delete locked audit run' }, { status: 400 });
    }

    // Delete audit run (cascade will handle related records)
    await prisma.auditRun.delete({
      where: { id: auditRunId },
    });

    return NextResponse.json({
      message: 'Audit run deleted successfully',
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error deleting audit run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
