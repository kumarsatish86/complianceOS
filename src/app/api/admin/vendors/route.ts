import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RiskLevel } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/vendors - List vendors with filtering and pagination
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
    const riskRating = searchParams.get('riskRating') as RiskLevel;

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
        { contact: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (riskRating) where.riskRating = riskRating;

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              assets: true,
              contracts: true,
              repairs: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.vendor.count({ where })
    ]);

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/vendors - Create new vendor
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
      contact,
      email,
      phone,
      address,
      website,
      riskRating = 'MEDIUM',
      notes
    } = body;

    if (!organizationId || !name) {
      return NextResponse.json({ 
        error: 'Organization ID and name are required' 
      }, { status: 400 });
    }

    // Check for duplicate vendor name within organization
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        organizationId,
        name
      }
    });

    if (existingVendor) {
      return NextResponse.json({ 
        error: 'Vendor with this name already exists' 
      }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        organizationId,
        name,
        contact,
        email,
        phone,
        address,
        website,
        riskRating,
        notes
      }
    });

    return NextResponse.json(vendor, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
