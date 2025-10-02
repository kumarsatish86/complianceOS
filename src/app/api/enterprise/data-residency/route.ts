import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { dataResidencyService } from '@/lib/data-residency-service';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const action = searchParams.get('action');

    if (action === 'regions') {
      const regions = await dataResidencyService.getAvailableRegions();
      return NextResponse.json(regions);
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const residencyStatus = await dataResidencyService.getDataResidencyStatus(organizationId);

    return NextResponse.json(residencyStatus);
  } catch (error) {
    console.error('Get data residency status error:', error);
    return NextResponse.json(
      { error: 'Failed to get data residency status' },
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
      primaryRegion,
      backupRegions,
      residencyRequirements,
      complianceCertifications,
    } = body;

    if (!organizationId || !primaryRegion) {
      return NextResponse.json(
        { error: 'Organization ID and primary region are required' },
        { status: 400 }
      );
    }

    const config = {
      organizationId,
      primaryRegion,
      backupRegions: backupRegions || [],
      residencyRequirements: residencyRequirements || {
        dataTypes: ['personal', 'financial', 'health'],
        retentionPeriods: { personal: 7, financial: 10, health: 10 },
        crossBorderTransfers: false,
        localProcessing: true,
      },
      complianceCertifications: complianceCertifications || [],
    };

    await dataResidencyService.configureDataResidency(config);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Configure data residency error:', error);
    return NextResponse.json(
      { error: 'Failed to configure data residency' },
      { status: 500 }
    );
  }
}
