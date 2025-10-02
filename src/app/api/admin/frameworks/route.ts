/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FrameworkType } from '@prisma/client';
import { requireEvidencePermission, checkEvidencePermission } from '@/lib/evidence-permissions';
import { Session } from 'next-auth';

// GET /api/admin/frameworks - List frameworks with filtering and pagination
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
    const type = searchParams.get('type') as FrameworkType;
    const isActive = searchParams.get('isActive');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    const hasReadPermission = await checkEvidencePermission(organizationId, 'frameworks', 'read');
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

    if (type) {
      where.type = type;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Get total count
    const totalCount = await prisma.framework.count({ where });

    // Get frameworks with pagination
    const frameworks = await prisma.framework.findMany({
      where,
      include: {
        controls: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            controls: true,
            mappings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      frameworks,
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
    console.error('Error fetching frameworks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/frameworks - Create new framework
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      name,
      version,
      description,
      source,
      type,
      isActive = true,
    } = body;

    if (!organizationId || !name || !type) {
      return NextResponse.json({
        error: 'Organization ID, name, and type are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireEvidencePermission(organizationId, 'frameworks', 'create');

    // Check for duplicate framework name within organization
    const existingFramework = await prisma.framework.findFirst({
      where: {
        organizationId,
        name: name,
      },
    });

    if (existingFramework) {
      return NextResponse.json({ error: 'Framework with this name already exists' }, { status: 409 });
    }

    const newFramework = await prisma.framework.create({
      data: {
        organizationId,
        name,
        version,
        description,
        source,
        type,
        isActive,
      },
    });

    return NextResponse.json(newFramework, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating framework:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
