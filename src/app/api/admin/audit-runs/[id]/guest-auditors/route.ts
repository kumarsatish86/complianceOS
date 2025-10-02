import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { randomBytes } from 'crypto';
import { Session } from 'next-auth';

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

    // Get guest auditors for this audit run
    const guestAuditors = await prisma.guestAuditor.findMany({
      where: { auditRunId },
      include: {
        inviter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { invitedAt: 'desc' }
    });

    return NextResponse.json({ guestAuditors });

  } catch (error) {
    console.error('Error fetching guest auditors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest auditors' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: auditRunId } = await params;
    const { email, name, role, accessLevel = 'READ_ONLY', expiresInDays = 30 } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

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

    // Check if guest auditor already exists
    const existingGuest = await prisma.guestAuditor.findUnique({
      where: {
        auditRunId_email: {
          auditRunId,
          email
        }
      }
    });

    if (existingGuest) {
      return NextResponse.json({ error: 'Guest auditor already invited' }, { status: 409 });
    }

    // Generate invitation token
    const invitationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create guest auditor
    const guestAuditor = await prisma.guestAuditor.create({
      data: {
        auditRunId,
        email,
        name,
        role,
        accessLevel,
        invitedBy: session.user.id,
        expiresAt
      },
      include: {
        inviter: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId,
        activityType: 'ASSIGNED',
        performedBy: session.user.id,
        targetEntity: 'guest_auditor',
        newValue: JSON.stringify({
          email,
          name,
          role,
          accessLevel,
          invitationToken
        })
      }
    });

    // TODO: Send invitation email with token
    // This would integrate with an email service like SendGrid, AWS SES, etc.

    return NextResponse.json({
      success: true,
      guestAuditor: {
        ...guestAuditor,
        invitationToken // Include token for email sending
      }
    });

  } catch (error) {
    console.error('Error creating guest auditor:', error);
    return NextResponse.json(
      { error: 'Failed to create guest auditor' },
      { status: 500 }
    );
  }
}
