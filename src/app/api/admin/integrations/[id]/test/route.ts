import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IntegrationService } from '@/lib/integration-service';
import { Session } from 'next-auth';

export async function POST(
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

    const isConnected = await IntegrationService.testConnection(id);

    return NextResponse.json({ 
      success: isConnected,
      message: isConnected ? 'Connection test successful' : 'Connection test failed'
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
