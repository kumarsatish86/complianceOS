import { PrismaClient } from '@prisma/client';
import * as saml from 'passport-saml';
import * as xml2js from 'xml2js';
import * as crypto from 'crypto';
// import * as forge from 'node-forge'; // Unused import removed

const prisma = new PrismaClient();

export interface SAMLProviderConfig {
  id: string;
  organizationId: string;
  providerType: 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE' | 'PING_IDENTITY' | 'ADFS' | 'CUSTOM';
  providerName: string;
  metadataXml: string;
  configuration: {
    entryPoint: string;
    issuer: string;
    cert: string;
    callbackUrl: string;
    logoutUrl?: string;
    additionalParams?: Record<string, unknown>;
  };
}

export interface SAMLAssertion {
  assertionId: string;
  issuer: string;
  audience: string;
  subject: string;
  attributes: Record<string, unknown>;
  issuedAt: Date;
  expiresAt: Date;
  sessionIndex?: string;
}

export interface SAMLSessionData {
  sessionId: string;
  assertionId: string;
  userId: string;
  organizationId: string;
  identityProviderId: string;
  attributes: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export class SAMLSSOService {
  private samlStrategies: Map<string, saml.Strategy> = new Map();

  /**
   * Initialize SAML provider configuration
   */
  async initializeProvider(config: SAMLProviderConfig): Promise<void> {
    try {
      const samlConfig = {
        entryPoint: config.configuration.entryPoint,
        issuer: config.configuration.issuer,
        cert: config.configuration.cert,
        callbackUrl: config.configuration.callbackUrl,
        logoutUrl: config.configuration.logoutUrl,
        additionalParams: config.configuration.additionalParams ? Object.fromEntries(
          Object.entries(config.configuration.additionalParams).map(([key, value]) => [key, String(value)])
        ) : undefined,
        // Security settings
        signatureAlgorithm: 'sha256' as const,
        digestAlgorithm: 'sha256' as const,
        // Attribute mapping
        attributeConsumingServiceIndex: '1',
        // Session management
        disableRequestedAuthnContext: true,
        // Additional security
        skipRequestCompression: false,
        ...(config.configuration.additionalParams ? Object.fromEntries(
          Object.entries(config.configuration.additionalParams).map(([key, value]) => [key, String(value)])
        ) : {}),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const strategy = new saml.Strategy(samlConfig, async (profile: any, done: (error: any, user?: any) => void) => {
        try {
          const user = await this.handleSAMLResponse(profile, config);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      });

      this.samlStrategies.set(config.id, strategy);
      
      // Update provider status in database
      await prisma.identityProvider.update({
        where: { id: config.id },
        data: { 
          status: 'ACTIVE',
          configuration: samlConfig,
          metadataXml: config.metadataXml,
        },
      });

    } catch (error) {
      console.error('SAML provider initialization error:', error);
      await prisma.identityProvider.update({
        where: { id: config.id },
        data: { status: 'ERROR' },
      });
      throw error;
    }
  }

  /**
   * Handle SAML response and create session
   */
  private async handleSAMLResponse(profile: Record<string, unknown>, config: SAMLProviderConfig): Promise<SAMLSessionData> {
    try {
      // Extract user information from SAML profile
      const email = (profile.email || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']) as string;
      const name = (profile.name || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) as string;
      const firstName = (profile.firstName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']) as string;
      const lastName = (profile.lastName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']) as string;

      if (!email) {
        throw new Error('Email not found in SAML assertion');
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Just-In-Time (JIT) user provisioning
        user = await prisma.user.create({
          data: {
            email,
            name: name || `${firstName || ''} ${lastName || ''}`.trim(),
            emailVerified: new Date(),
          },
        });

        // Create organization user relationship
        await prisma.organizationUser.create({
          data: {
            userId: user.id,
            organizationId: config.organizationId,
            role: 'USER', // Default role, can be mapped from SAML attributes
            isActive: true,
          },
        });
      }

      // Create SAML session
      const sessionId = crypto.randomUUID();
      const assertionId = (profile.sessionIndex || crypto.randomUUID()) as string;
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      const sessionData: SAMLSessionData = {
        sessionId,
        assertionId,
        userId: user.id,
        organizationId: config.organizationId,
        identityProviderId: config.id,
        attributes: profile,
        expiresAt,
      };

      // Store SAML session in database
      await prisma.sAMLSession.create({
        data: {
          id: sessionId,
          organizationId: config.organizationId,
          userId: user.id,
          identityProviderId: config.id,
          sessionId,
          assertionId,
          issuedAt: new Date(),
          expiresAt,
          attributes: JSON.parse(JSON.stringify(profile)),
          status: 'ACTIVE',
        },
      });

      // Log provisioning audit
      await prisma.provisioningAudit.create({
        data: {
          organizationId: config.organizationId,
          identityProviderId: config.id,
          action: 'CREATE',
          userId: user.id,
          performedBy: 'SAML_SSO',
          details: {
            email,
            name,
            firstName,
            lastName,
            provider: config.providerType,
          },
          result: 'SUCCESS',
        },
      });

      return sessionData;

    } catch (error) {
      console.error('SAML response handling error:', error);
      
      // Log failed provisioning attempt
      await prisma.provisioningAudit.create({
        data: {
          organizationId: config.organizationId,
          identityProviderId: config.id,
          action: 'CREATE',
          performedBy: 'SAML_SSO',
          details: { error: (error as Error).message },
          result: 'FAILURE',
          errorMessage: (error as Error).message,
        },
      });

      throw error;
    }
  }

  /**
   * Validate SAML assertion
   */
  async validateAssertion(assertion: string, _providerId: string): Promise<SAMLAssertion> {
    try {
      const provider = await prisma.identityProvider.findUnique({
        where: { id: _providerId },
      });

      if (!provider) {
        throw new Error('SAML provider not found');
      }

      // Parse SAML assertion
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(assertion);

      // Extract assertion data
      const assertionData = result['saml:Assertion'] || result['saml2:Assertion'];
      if (!assertionData) {
        throw new Error('Invalid SAML assertion format');
      }

      const assertionId = assertionData[0]['$']['ID'];
      const issuer = assertionData[0]['saml:Issuer']?.[0] || assertionData[0]['saml2:Issuer']?.[0];
      const audience = assertionData[0]['saml:Audience']?.[0] || assertionData[0]['saml2:Audience']?.[0];
      const subject = assertionData[0]['saml:Subject']?.[0] || assertionData[0]['saml2:Subject']?.[0];
      const attributes = assertionData[0]['saml:AttributeStatement']?.[0] || assertionData[0]['saml2:AttributeStatement']?.[0];

      // Parse timestamps
      const conditions = assertionData[0]['saml:Conditions']?.[0] || assertionData[0]['saml2:Conditions']?.[0];
      const issuedAt = new Date(conditions?.['$']?.['NotBefore'] || Date.now());
      const expiresAt = new Date(conditions?.['$']?.['NotOnOrAfter'] || Date.now() + 8 * 60 * 60 * 1000);

      // Extract attributes
      const attributeMap: Record<string, unknown> = {};
      if (attributes) {
        const attributeList = attributes['saml:Attribute'] || attributes['saml2:Attribute'];
        if (attributeList) {
          for (const attr of attributeList) {
            const name = attr['$']['Name'];
            const value = attr['saml:AttributeValue']?.[0] || attr['saml2:AttributeValue']?.[0];
            attributeMap[name] = value;
          }
        }
      }

      return {
        assertionId,
        issuer,
        audience,
        subject,
        attributes: attributeMap,
        issuedAt,
        expiresAt,
      };

    } catch (error) {
      console.error('SAML assertion validation error:', error);
      throw error;
    }
  }

  /**
   * Create SAML logout URL
   */
  async createLogoutUrl(sessionId: string): Promise<string> {
    try {
      const session = await prisma.sAMLSession.findUnique({
        where: { sessionId },
        include: { identityProvider: true },
      });

      if (!session) {
        throw new Error('SAML session not found');
      }

      const provider = session.identityProvider;
      const config = provider.configuration as Record<string, unknown>;

      if (!config.logoutUrl) {
        throw new Error('Logout URL not configured for provider');
      }

      if (!config.issuer) {
        throw new Error('Issuer not configured for provider');
      }

      // Create SAML logout request
      const logoutRequest = this.generateLogoutRequest(session.assertionId || '', config.issuer as string);

      // Build logout URL with SAML request
      const logoutUrl = new URL(config.logoutUrl as string);
      logoutUrl.searchParams.set('SAMLRequest', logoutRequest);
      logoutUrl.searchParams.set('RelayState', sessionId);

      return logoutUrl.toString();

    } catch (error) {
      console.error('SAML logout URL creation error:', error);
      throw error;
    }
  }

  /**
   * Generate SAML logout request
   */
  private generateLogoutRequest(sessionIndex: string, issuer: string): string {
    const logoutRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                     xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                     ID="${crypto.randomUUID()}"
                     Version="2.0"
                     IssueInstant="${new Date().toISOString()}"
                     Destination="">
  <saml:Issuer>${issuer}</saml:Issuer>
  <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient"></saml:NameID>
  <samlp:SessionIndex>${sessionIndex}</samlp:SessionIndex>
</samlp:LogoutRequest>`;

    // Encode the logout request
    return Buffer.from(logoutRequest).toString('base64');
  }

  /**
   * Terminate SAML session
   */
  async terminateSession(sessionId: string): Promise<void> {
    try {
      await prisma.sAMLSession.update({
        where: { sessionId },
        data: { 
          status: 'TERMINATED',
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('SAML session termination error:', error);
      throw error;
    }
  }

  /**
   * Get active SAML sessions for user
   */
  async getActiveSessions(userId: string, organizationId: string): Promise<SAMLSessionData[]> {
    try {
      const sessions = await prisma.sAMLSession.findMany({
        where: {
          userId,
          organizationId,
          status: 'ACTIVE',
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          identityProvider: true,
        },
      });

      return sessions.map(session => ({
        sessionId: session.sessionId,
        assertionId: session.assertionId || '',
        userId: session.userId,
        organizationId: session.organizationId,
        identityProviderId: session.identityProviderId,
        attributes: session.attributes as Record<string, unknown>,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        expiresAt: session.expiresAt,
      }));

    } catch (error) {
      console.error('Get active SAML sessions error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.sAMLSession.updateMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          status: 'ACTIVE',
        },
        data: {
          status: 'EXPIRED',
        },
      });

      return result.count;
    } catch (error) {
      console.error('SAML session cleanup error:', error);
      throw error;
    }
  }

  /**
   * Get SAML provider configuration
   */
  async getProviderConfig(_providerId: string): Promise<SAMLProviderConfig | null> {
    try {
      const provider = await prisma.identityProvider.findUnique({
        where: { id: _providerId },
      });

      if (!provider) {
        return null;
      }

      return {
        id: provider.id,
        organizationId: provider.organizationId,
        providerType: provider.providerType as 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE' | 'PING_IDENTITY' | 'ADFS' | 'CUSTOM',
        providerName: provider.providerName,
        metadataXml: provider.metadataXml || '',
        configuration: provider.configuration as {
          entryPoint: string;
          issuer: string;
          cert: string;
          callbackUrl: string;
          logoutUrl?: string;
          additionalParams?: Record<string, unknown>;
        },
      };

    } catch (error) {
      console.error('Get SAML provider config error:', error);
      throw error;
    }
  }
}

export const samlSSOService = new SAMLSSOService();
