import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApprovalStatus } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/software - List software catalog with filtering and pagination
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
    const approvalStatus = searchParams.get('approvalStatus') as ApprovalStatus;
    const category = searchParams.get('category');
    const publisher = searchParams.get('publisher');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (category) where.category = category;
    if (publisher) where.publisher = publisher;

    const skip = (page - 1) * limit;

    const [software, total] = await Promise.all([
      prisma.softwareCatalog.findMany({
        where,
        skip,
        take: limit,
        include: {
          licenses: {
            select: {
              id: true,
              seatsTotal: true,
              seatsUsed: true,
              expiryDate: true
            }
          },
          _count: {
            select: {
              licenses: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.softwareCatalog.count({ where })
    ]);

    return NextResponse.json({
      software,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching software catalog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/software - Create new software entry
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
      publisher,
      category,
      approvalStatus = 'PENDING',
      description
    } = body;

    if (!organizationId || !name) {
      return NextResponse.json({ 
        error: 'Organization ID and name are required' 
      }, { status: 400 });
    }

    // Check for duplicate software entry within organization
    const existingSoftware = await prisma.softwareCatalog.findFirst({
      where: {
        organizationId,
        name,
        version: version || null
      }
    });

    if (existingSoftware) {
      return NextResponse.json({ 
        error: 'Software with this name and version already exists' 
      }, { status: 400 });
    }

    const software = await prisma.softwareCatalog.create({
      data: {
        organizationId,
        name,
        version,
        publisher,
        category,
        approvalStatus,
        description
      },
      include: {
        licenses: {
          select: {
            id: true,
            seatsTotal: true,
            seatsUsed: true,
            expiryDate: true
          }
        }
      }
    });

    return NextResponse.json(software, { status: 201 });

  } catch (error) {
    console.error('Error creating software entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
