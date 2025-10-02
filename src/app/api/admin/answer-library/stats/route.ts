import { NextResponse } from 'next/server';
import { AnswerLibraryService } from '@/lib/answer-library-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = 'org-123'; // Replace with actual org ID
    const stats = await AnswerLibraryService.getStats(organizationId);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching answer library stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
