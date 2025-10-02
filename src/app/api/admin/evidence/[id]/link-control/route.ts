import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireEvidencePermission } from '@/lib/evidence-permissions';
import { Session } from 'next-auth';

// POST /api/admin/evidence/[id]/link-control - Link evidence to control
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: evidenceId } = await params;
    const body = await request.json();
    const { organizationId, controlId, linkType = 'supports', effectivenessRating = 1.0, notes } = body;

    if (!organizationId || !controlId) {
      return NextResponse.json({
        error: 'Organization ID and control ID are required'
      }, { status: 400 });
    }

    // Check update permission
    await requireEvidencePermission(organizationId, 'evidence', 'update');

    // Verify evidence belongs to organization
    const evidence = await prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        organizationId,
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    // Verify control belongs to organization
    const control = await prisma.control.findFirst({
      where: {
        id: controlId,
        organizationId,
      },
    });

    if (!control) {
      return NextResponse.json({ error: 'Control not found' }, { status: 404 });
    }

    // Check if link already exists
    const existingLink = await prisma.controlEvidenceLink.findUnique({
      where: {
        controlId_evidenceId: {
          controlId,
          evidenceId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json({ error: 'Evidence is already linked to this control' }, { status: 409 });
    }

    // Create the link
    const link = await prisma.controlEvidenceLink.create({
      data: {
        controlId,
        evidenceId,
        linkedBy: session.user.id,
        linkType,
        effectivenessRating,
        notes,
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
        linker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      link,
      message: 'Evidence linked to control successfully',
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error linking evidence to control:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/evidence/[id]/link-control - Unlink evidence from control
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: evidenceId } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const controlId = searchParams.get('controlId');

    if (!organizationId || !controlId) {
      return NextResponse.json({
        error: 'Organization ID and control ID are required'
      }, { status: 400 });
    }

    // Check update permission
    await requireEvidencePermission(organizationId, 'evidence', 'update');

    // Find and delete the link
    const link = await prisma.controlEvidenceLink.findUnique({
      where: {
        controlId_evidenceId: {
          controlId,
          evidenceId,
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await prisma.controlEvidenceLink.delete({
      where: {
        controlId_evidenceId: {
          controlId,
          evidenceId,
        },
      },
    });

    return NextResponse.json({
      message: 'Evidence unlinked from control successfully',
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error unlinking evidence from control:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
