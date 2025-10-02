import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AssetType, AssetStatus } from '@prisma/client';
import { requireAssetPermission, checkAssetPermission } from '@/lib/asset-permissions';
import { Session } from 'next-auth';

// GET /api/admin/assets - List assets with filtering and pagination
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
    const type = searchParams.get('type') as AssetType;
    const status = searchParams.get('status') as AssetStatus;
    const department = searchParams.get('department');
    const ownerId = searchParams.get('ownerId');
    const vendorId = searchParams.get('vendorId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    const hasReadPermission = await checkAssetPermission(organizationId, 'assets', 'read');
    if (!hasReadPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { hostname: { contains: search, mode: 'insensitive' } },
        { serial: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (department) where.department = department;
    if (ownerId) where.ownerUserId = ownerId;
    if (vendorId) where.vendorId = vendorId;

    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
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
          },
          _count: {
            select: {
              attachments: true,
              activities: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ]);

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      type,
      name,
      hostname,
      serial,
      assetTag,
      ownerUserId,
      department,
      location,
      status = 'IN_USE',
      purchaseDate,
      warrantyEnd,
      vendorId,
      notes,
      customFields,
      tags
    } = body;

    if (!organizationId || !type || !name) {
      return NextResponse.json({ 
        error: 'Organization ID, type, and name are required' 
      }, { status: 400 });
    }

    // Check create permission
    await requireAssetPermission(organizationId, 'assets', 'create');

    // Check for duplicate asset tag or serial within organization
    if (assetTag || serial) {
      const existingAsset = await prisma.asset.findFirst({
        where: {
          organizationId,
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

    const asset = await prisma.asset.create({
      data: {
        organizationId,
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
        createdBy: session.user.id,
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

    // Create activity log
    await prisma.assetActivity.create({
      data: {
        assetId: asset.id,
        action: 'CREATED',
        details: `Asset created: ${asset.name}`,
        userId: session.user.id,
        metadata: { assetData: asset }
      }
    });

    // Handle tags if provided
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await prisma.assetTagLink.create({
          data: {
            assetId: asset.id,
            tagId
          }
        });
      }
    }

    return NextResponse.json(asset, { status: 201 });

  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
