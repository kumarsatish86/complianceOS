import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { Session } from 'next-auth';

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

    // Check permissions
    await requireAuditPermission(organizationId);

    // Get latest framework metrics
    const frameworkMetrics = await prisma.frameworkMetric.findMany({
      where: { organizationId },
      include: {
        framework: true
      },
      orderBy: { snapshotDate: 'desc' },
      distinct: ['frameworkId']
    });

    return NextResponse.json({
      frameworkMetrics,
      totalFrameworks: frameworkMetrics.length,
      averageCoverage: frameworkMetrics.length > 0 
        ? frameworkMetrics.reduce((sum, fm) => sum + fm.coveragePercentage, 0) / frameworkMetrics.length
        : 0
    });

  } catch (error) {
    console.error('Error fetching framework metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch framework metrics' },
      { status: 500 }
    );
  }
}
