import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

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

    const jobs = await prisma.integrationJob.findMany({
      where: { connectionId: id },
      orderBy: { scheduledAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching integration jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration jobs' },
      { status: 500 }
    );
  }
}
