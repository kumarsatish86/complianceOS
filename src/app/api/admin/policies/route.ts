import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { policyService } from '@/lib/policy-service';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const policyType = searchParams.get('policyType');
    const ownerId = searchParams.get('ownerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const result = await policyService.getPoliciesByOrganization(organizationId, {
      status: status || undefined,
      category: category || undefined,
      policyType: policyType || undefined,
      ownerId: ownerId || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
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
      organizationId,
      title,
      description,
      category,
      policyType,
      ownerId,
      reviewerId,
      approverId,
      effectiveDate,
      nextReviewDate,
      retentionPeriod,
      fileId,
      metadata
    } = body;

    if (!organizationId || !title || !category || !policyType || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const policy = await policyService.createPolicy({
      organizationId,
      title,
      description,
      category,
      policyType,
      ownerId,
      reviewerId,
      approverId,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : undefined,
      retentionPeriod,
      fileId,
      metadata
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Error creating policy:', error);
    return NextResponse.json(
      { error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}
