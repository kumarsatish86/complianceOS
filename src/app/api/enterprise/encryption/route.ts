import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { enterpriseEncryptionService } from '@/lib/enterprise-encryption-service';
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
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const encryptionStatus = await enterpriseEncryptionService.getEncryptionStatus(organizationId);

    return NextResponse.json(encryptionStatus);
  } catch (error) {
    console.error('Get encryption status error:', error);
    return NextResponse.json(
      { error: 'Failed to get encryption status' },
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
      keyManagementType,
      kmsProvider,
      byokEnabled,
      clientSideEncryption,
      keyRotationPolicy,
      complianceRequirements,
    } = body;

    if (!organizationId || !keyManagementType) {
      return NextResponse.json(
        { error: 'Organization ID and key management type are required' },
        { status: 400 }
      );
    }

    const config = {
      organizationId,
      keyManagementType,
      kmsProvider,
      byokEnabled: byokEnabled || false,
      clientSideEncryption: clientSideEncryption || false,
      keyRotationPolicy: keyRotationPolicy || {
        rotationInterval: 90,
        autoRotation: false,
        notificationDays: [7, 3, 1],
      },
      complianceRequirements: complianceRequirements || [],
    };

    await enterpriseEncryptionService.initializeEncryption(config);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Initialize encryption error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize encryption' },
      { status: 500 }
    );
  }
}
