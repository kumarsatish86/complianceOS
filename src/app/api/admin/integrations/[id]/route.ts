/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IntegrationService } from '@/lib/integration-service';
import { Session } from 'next-auth';

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
    const connection = await prisma.integrationConnection.findUnique({
      where: { id },
      include: {
        provider: true,
        creator: true,
        logs: {
          orderBy: { startedAt: 'desc' },
          take: 10
        },
        jobs: {
          orderBy: { scheduledAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            logs: true,
            jobs: true,
            automatedEvidence: true
          }
        }
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Check if user has access to organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationUsers: true }
    });

    if (!user?.organizationUsers.some(orgUser => orgUser.organizationId === connection.organizationId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

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
    const { connectionName, syncSchedule, syncFrequency, credentials } = body;

    const connection = await prisma.integrationConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Check if user has access to organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationUsers: true }
    });

    if (!user?.organizationUsers.some(orgUser => orgUser.organizationId === connection.organizationId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData: any = {};
    if (connectionName) updateData.connectionName = connectionName;
    if (syncSchedule !== undefined) updateData.syncSchedule = syncSchedule;
    if (syncFrequency !== undefined) updateData.syncFrequency = syncFrequency;
    if (credentials) {
      updateData.credentialsEncrypted = IntegrationService['encryptCredentials'](credentials);
    }

    const updatedConnection = await prisma.integrationConnection.update({
      where: { id },
      data: updateData,
      include: {
        provider: true,
        creator: true
      }
    });

    return NextResponse.json({ connection: updatedConnection });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

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
    const connection = await prisma.integrationConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Check if user has access to organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationUsers: true }
    });

    if (!user?.organizationUsers.some(orgUser => orgUser.organizationId === connection.organizationId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await IntegrationService.deleteConnection(id);

    return NextResponse.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
