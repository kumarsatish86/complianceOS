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
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('alertType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const result = await governanceService.getAlertsByOrganization(organizationId, {
      status: status || undefined,
      severity: severity || undefined,
      alertType: alertType || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching governance alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch governance alerts' },
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
      alertType,
      title,
      description,
      severity,
      metadata
    } = body;

    if (!organizationId || !alertType || !title || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const alert = await governanceService.createAlert({
      organizationId,
      alertType,
      title,
      description,
      severity,
      metadata
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating governance alert:', error);
    return NextResponse.json(
      { error: 'Failed to create governance alert' },
      { status: 500 }
    );
  }
}
