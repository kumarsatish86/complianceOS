/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// GET /api/admin/licenses - List licenses with filtering and pagination
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
    const softwareId = searchParams.get('softwareId');
    const expiringSoon = searchParams.get('expiringSoon') === 'true';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { software: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (softwareId) where.softwareId = softwareId;

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        gte: new Date()
      };
    }

    const skip = (page - 1) * limit;

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        skip,
        take: limit,
        include: {
          software: {
            select: {
              id: true,
              name: true,
              version: true,
              publisher: true
            }
          },
          renewalVendor: {
            select: {
              id: true,
              name: true
            }
          },
          allocations: {
            include: {
              // Note: LicenseAllocation doesn't have a user relation, only userId field
            }
          },
          _count: {
            select: {
              allocations: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.license.count({ where })
    ]);

    return NextResponse.json({
      licenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/licenses - Create new license
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      softwareId,
      licenseKey,
      seatsTotal,
      purchaseDate,
      expiryDate,
      renewalVendorId,
      filePath,
      notes
    } = body;

    if (!organizationId || !softwareId || !seatsTotal) {
      return NextResponse.json({ 
        error: 'Organization ID, software ID, and total seats are required' 
      }, { status: 400 });
    }

    // Verify software exists
    const software = await prisma.softwareCatalog.findFirst({
      where: {
        id: softwareId,
        organizationId
      }
    });

    if (!software) {
      return NextResponse.json({ 
        error: 'Software not found' 
      }, { status: 404 });
    }

    const license = await prisma.license.create({
      data: {
        organizationId,
        softwareId,
        licenseKey,
        seatsTotal,
        seatsUsed: 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        renewalVendorId,
        filePath,
        notes
      },
      include: {
        software: {
          select: {
            id: true,
            name: true,
            version: true,
            publisher: true
          }
        },
        renewalVendor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(license, { status: 201 });

  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
