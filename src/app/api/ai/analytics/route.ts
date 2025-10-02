import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'default-org';

    const analytics = await aiService.getAnalytics(organizationId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('AI analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI analytics' },
      { status: 500 }
    );
  }
}
