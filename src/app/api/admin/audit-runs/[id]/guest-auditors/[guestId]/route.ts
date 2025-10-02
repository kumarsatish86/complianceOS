import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { Session } from 'next-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: auditRunId, guestId } = await params;

    // Get audit run to check permissions
    const auditRun = await prisma.auditRun.findUnique({
      where: { id: auditRunId },
      include: { organization: true }
    });

    if (!auditRun) {
      return NextResponse.json({ error: 'Audit run not found' }, { status: 404 });
    }

    // Check permissions
    await requireAuditPermission(auditRun.organizationId);

    // Get guest auditor
    const guestAuditor = await prisma.guestAuditor.findUnique({
      where: { id: guestId }
    });

    if (!guestAuditor) {
      return NextResponse.json({ error: 'Guest auditor not found' }, { status: 404 });
    }

    // Deactivate guest auditor instead of deleting to maintain audit trail
    await prisma.guestAuditor.update({
      where: { id: guestId },
      data: {
        isActive: false
      }
    });

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId,
        activityType: 'ASSIGNED',
        performedBy: session.user.id,
        targetEntity: 'guest_auditor_revoked',
        newValue: JSON.stringify({
          email: guestAuditor.email,
          name: guestAuditor.name,
          revokedAt: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Guest auditor access revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking guest auditor access:', error);
    return NextResponse.json(
      { error: 'Failed to revoke guest auditor access' },
      { status: 500 }
    );
  }
}
