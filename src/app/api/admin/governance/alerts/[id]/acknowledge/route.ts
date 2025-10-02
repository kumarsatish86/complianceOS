import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { governanceService } from '@/lib/governance-service';
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
    const alert = await governanceService.acknowledgeAlert(id, session.user.id);
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error acknowledging governance alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge governance alert' },
      { status: 500 }
    );
  }
}
