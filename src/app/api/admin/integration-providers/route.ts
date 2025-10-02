import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await prisma.integrationProvider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            connections: true,
            templates: true
          }
        }
      }
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching integration providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration providers' },
      { status: 500 }
    );
  }
}
