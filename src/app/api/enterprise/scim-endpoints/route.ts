import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { scimProvisioningService } from '@/lib/scim-provisioning-service';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const scimEndpoints = await prisma.sCIMEndpoint.findMany({
      where: { organizationId },
      include: {
        identityProvider: {
          select: {
            id: true,
            providerName: true,
            providerType: true,
          },
        },
        provisioningAudit: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scimEndpoints);
  } catch (error) {
    console.error('Get SCIM endpoints error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SCIM endpoints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      identityProviderId,
      endpointUrl,
      bearerToken,
      syncFrequency,
    } = body;

    if (!organizationId || !identityProviderId || !endpointUrl || !bearerToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create SCIM endpoint
    const scimEndpoint = await prisma.sCIMEndpoint.create({
      data: {
        organizationId,
        identityProviderId,
        endpointUrl,
        bearerToken, // Will be encrypted by the service
        syncFrequency: syncFrequency || 300, // Default 5 minutes
        syncStatus: 'PENDING',
      },
    });

    // Initialize SCIM endpoint
    try {
      await scimProvisioningService.createEndpoint({
        id: scimEndpoint.id,
        organizationId,
        endpointUrl,
        bearerToken,
        syncFrequency: syncFrequency || 300,
      });
    } catch (error) {
      console.error('SCIM endpoint initialization error:', error);
      // Update status to error
      await prisma.sCIMEndpoint.update({
        where: { id: scimEndpoint.id },
        data: {
          syncStatus: 'FAILED',
          errorLog: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return NextResponse.json(scimEndpoint);
  } catch (error) {
    console.error('Create SCIM endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to create SCIM endpoint' },
      { status: 500 }
    );
  }
}
