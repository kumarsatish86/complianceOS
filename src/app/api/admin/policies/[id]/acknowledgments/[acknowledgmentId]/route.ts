import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { policyService } from '@/lib/policy-service';
import { Session } from 'next-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; acknowledgmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { acknowledgmentId } = await params;
    const body = await request.json();
    const { method, ipAddress, userAgent } = body;

    const acknowledgment = await policyService.acknowledgePolicy(
      acknowledgmentId,
      method,
      ipAddress,
      userAgent
    );

    return NextResponse.json(acknowledgment);
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge policy' },
      { status: 500 }
    );
  }
}
