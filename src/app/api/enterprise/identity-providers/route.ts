import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { samlSSOService } from '@/lib/saml-sso-service';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const identityProviders = await prisma.identityProvider.findMany({
      where: { organizationId },
      include: {
        samlSessions: {
          where: { status: 'ACTIVE' },
          take: 5,
        },
        scimEndpoints: {
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(identityProviders);
  } catch (error) {
    console.error('Get identity providers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch identity providers' },
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
      providerType,
      providerName,
      configuration,
      metadataXml,
    } = body;

    if (!organizationId || !providerType || !providerName || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create identity provider
    const identityProvider = await prisma.identityProvider.create({
      data: {
        organizationId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        providerType: providerType as any,
        providerName,
        configuration,
        metadataXml,
        status: 'PENDING',
      },
    });

    // Initialize SAML provider if it's a SAML provider
    if (providerType === 'SAML' || providerType === 'OKTA' || providerType === 'AZURE_AD') {
      try {
        await samlSSOService.initializeProvider({
          id: identityProvider.id,
          organizationId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          providerType: providerType as any,
          providerName,
          metadataXml,
          configuration,
        });
      } catch (error) {
        console.error('SAML provider initialization error:', error);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json(identityProvider);
  } catch (error) {
    console.error('Create identity provider error:', error);
    return NextResponse.json(
      { error: 'Failed to create identity provider' },
      { status: 500 }
    );
  }
}
