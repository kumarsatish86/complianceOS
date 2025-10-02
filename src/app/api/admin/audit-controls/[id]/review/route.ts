import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canReviewControl, canApproveControl } from '@/lib/audit-permissions';
import { ControlStatus } from '@prisma/client';
import { Session } from 'next-auth';

// PUT /api/admin/audit-controls/[id]/review - Submit control review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const auditControlId = id;
    const body = await request.json();
    const { organizationId, status, notes, evidenceLinks } = body;

    if (!organizationId || !status) {
      return NextResponse.json({
        error: 'Organization ID and status are required'
      }, { status: 400 });
    }

    // Check if user can review this control
    const canReview = await canReviewControl(organizationId, auditControlId);
    if (!canReview) {
      return NextResponse.json({ error: 'Cannot review this control' }, { status: 403 });
    }

    // Get current audit control
    const auditControl = await prisma.auditControl.findFirst({
      where: {
        id: auditControlId,
        auditRun: {
          organizationId,
        },
      },
      include: {
        auditRun: true,
      },
    });

    if (!auditControl) {
      return NextResponse.json({ error: 'Audit control not found' }, { status: 404 });
    }

    if (auditControl.auditRun.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot modify locked audit run' }, { status: 400 });
    }

    const oldStatus = auditControl.status;
    const newStatus = status as ControlStatus;

    // Update audit control
    const updatedAuditControl = await prisma.auditControl.update({
      where: { id: auditControlId },
      data: {
        status: newStatus,
        notes,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        control: {
          select: {
            id: true,
            name: true,
            description: true,
            criticality: true,
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
      },
    });

    // Handle evidence links if provided
    if (evidenceLinks && Array.isArray(evidenceLinks)) {
      // Remove existing evidence links for this control
      await prisma.auditEvidenceLink.deleteMany({
        where: {
          auditRunId: auditControl.auditRunId,
          controlId: auditControl.controlId,
        },
      });

      // Create new evidence links
      if (evidenceLinks.length > 0) {
        await prisma.auditEvidenceLink.createMany({
          data: evidenceLinks.map((evidenceId: string) => ({
            auditRunId: auditControl.auditRunId,
            controlId: auditControl.controlId,
            evidenceId,
            linkedBy: session.user.id,
          })),
        });
      }
    }

    // Update related task status
    if (newStatus === 'SUBMITTED') {
      await prisma.task.updateMany({
        where: {
          auditRunId: auditControl.auditRunId,
          controlId: auditControl.controlId,
          type: 'EVIDENCE_COLLECTION',
        },
        data: {
          status: 'COMPLETED',
          completedBy: session.user.id,
          completedAt: new Date(),
        },
      });
    }

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId: auditControl.auditRunId,
        activityType: 'REVIEWED',
        performedBy: session.user.id,
        targetEntity: 'audit_control',
        oldValue: JSON.stringify({ status: oldStatus }),
        newValue: JSON.stringify({ status: newStatus, notes }),
      },
    });

    return NextResponse.json({
      auditControl: updatedAuditControl,
      message: 'Control review submitted successfully',
    });

  } catch (error: unknown) {
    console.error('Error submitting control review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/audit-controls/[id]/approve - Approve or reject control
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
    const auditControlId = id;
    const body = await request.json();
    const { organizationId, action, comments } = body; // action: 'approve' | 'reject'

    if (!organizationId || !action) {
      return NextResponse.json({
        error: 'Organization ID and action are required'
      }, { status: 400 });
    }

    // Check if user can approve this control
    const canApprove = await canApproveControl(organizationId, auditControlId);
    if (!canApprove) {
      return NextResponse.json({ error: 'Cannot approve this control' }, { status: 403 });
    }

    // Get current audit control
    const auditControl = await prisma.auditControl.findFirst({
      where: {
        id: auditControlId,
        auditRun: {
          organizationId,
        },
      },
      include: {
        auditRun: true,
      },
    });

    if (!auditControl) {
      return NextResponse.json({ error: 'Audit control not found' }, { status: 404 });
    }

    if (auditControl.auditRun.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot modify locked audit run' }, { status: 400 });
    }

    if (auditControl.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Control must be submitted before approval' }, { status: 400 });
    }

    const oldStatus = auditControl.status;
    const newStatus = action === 'approve' ? 'MET' : 'GAP';
    const rejectionReason = action === 'reject' ? comments : null;

    // Update audit control
    const updatedAuditControl = await prisma.auditControl.update({
      where: { id: auditControlId },
      data: {
        status: newStatus,
        approvedAt: action === 'approve' ? new Date() : null,
        rejectionReason,
        updatedAt: new Date(),
      },
      include: {
        control: {
          select: {
            id: true,
            name: true,
            description: true,
            criticality: true,
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
      },
    });

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId: auditControl.auditRunId,
        activityType: action === 'approve' ? 'APPROVED' : 'REJECTED',
        performedBy: session.user.id,
        targetEntity: 'audit_control',
        oldValue: JSON.stringify({ status: oldStatus }),
        newValue: JSON.stringify({ 
          status: newStatus, 
          action, 
          comments: rejectionReason 
        }),
      },
    });

    return NextResponse.json({
      auditControl: updatedAuditControl,
      message: `Control ${action}d successfully`,
    });

  } catch (error: unknown) {
    console.error('Error approving/rejecting control:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
