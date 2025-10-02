import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { governanceService } from '@/lib/governance-service';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const dashboardType = searchParams.get('dashboardType');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    if (dashboardType === 'EXECUTIVE') {
      const executiveData = await governanceService.getExecutiveDashboardData(organizationId);
      return NextResponse.json(executiveData);
    }

    const dashboards = await governanceService.getDashboardsByOrganization(organizationId, {
      dashboardType: dashboardType || undefined
    });

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error('Error fetching governance dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch governance dashboard' },
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
      dashboardType,
      title,
      description,
      configuration,
      isDefault,
      metadata
    } = body;

    if (!organizationId || !dashboardType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dashboard = await governanceService.createDashboard({
      organizationId,
      dashboardType,
      title,
      description,
      configuration,
      isDefault,
      createdBy: session.user.id,
      metadata
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error('Error creating governance dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create governance dashboard' },
      { status: 500 }
    );
  }
}
