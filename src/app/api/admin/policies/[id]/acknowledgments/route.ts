import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { policyService } from '@/lib/policy-service';
import { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await policyService.getPolicyAcknowledgments(id, {
      status: status || undefined,
      userId: userId || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching policy acknowledgments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policy acknowledgments' },
      { status: 500 }
    );
  }
}

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
    const {
      policyVersion,
      userId,
      method,
      ipAddress,
      userAgent,
      metadata
    } = body;

    if (!policyVersion || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const acknowledgment = await policyService.createAcknowledgment({
      policyId: id,
      policyVersion,
      userId,
      method,
      ipAddress,
      userAgent,
      metadata
    });

    return NextResponse.json(acknowledgment, { status: 201 });
  } catch (error) {
    console.error('Error creating policy acknowledgment:', error);
    return NextResponse.json(
      { error: 'Failed to create policy acknowledgment' },
      { status: 500 }
    );
  }
}
