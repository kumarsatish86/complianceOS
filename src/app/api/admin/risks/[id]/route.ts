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
    const risk = await riskService.getRiskById(id);
    if (!risk) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Error fetching risk:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
      title,
      description,
      category,
      subcategory,
      likelihoodInherent,
      impactInherent,
      likelihoodResidual,
      impactResidual,
      severityInherent,
      severityResidual,
      status,
      businessUnit,
      metadata
    } = body;

    const risk = await riskService.updateRisk(id, {
      title,
      description,
      category,
      subcategory,
      likelihoodInherent,
      impactInherent,
      likelihoodResidual,
      impactResidual,
      severityInherent,
      severityResidual,
      status,
      businessUnit,
      metadata
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Error updating risk:', error);
    return NextResponse.json(
      { error: 'Failed to update risk' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await riskService.deleteRisk(id);
    return NextResponse.json({ message: 'Risk deleted successfully' });
  } catch (error) {
    console.error('Error deleting risk:', error);
    return NextResponse.json(
      { error: 'Failed to delete risk' },
      { status: 500 }
    );
  }
}
