import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface AuditPermission {
  resource: 'audit_runs' | 'audit_controls' | 'audit_findings' | 'audit_packages' | 'guest_auditors';
  action: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'invite';
}

export async function checkAuditPermission(
  organizationId: string
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as unknown as { user?: { id?: string } })?.user?.id) {
      return false;
    }

    // Super admins have all permissions
    if ((session as unknown as { user: { platformRole?: string } }).user.platformRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check organization membership
    const orgUser = await prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId: (session as unknown as { user: { id: string } }).user.id,
      },
      include: {
        user: true,
      },
    });

    if (!orgUser) {
      return false;
    }

    // Check specific permission based on role
    const hasPermission = orgUser.role === 'AUDIT_MANAGER' || orgUser.role === 'COMPLIANCE_OFFICER';

    return hasPermission || false;
  } catch (error) {
    console.error('Error checking audit permission:', error);
    return false;
  }
}

export async function requireAuditPermission(
  organizationId: string
): Promise<void> {
  const hasPermission = await checkAuditPermission(organizationId);
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
}

export async function canModifyAuditRun(
  organizationId: string,
  auditRunId: string
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as unknown as { user?: { id?: string } })?.user?.id) {
      return false;
    }

    // Super admins can modify any audit run
    if ((session as unknown as { user: { platformRole?: string } }).user.platformRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user is the creator of the audit run
    const auditRun = await prisma.auditRun.findFirst({
      where: {
        id: auditRunId,
        organizationId,
        createdBy: (session as unknown as { user: { id: string } }).user.id,
      },
    });

    return !!auditRun;
  } catch (error) {
    console.error('Error checking audit run modification permission:', error);
    return false;
  }
}

export async function canReviewControl(
  organizationId: string,
  auditControlId: string
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as unknown as { user?: { id?: string } })?.user?.id) {
      return false;
    }

    // Super admins can review any control
    if ((session as unknown as { user: { platformRole?: string } }).user.platformRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user is assigned as reviewer or approver
    const auditControl = await prisma.auditControl.findFirst({
      where: {
        id: auditControlId,
        auditRun: {
          organizationId,
        },
        OR: [
          { reviewerId: (session as unknown as { user: { id: string } }).user.id },
          { approverId: (session as unknown as { user: { id: string } }).user.id },
        ],
      },
    });

    return !!auditControl;
  } catch (error) {
    console.error('Error checking control review permission:', error);
    return false;
  }
}

export async function canApproveControl(
  organizationId: string,
  auditControlId: string
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!(session as unknown as { user?: { id?: string } })?.user?.id) {
      return false;
    }

    // Super admins can approve any control
    if ((session as unknown as { user: { platformRole?: string } }).user.platformRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user is assigned as approver
    const auditControl = await prisma.auditControl.findFirst({
      where: {
        id: auditControlId,
        auditRun: {
          organizationId,
        },
        approverId: (session as unknown as { user: { id: string } }).user.id,
      },
    });

    return !!auditControl;
  } catch (error) {
    console.error('Error checking control approval permission:', error);
    return false;
  }
}
