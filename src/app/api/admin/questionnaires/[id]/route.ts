import { NextRequest, NextResponse } from 'next/server';
import { QuestionnaireService } from '@/lib/questionnaire-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
    const includeSuggestions = searchParams.get('includeSuggestions') === 'true';
    const organizationId = 'org-123'; // Replace with actual org ID

    const details = await QuestionnaireService.getQuestionnaireDetails(
      id,
      organizationId,
      includeSuggestions
    );

    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching questionnaire details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire details' },
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
    const { action, ...data } = body;

    switch (action) {
      case 'assign':
        await QuestionnaireService.assignQuestionnaire(
          id,
          data.assignedTo,
          session.user.id
        );
        break;
      
      case 'updateStatus':
        await QuestionnaireService.updateStatus(
          id,
          data.status,
          session.user.id,
          data.notes
        );
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ message: 'Questionnaire updated successfully' });
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to update questionnaire' },
      { status: 500 }
    );
  }
}
