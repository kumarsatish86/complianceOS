import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/assets/[id] - Get single asset
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
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        vendor: {
          select: { id: true, name: true, contact: true, email: true, phone: true }
        },
        tagLinks: {
          include: {
            tag: true
          }
        },
        customValues: {
          include: {
            field: true
          }
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' }
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        assignments: {
          include: {
            assignedToUser: {
              select: { id: true, name: true, email: true }
            },
            assignedByUser: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { assignedAt: 'desc' }
        },
        transfers: {
          orderBy: { transferredAt: 'desc' }
        },
        repairs: {
          include: {
            vendor: {
              select: { id: true, name: true }
            }
          },
          orderBy: { startedAt: 'desc' }
        },
        disposals: {
          orderBy: { disposalDate: 'desc' }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);

  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/assets/[id] - Update asset
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
      type,
      name,
      hostname,
      serial,
      assetTag,
      ownerUserId,
      department,
      location,
      status,
      purchaseDate,
      warrantyEnd,
      vendorId,
      notes,
      customFields,
      tags
    } = body;

    // Get current asset to track changes
    const currentAsset = await prisma.asset.findUnique({
      where: { id },
      include: {
        tagLinks: true,
        customValues: true
      }
    });

    if (!currentAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Check for duplicate asset tag or serial within organization
    if (assetTag || serial) {
      const existingAsset = await prisma.asset.findFirst({
        where: {
          id: { not: id },
          organizationId: currentAsset.organizationId,
          OR: [
            ...(assetTag ? [{ assetTag }] : []),
            ...(serial ? [{ serial }] : [])
          ]
        }
      });

      if (existingAsset) {
        return NextResponse.json({ 
          error: 'Asset with this tag or serial number already exists' 
        }, { status: 400 });
      }
    }

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        type,
        name,
        hostname,
        serial,
        assetTag,
        ownerUserId,
        department,
        location,
        status,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        vendorId,
        notes,
        customFields: customFields || {},
        updatedBy: session.user.id,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        vendor: {
          select: { id: true, name: true }
        },
        tagLinks: {
          include: {
            tag: true
          }
        },
        customValues: {
          include: {
            field: true
          }
        }
      }
    });

    // Track changes for activity log
    const changes: string[] = [];
    if (currentAsset.name !== updatedAsset.name) changes.push(`Name: ${currentAsset.name} → ${updatedAsset.name}`);
    if (currentAsset.status !== updatedAsset.status) changes.push(`Status: ${currentAsset.status} → ${updatedAsset.status}`);
    if (currentAsset.ownerUserId !== updatedAsset.ownerUserId) changes.push(`Owner changed`);
    if (currentAsset.department !== updatedAsset.department) changes.push(`Department: ${currentAsset.department} → ${updatedAsset.department}`);

    // Create activity log
    await prisma.assetActivity.create({
      data: {
        assetId: updatedAsset.id,
        action: 'UPDATED',
        details: changes.length > 0 ? `Asset updated: ${changes.join(', ')}` : 'Asset updated',
        userId: session.user.id,
        metadata: { 
          changes,
          previousData: currentAsset,
          newData: updatedAsset
        }
      }
    });

    // Handle tags if provided
    if (tags !== undefined) {
      // Remove existing tag links
      await prisma.assetTagLink.deleteMany({
        where: { assetId: id }
      });

      // Add new tag links
      if (tags.length > 0) {
        await prisma.assetTagLink.createMany({
          data: tags.map((tagId: string) => ({
            assetId: id,
            tagId
          }))
        });
      }
    }

    return NextResponse.json(updatedAsset);

  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/assets/[id] - Delete asset
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
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Check if asset has any dependencies that prevent deletion
    const [, , repairs] = await Promise.all([
      prisma.assetAssignment.count({ where: { assetId: id } }),
      prisma.assetTransfer.count({ where: { assetId: id } }),
      prisma.assetRepair.count({ where: { assetId: id, status: 'IN_PROGRESS' } })
    ]);

    if (repairs > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete asset with active repairs' 
      }, { status: 400 });
    }

    // Create activity log before deletion
    await prisma.assetActivity.create({
      data: {
        assetId: id,
        action: 'DISPOSED',
        details: `Asset deleted: ${asset.name}`,
        userId: session.user.id,
        metadata: { assetData: asset }
      }
    });

    // Delete asset (cascade will handle related records)
    await prisma.asset.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });

  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
