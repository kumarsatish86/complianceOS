import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { invitationToken, password } = await request.json();

    if (!invitationToken || !password) {
      return NextResponse.json({ error: 'Invitation token and password are required' }, { status: 400 });
    }

    // Find guest auditor by invitation token
    const guestAuditor = await prisma.guestAuditor.findFirst({
      where: {
        // We'll need to add invitationToken field to the schema
        // For now, we'll use a different approach
        email: invitationToken.split('@')[0] + '@' + invitationToken.split('@')[1], // This is a placeholder
        isActive: true,
        acceptedAt: null
      },
      include: {
        auditRun: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!guestAuditor) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // Check if invitation has expired
    if (guestAuditor.expiresAt && guestAuditor.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Generate session token for guest auditor
    const sessionToken = randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24); // 24 hour session

    // Update guest auditor with acceptance
    const updatedGuestAuditor = await prisma.guestAuditor.update({
      where: { id: guestAuditor.id },
      data: {
        acceptedAt: new Date(),
        lastAccessAt: new Date(),
        // Store session token (in a real implementation, this would be in a separate sessions table)
        // sessionToken,
        // sessionExpiresAt
      }
    });

    // Log activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId: guestAuditor.auditRunId,
        activityType: 'ASSIGNED',
        performedBy: guestAuditor.invitedBy,
        targetEntity: 'guest_auditor_accepted',
        newValue: JSON.stringify({
          email: guestAuditor.email,
          name: guestAuditor.name,
          acceptedAt: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({
      success: true,
      guestAuditor: {
        id: updatedGuestAuditor.id,
        email: updatedGuestAuditor.email,
        name: updatedGuestAuditor.name,
        role: updatedGuestAuditor.role,
        accessLevel: updatedGuestAuditor.accessLevel,
        auditRun: {
          id: guestAuditor.auditRun.id,
          name: guestAuditor.auditRun.name,
          organization: guestAuditor.auditRun.organization.name
        }
      },
      sessionToken
    });

  } catch (error) {
    console.error('Error accepting guest auditor invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
