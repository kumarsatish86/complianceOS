import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IntegrationService } from '@/lib/integration-service';
import { JobType } from '@prisma/client';
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
    const body = await request.json();
    const { jobType = JobType.FULL_SYNC, priority = 5, jobData } = body;

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

    // Check if connection is active
    if (connection.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Connection is not active' },
        { status: 400 }
      );
    }

    const job = await IntegrationService.createSyncJob(
      id,
      jobType,
      priority,
      jobData
    );

    // Execute the job immediately
    const result = await IntegrationService.executeSyncJob(job.id);

    return NextResponse.json({ 
      job,
      result,
      message: result.success ? 'Sync completed successfully' : 'Sync failed'
    });
  } catch (error) {
    console.error('Error executing sync:', error);
    return NextResponse.json(
      { error: 'Failed to execute sync' },
      { status: 500 }
    );
  }
}
