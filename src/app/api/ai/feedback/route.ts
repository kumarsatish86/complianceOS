import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queryId, feedbackType, rating, comment, suggestion } = body;

    if (!queryId || !feedbackType) {
      return NextResponse.json(
        { error: 'Query ID and feedback type are required' },
        { status: 400 }
      );
    }

    await aiService.submitFeedback(
      queryId,
      session.user.id,
      feedbackType,
      rating,
      comment,
      suggestion
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
