import { NextResponse } from 'next/server';
import { QuestionnaireAnalyticsService } from '@/lib/questionnaire-analytics';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = 'org-123'; // Replace with actual org ID
    const metrics = await QuestionnaireAnalyticsService.getRealTimeMetrics(organizationId);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching questionnaire metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
