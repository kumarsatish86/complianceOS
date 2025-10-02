import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SystemType, RiskLevel, DataClassification } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/systems - List systems with filtering and pagination
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
    const type = searchParams.get('type') as SystemType;
    const criticality = searchParams.get('criticality') as RiskLevel;
    const dataClassification = searchParams.get('dataClassification') as DataClassification;

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
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (criticality) where.criticality = criticality;
    if (dataClassification) where.dataClassification = dataClassification;

    const skip = (page - 1) * limit;

    const [systems, total] = await Promise.all([
      prisma.system.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              accessRegistry: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.system.count({ where })
    ]);

    return NextResponse.json({
      systems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/systems - Create new system
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
      type,
      ownerUserId,
      criticality = 'MEDIUM',
      dataClassification = 'INTERNAL',
      url,
      description,
      notes
    } = body;

    if (!organizationId || !name || !type) {
      return NextResponse.json({ 
        error: 'Organization ID, name, and type are required' 
      }, { status: 400 });
    }

    // Check for duplicate system name within organization
    const existingSystem = await prisma.system.findFirst({
      where: {
        organizationId,
        name
      }
    });

    if (existingSystem) {
      return NextResponse.json({ 
        error: 'System with this name already exists' 
      }, { status: 400 });
    }

    const system = await prisma.system.create({
      data: {
        organizationId,
        name,
        type,
        ownerUserId,
        criticality,
        dataClassification,
        url,
        description,
        notes
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(system, { status: 201 });

  } catch (error) {
    console.error('Error creating system:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
