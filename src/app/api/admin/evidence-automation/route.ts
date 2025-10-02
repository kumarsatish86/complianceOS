import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { EvidenceAutomationEngine } from '@/lib/evidence-automation';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const automatedEvidence = await EvidenceAutomationEngine.getAutomatedEvidence(organizationId, limit);
    const stats = await EvidenceAutomationEngine.getAutomationStats(organizationId);

    return NextResponse.json({ 
      automatedEvidence,
      stats
    });
  } catch (error) {
    console.error('Error fetching automated evidence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automated evidence' },
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
      connectionId,
      organizationId,
      sourceData,
      controlIds
    } = body;

    if (!connectionId || !organizationId || !sourceData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const evidence = await EvidenceAutomationEngine.generateEvidence({
      connectionId,
      organizationId,
      sourceData,
      controlIds: controlIds || [],
      generatedBy: session.user.id
    });

    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    console.error('Error generating evidence:', error);
    return NextResponse.json(
      { error: 'Failed to generate evidence' },
      { status: 500 }
    );
  }
}
