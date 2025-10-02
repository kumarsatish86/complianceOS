import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { scimProvisioningService } from '@/lib/scim-provisioning-service';
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
    const { syncType = 'users' } = body; // 'users', 'groups', or 'both'

    let result;

    if (syncType === 'users') {
      result = await scimProvisioningService.syncUsers(id);
    } else if (syncType === 'groups') {
      result = await scimProvisioningService.syncGroups(id);
    } else if (syncType === 'both') {
      const userResult = await scimProvisioningService.syncUsers(id);
      const groupResult = await scimProvisioningService.syncGroups(id);
      result = {
        users: userResult,
        groups: groupResult,
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type. Use: users, groups, or both' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      syncType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SCIM sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync SCIM endpoint' },
      { status: 500 }
    );
  }
}

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
    const syncStatus = await scimProvisioningService.getSyncStatus(id);

    return NextResponse.json(syncStatus);
  } catch (error) {
    console.error('Get SCIM sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get SCIM sync status' },
      { status: 500 }
    );
  }
}
