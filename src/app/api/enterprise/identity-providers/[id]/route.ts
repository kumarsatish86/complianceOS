import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { samlSSOService } from '@/lib/saml-sso-service';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

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
    const identityProvider = await prisma.identityProvider.findUnique({
      where: { id },
      include: {
        samlSessions: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        scimEndpoints: true,
        provisioningAudit: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    });

    if (!identityProvider) {
      return NextResponse.json(
        { error: 'Identity provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(identityProvider);
  } catch (error) {
    console.error('Get identity provider error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch identity provider' },
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
    const { providerName, configuration, metadataXml, status } = body;

    const identityProvider = await prisma.identityProvider.update({
      where: { id },
      data: {
        providerName,
        configuration,
        metadataXml,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: status as any,
        updatedAt: new Date(),
      },
    });

    // Reinitialize SAML provider if configuration changed
    if (configuration && (identityProvider.providerType === 'SAML' || identityProvider.providerType === 'OKTA' || identityProvider.providerType === 'AZURE_AD')) {
      try {
        await samlSSOService.initializeProvider({
          id: identityProvider.id,
          organizationId: identityProvider.organizationId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          providerType: identityProvider.providerType as any,
          providerName: identityProvider.providerName,
          metadataXml: identityProvider.metadataXml || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          configuration: identityProvider.configuration as any,
        });
      } catch (error) {
        console.error('SAML provider reinitialization error:', error);
      }
    }

    return NextResponse.json(identityProvider);
  } catch (error) {
    console.error('Update identity provider error:', error);
    return NextResponse.json(
      { error: 'Failed to update identity provider' },
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
    // Check if there are active sessions
    const activeSessions = await prisma.sAMLSession.count({
      where: {
        identityProviderId: id,
        status: 'ACTIVE',
      },
    });

    if (activeSessions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete identity provider with active sessions' },
        { status: 400 }
      );
    }

    await prisma.identityProvider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete identity provider error:', error);
    return NextResponse.json(
      { error: 'Failed to delete identity provider' },
      { status: 500 }
    );
  }
}
