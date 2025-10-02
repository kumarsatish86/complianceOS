/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ControlStatus, ControlCategory, ControlCriticality } from '@prisma/client';
import { requireEvidencePermission, checkEvidencePermission } from '@/lib/evidence-permissions';
import { Session } from 'next-auth';

// GET /api/admin/controls - List controls with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const frameworkId = searchParams.get('frameworkId');
    const status = searchParams.get('status') as ControlStatus;
    const category = searchParams.get('category') as ControlCategory;
    const criticality = searchParams.get('criticality') as ControlCriticality;
    const ownerId = searchParams.get('ownerId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    const hasReadPermission = await checkEvidencePermission(organizationId, 'controls', 'read');
    if (!hasReadPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (frameworkId) {
      where.frameworkId = frameworkId;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (criticality) {
      where.criticality = criticality;
    }

    if (ownerId) {
      where.ownerUserId = ownerId;
    }

    // Get total count
    const totalCount = await prisma.control.count({ where });

    // Get controls with pagination
    const controls = await prisma.control.findMany({
      where,
      include: {
        framework: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            evidenceLinks: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      controls,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching controls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/controls - Create new control
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      frameworkId,
      name,
      description,
      category,
      status = 'GAP',
      criticality = 'MEDIUM',
      ownerUserId,
      nextReviewDate,
    } = body;

    if (!organizationId || !frameworkId || !name || !category) {
      return NextResponse.json({
        error: 'Organization ID, framework ID, name, and category are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireEvidencePermission(organizationId, 'controls', 'create');

    // Verify framework belongs to organization
    const framework = await prisma.framework.findFirst({
      where: {
        id: frameworkId,
        organizationId: organizationId,
      },
    });

    if (!framework) {
      return NextResponse.json({ error: 'Framework not found or access denied' }, { status: 404 });
    }

    const newControl = await prisma.control.create({
      data: {
        organizationId,
        frameworkId,
        name,
        description,
        category,
        status,
        criticality,
        ownerUserId,
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        framework: {
          select: {
            id: true,
            name: true,
            type: true,
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
    });

    return NextResponse.json(newControl, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating control:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
