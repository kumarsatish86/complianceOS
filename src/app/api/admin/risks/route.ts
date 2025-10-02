import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { riskService } from '@/lib/risk-service';
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
    const subcategory = searchParams.get('subcategory');
    const ownerId = searchParams.get('ownerId');
    const severityInherent = searchParams.get('severityInherent');
    const businessUnit = searchParams.get('businessUnit');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const result = await riskService.getRisksByOrganization(organizationId, {
      status: status || undefined,
      category: category || undefined,
      subcategory: subcategory || undefined,
      ownerId: ownerId || undefined,
      severityInherent: severityInherent || undefined,
      businessUnit: businessUnit || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risks' },
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
      subcategory,
      likelihoodInherent,
      impactInherent,
      severityInherent,
      ownerId,
      businessUnit,
      metadata
    } = body;

    if (!organizationId || !title || !category || !likelihoodInherent || !impactInherent || !severityInherent || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const risk = await riskService.createRisk({
      organizationId,
      title,
      description,
      category,
      subcategory,
      likelihoodInherent,
      impactInherent,
      severityInherent,
      ownerId,
      businessUnit,
      metadata
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error('Error creating risk:', error);
    return NextResponse.json(
      { error: 'Failed to create risk' },
      { status: 500 }
    );
  }
}
