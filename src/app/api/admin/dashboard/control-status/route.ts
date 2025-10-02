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

    // Get control status distribution
    const controls = await prisma.control.findMany({
      where: { organizationId },
      select: { status: true }
    });

    // Calculate distribution
    const statusCounts = controls.reduce((acc, control) => {
      acc[control.status] = (acc[control.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalControls = controls.length;
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalControls > 0 ? (count / totalControls) * 100 : 0
    }));

    return NextResponse.json({
      statusDistribution,
      totalControls,
      summary: {
        met: statusCounts.MET || 0,
        partial: statusCounts.PARTIAL || 0,
        gap: statusCounts.GAP || 0,
        notApplicable: statusCounts.NOT_APPLICABLE || 0
      }
    });

  } catch (error) {
    console.error('Error fetching control status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch control status' },
      { status: 500 }
    );
  }
}
