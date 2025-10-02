import { NextRequest, NextResponse } from 'next/server';
import { QuestionnaireAnalyticsService } from '@/lib/questionnaire-analytics';
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
    const organizationId = 'org-123'; // Replace with actual org ID
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const analytics = await QuestionnaireAnalyticsService.getAnalytics(
      organizationId,
      startDate,
      endDate
    );

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching questionnaire analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
