import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IntegrationService } from '@/lib/integration-service';
import { Session } from 'next-auth';
// import { ConnectionStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has access to organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationUsers: true }
    });

    if (!user?.organizationUsers.some(orgUser => orgUser.organizationId === organizationId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const connections = await IntegrationService.getConnections(organizationId);

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
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
      providerId,
      connectionName,
      credentials,
      syncSchedule,
      syncFrequency,
      organizationId
    } = body;

    if (!providerId || !connectionName || !credentials || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has access to organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationUsers: true }
    });

    if (!user?.organizationUsers.some(orgUser => orgUser.organizationId === organizationId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify provider exists
    const provider = await prisma.integrationProvider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const connection = await IntegrationService.createConnection({
      providerId,
      connectionName,
      credentials,
      syncSchedule,
      syncFrequency,
      organizationId,
      createdBy: session.user.id
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
