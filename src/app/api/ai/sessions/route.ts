import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, organizationId } = body;

    const sessionId = await aiService.createSession(
      organizationId || 'default-org',
      session.user.id,
      title
    );

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('AI session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI session' },
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
    const organizationId = searchParams.get('organizationId') || 'default-org';

    // Get user's AI sessions
    const sessions = await prisma.aISession.findMany({
      where: {
        organizationId,
        userId: session.user.id,
      },
      orderBy: { lastActivity: 'desc' },
      include: {
        queries: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('AI sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI sessions' },
      { status: 500 }
    );
  }
}
