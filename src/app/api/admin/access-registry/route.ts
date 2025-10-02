import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SystemType, AccessStatus } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/access-registry - List user access registry with filtering and pagination
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
    const userId = searchParams.get('userId');
    const systemId = searchParams.get('systemId');
    const systemType = searchParams.get('systemType') as SystemType;
    const status = searchParams.get('status') as AccessStatus;
    const reviewDue = searchParams.get('reviewDue') === 'true';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { systemName: { contains: search, mode: 'insensitive' } },
        { accessLevel: { contains: search, mode: 'insensitive' } },
        { justification: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userId) where.userId = userId;
    if (systemId) where.systemId = systemId;
    if (systemType) where.systemType = systemType;
    if (status) where.status = status;

    if (reviewDue) {
      const now = new Date();
      where.reviewDueDate = {
        lte: now
      };
    }

    const skip = (page - 1) * limit;

    const [accessRegistry, total] = await Promise.all([
      prisma.userAccessRegistry.findMany({
        where,
        skip,
        take: limit,
        include: {
          system: {
            select: {
              id: true,
              name: true,
              type: true,
              criticality: true,
              dataClassification: true
            }
          },
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: { reviewedAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userAccessRegistry.count({ where })
    ]);

    return NextResponse.json({
      accessRegistry,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching access registry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/access-registry - Create new access registry entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      userId,
      systemId,
      systemName,
      systemType,
      accessLevel,
      justification,
      approvedBy,
      reviewDueDate,
      status = 'ACTIVE',
      notes
    } = body;

    if (!organizationId || !userId || !systemName || !systemType || !accessLevel) {
      return NextResponse.json({ 
        error: 'Organization ID, user ID, system name, system type, and access level are required' 
      }, { status: 400 });
    }

    // Check for duplicate access entry
    const existingAccess = await prisma.userAccessRegistry.findFirst({
      where: {
        organizationId,
        userId,
        systemName,
        status: 'ACTIVE'
      }
    });

    if (existingAccess) {
      return NextResponse.json({ 
        error: 'Active access already exists for this user and system' 
      }, { status: 400 });
    }

    const accessEntry = await prisma.userAccessRegistry.create({
      data: {
        organizationId,
        userId,
        systemId,
        systemName,
        systemType,
        accessLevel,
        justification,
        approvedBy,
        approvedAt: approvedBy ? new Date() : null,
        reviewDueDate: reviewDueDate ? new Date(reviewDueDate) : null,
        status,
        notes
      },
      include: {
        system: {
          select: {
            id: true,
            name: true,
            type: true,
            criticality: true,
            dataClassification: true
          }
        }
      }
    });

    return NextResponse.json(accessEntry, { status: 201 });

  } catch (error) {
    console.error('Error creating access registry entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
