import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// GET /api/admin/vendors/[id] - Get single vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        assets: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            assetTag: true,
            serial: true
          },
          orderBy: { name: 'asc' }
        },
        contracts: {
          orderBy: { startDate: 'desc' }
        },
        repairs: {
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                assetTag: true
              }
            }
          },
          orderBy: { startedAt: 'desc' }
        },
        _count: {
          select: {
            assets: true,
            contracts: true,
            repairs: true
          }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);

  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/vendors/[id] - Update vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      contact,
      email,
      phone,
      address,
      website,
      riskRating,
      notes
    } = body;

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check for duplicate vendor name within organization
    if (name && name !== existingVendor.name) {
      const duplicateVendor = await prisma.vendor.findFirst({
        where: {
          id: { not: id },
          organizationId: existingVendor.organizationId,
          name
        }
      });

      if (duplicateVendor) {
        return NextResponse.json({ 
          error: 'Vendor with this name already exists' 
        }, { status: 400 });
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
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

    return NextResponse.json(updatedVendor);

  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/vendors/[id] - Delete vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true,
            contracts: true,
            repairs: true
          }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if vendor has unknown dependencies
    if (vendor._count.assets > 0 || vendor._count.contracts > 0 || vendor._count.repairs > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete vendor with associated assets, contracts, or repairs' 
      }, { status: 400 });
    }

    await prisma.vendor.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Vendor deleted successfully' });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
