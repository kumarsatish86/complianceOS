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
    const assessments = await riskService.getRiskAssessments(id);
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching risk assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk assessments' },
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
      assessedBy,
      methodology,
      likelihoodScore,
      impactScore,
      severityCalculation,
      confidenceLevel,
      notes,
      nextAssessmentDue,
      approvedBy,
      metadata
    } = body;

    if (!assessedBy || !methodology || !likelihoodScore || !impactScore || !severityCalculation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const assessment = await riskService.createRiskAssessment({
      riskId: id,
      assessedBy,
      methodology,
      likelihoodScore,
      impactScore,
      severityCalculation,
      confidenceLevel,
      notes,
      nextAssessmentDue: nextAssessmentDue ? new Date(nextAssessmentDue) : undefined,
      approvedBy,
      metadata
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating risk assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create risk assessment' },
      { status: 500 }
    );
  }
}
