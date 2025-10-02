import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { enterpriseEncryptionService } from '@/lib/enterprise-encryption-service';
import { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const newKey = await enterpriseEncryptionService.rotateEncryptionKey(organizationId);

    return NextResponse.json({
      success: true,
      newKey: {
        id: newKey.id,
        keyType: newKey.keyType,
        version: newKey.version,
        createdAt: newKey.createdAt,
        expiresAt: newKey.expiresAt,
      },
    });
  } catch (error) {
    console.error('Rotate encryption key error:', error);
    return NextResponse.json(
      { error: 'Failed to rotate encryption key' },
      { status: 500 }
    );
  }
}
