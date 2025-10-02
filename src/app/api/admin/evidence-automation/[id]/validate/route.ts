import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { EvidenceAutomationEngine } from '@/lib/evidence-automation';
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
    const body = await request.json();
    const { approved, comments } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Approved field is required and must be boolean' },
        { status: 400 }
      );
    }

    await EvidenceAutomationEngine.validateEvidence(
      id,
      session.user.id,
      approved,
      comments
    );

    return NextResponse.json({ 
      message: approved ? 'Evidence approved successfully' : 'Evidence rejected successfully'
    });
  } catch (error) {
    console.error('Error validating evidence:', error);
    return NextResponse.json(
      { error: 'Failed to validate evidence' },
      { status: 500 }
    );
  }
}
