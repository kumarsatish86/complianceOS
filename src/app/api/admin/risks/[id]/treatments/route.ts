import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { riskService } from '@/lib/risk-service';
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
    const treatments = await riskService.getRiskTreatments(id);
    return NextResponse.json(treatments);
  } catch (error) {
    console.error('Error fetching risk treatments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk treatments' },
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
      treatmentStrategy,
      treatmentDescription,
      ownerId,
      startDate,
      targetCompletionDate,
      budgetAllocated,
      metadata
    } = body;

    if (!treatmentStrategy || !treatmentDescription || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const treatment = await riskService.createRiskTreatment({
      riskId: id,
      treatmentStrategy,
      treatmentDescription,
      ownerId,
      startDate: startDate ? new Date(startDate) : undefined,
      targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : undefined,
      budgetAllocated,
      metadata
    });

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error('Error creating risk treatment:', error);
    return NextResponse.json(
      { error: 'Failed to create risk treatment' },
      { status: 500 }
    );
  }
}
