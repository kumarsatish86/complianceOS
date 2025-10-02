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
    const { queryText, sessionId, context } = body;

    if (!queryText) {
      return NextResponse.json({ error: 'Query text is required' }, { status: 400 });
    }

    // Get organization ID from session or request
    const organizationId = body.organizationId || 'default-org'; // TODO: Get from session

    const response = await aiService.processQuery({
      organizationId,
      userId: session.user.id,
      sessionId,
      queryText,
      context,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI query error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI query' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    // const organizationId = searchParams.get('organizationId') || 'default-org';

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const history = await aiService.getSessionHistory(sessionId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('AI query history error:', error);
    return NextResponse.json(
      { error: 'Failed to get query history' },
      { status: 500 }
    );
  }
}
