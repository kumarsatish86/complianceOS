/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EvidenceStatus, EvidenceType } from '@prisma/client';
import { requireEvidencePermission, checkEvidencePermission } from '@/lib/evidence-permissions';
import { Session } from 'next-auth';

// GET /api/admin/evidence - List evidence with filtering and pagination
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
    const status = searchParams.get('status') as EvidenceStatus;
    const type = searchParams.get('type') as EvidenceType;
    const uploadedBy = searchParams.get('uploadedBy');
    const expiringSoon = searchParams.get('expiringSoon'); // 'true' for expiring in next 30 days

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    const hasReadPermission = await checkEvidencePermission(organizationId, 'evidence', 'read');
    if (!hasReadPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (uploadedBy) {
      where.addedBy = uploadedBy;
    }

    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        gte: new Date(), // Not expired yet
      };
    }

    // Get total count
    const totalCount = await prisma.evidence.count({ where });

    // Get evidence with pagination
    const evidence = await prisma.evidence.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        controlLinks: {
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
          },
        },
        tagLinks: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            versions: true,
            controlLinks: true,
            approvals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      evidence,
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
    console.error('Error fetching evidence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/evidence - Create new evidence
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      title,
      description,
      fileId,
      url,
      source,
      type,
      status = 'DRAFT',
      expiryDate,
      metadata,
      tags,
    } = body;

    if (!organizationId || !title || !type) {
      return NextResponse.json({
        error: 'Organization ID, title, and type are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireEvidencePermission(organizationId, 'evidence', 'create');

    // Validate that either fileId or url is provided
    if (!fileId && !url) {
      return NextResponse.json({
        error: 'Either fileId or url must be provided'
      }, { status: 400 });
    }

    const newEvidence = await prisma.evidence.create({
      data: {
        organizationId,
        title,
        description,
        fileId,
        url,
        source,
        type,
        status,
        addedBy: session.user.id,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        metadata,
        tagLinks: {
          create: tags?.map((tagId: string) => ({ tagId })) || [],
        },
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tagLinks: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(newEvidence, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating evidence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
