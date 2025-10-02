import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type EvidenceModule = 'frameworks' | 'controls' | 'evidence' | 'tasks' | 'approvals' | 'reports' | 'audit';
type EvidenceAction = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export';

export async function checkEvidencePermission(
  organizationId: string,
  module: EvidenceModule,
  action: EvidenceAction
): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return false;
  }

  // Super admins have all permissions
  if (session.user.platformRole === 'SUPER_ADMIN') {
    return true;
  }

  // For organization-specific roles, check if the user is part of the organization
  const organizationUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: organizationId,
      },
    },
    include: {
      organization: {
        include: {
          roles: true,
        },
      },
    },
  });

  if (!organizationUser) {
    return false;
  }

  // Check organization roles for permissions
  const userRole = organizationUser.role;
  const orgRole = organizationUser.organization?.roles.find(r => r.name === userRole);

  if (orgRole && orgRole.permissions.includes(`${module}:${action}`)) {
    return true;
  }

  return false;
}

export async function requireEvidencePermission(
  organizationId: string,
  module: EvidenceModule,
  action: EvidenceAction
) {
  const hasPermission = await checkEvidencePermission(organizationId, module, action);
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
}

// Special permission checks for evidence-specific operations
export async function canApproveEvidence(organizationId: string, evidenceId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return false;
  }

  // Check if user has approval permission
  const hasApprovalPermission = await checkEvidencePermission(organizationId, 'approvals', 'approve');
  if (!hasApprovalPermission) {
    return false;
  }

  // Check if evidence belongs to the organization
  const evidence = await prisma.evidence.findFirst({
    where: {
      id: evidenceId,
      organizationId: organizationId,
    },
  });

  return !!evidence;
}

export async function canModifyEvidence(organizationId: string, evidenceId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return false;
  }

  // Check if user has update permission
  const hasUpdatePermission = await checkEvidencePermission(organizationId, 'evidence', 'update');
  if (!hasUpdatePermission) {
    return false;
  }

  // Check if evidence belongs to the organization and is not locked
  const evidence = await prisma.evidence.findFirst({
    where: {
      id: evidenceId,
      organizationId: organizationId,
      status: {
        not: 'LOCKED'
      }
    },
  });

  return !!evidence;
}

export async function canViewEvidence(organizationId: string, evidenceId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return false;
  }

  // Check if user has read permission
  const hasReadPermission = await checkEvidencePermission(organizationId, 'evidence', 'read');
  if (!hasReadPermission) {
    return false;
  }

  // Check if evidence belongs to the organization
  const evidence = await prisma.evidence.findFirst({
    where: {
      id: evidenceId,
      organizationId: organizationId,
    },
  });

  return !!evidence;
}
