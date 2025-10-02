const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateEnterpriseData() {
  console.log('🏢 Populating Enterprise Features data...');

  try {
    // Initialize data regions
    console.log('\n🌍 Initializing data regions...');
    const regions = [
      {
        regionCode: 'US_EAST',
        regionName: 'US East (N. Virginia)',
        jurisdiction: 'United States',
        dataCenterLocations: ['us-east-1', 'us-east-2'],
        regulatoryRequirements: {
          sox: true,
          hipaa: true,
          pci_dss: true,
          fedramp: false,
        },
      },
      {
        regionCode: 'US_WEST',
        regionName: 'US West (Oregon)',
        jurisdiction: 'United States',
        dataCenterLocations: ['us-west-1', 'us-west-2'],
        regulatoryRequirements: {
          sox: true,
          hipaa: true,
          pci_dss: true,
          fedramp: false,
        },
      },
      {
        regionCode: 'EU_IRELAND',
        regionName: 'Europe (Ireland)',
        jurisdiction: 'European Union',
        dataCenterLocations: ['eu-west-1'],
        regulatoryRequirements: {
          gdpr: true,
          iso27001: true,
          soc2: true,
        },
      },
      {
        regionCode: 'EU_FRANKFURT',
        regionName: 'Europe (Frankfurt)',
        jurisdiction: 'European Union',
        dataCenterLocations: ['eu-central-1'],
        regulatoryRequirements: {
          gdpr: true,
          iso27001: true,
          soc2: true,
        },
      },
      {
        regionCode: 'APAC_SINGAPORE',
        regionName: 'Asia Pacific (Singapore)',
        jurisdiction: 'Singapore',
        dataCenterLocations: ['ap-southeast-1'],
        regulatoryRequirements: {
          pdp: true,
          iso27001: true,
          soc2: true,
        },
      },
      {
        regionCode: 'APAC_TOKYO',
        regionName: 'Asia Pacific (Tokyo)',
        jurisdiction: 'Japan',
        dataCenterLocations: ['ap-northeast-1'],
        regulatoryRequirements: {
          appi: true,
          iso27001: true,
          soc2: true,
        },
      },
    ];

    for (const region of regions) {
      await prisma.dataRegion.upsert({
        where: { regionCode: region.regionCode },
        update: region,
        create: region,
      });
    }
    console.log(`   ✅ Created ${regions.length} data regions`);

    // Get or create default organization
    console.log('\n🏢 Setting up default organization...');
    let organization = await prisma.organization.findFirst();
    
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          domain: 'default.com',
          status: 'active',
          plan: 'enterprise',
          description: 'Default organization for enterprise features',
        },
      });
    }
    console.log(`   ✅ Using organization: ${organization.name}`);

    // Create sample identity providers
    console.log('\n🔐 Creating sample identity providers...');
    const identityProviders = [
      {
        organizationId: organization.id,
        providerType: 'OKTA',
        providerName: 'Okta SSO',
        configuration: {
          entryPoint: 'https://company.okta.com/app/complianceos/sso/saml',
          issuer: 'complianceOS',
          cert: '-----BEGIN CERTIFICATE-----\nSample Certificate\n-----END CERTIFICATE-----',
          callbackUrl: 'https://complianceos.com/api/auth/saml/callback',
          logoutUrl: 'https://company.okta.com/app/complianceos/sso/saml/logout',
        },
        metadataXml: '<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor>...</md:EntityDescriptor>',
        status: 'ACTIVE',
      },
      {
        organizationId: organization.id,
        providerType: 'AZURE_AD',
        providerName: 'Azure Active Directory',
        configuration: {
          entryPoint: 'https://login.microsoftonline.com/tenant-id/saml2',
          issuer: 'complianceOS',
          cert: '-----BEGIN CERTIFICATE-----\nAzure Certificate\n-----END CERTIFICATE-----',
          callbackUrl: 'https://complianceos.com/api/auth/saml/callback',
        },
        metadataXml: '<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor>...</md:EntityDescriptor>',
        status: 'ACTIVE',
      },
    ];

    for (const provider of identityProviders) {
      await prisma.identityProvider.create({
        data: provider,
      });
    }
    console.log(`   ✅ Created ${identityProviders.length} identity providers`);

    // Create sample SCIM endpoints
    console.log('\n🔄 Creating sample SCIM endpoints...');
    
    // Get the created identity providers to get their actual IDs
    const createdProviders = await prisma.identityProvider.findMany({
      where: { organizationId: organization.id },
    });

    const scimEndpoints = [
      {
        organizationId: organization.id,
        identityProviderId: createdProviders[0].id, // Use actual provider ID
        endpointUrl: 'https://company.okta.com/api/v1/scim',
        bearerToken: 'encrypted-bearer-token-1',
        syncFrequency: 300, // 5 minutes
        syncStatus: 'COMPLETED',
        lastSyncAt: new Date(),
      },
      {
        organizationId: organization.id,
        identityProviderId: createdProviders[1].id, // Use actual provider ID
        endpointUrl: 'https://graph.microsoft.com/v1.0/scim',
        bearerToken: 'encrypted-bearer-token-2',
        syncFrequency: 600, // 10 minutes
        syncStatus: 'PENDING',
      },
    ];

    for (const endpoint of scimEndpoints) {
      await prisma.sCIMEndpoint.create({
        data: endpoint,
      });
    }
    console.log(`   ✅ Created ${scimEndpoints.length} SCIM endpoints`);

    // Create sample SAML sessions
    console.log('\n🔑 Creating sample SAML sessions...');
    const users = await prisma.user.findMany({ take: 3 });
    let samlSessionsCount = 0;
    
    if (users.length > 0) {
      const samlSessions = [
        {
          organizationId: organization.id,
          userId: users[0].id,
          identityProviderId: createdProviders[0].id,
          sessionId: `saml-session-${Date.now()}-1`,
          assertionId: `assertion-${Date.now()}-1`,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
          attributes: {
            email: users[0].email,
            name: users[0].name,
            firstName: 'John',
            lastName: 'Doe',
            department: 'IT',
            role: 'ADMIN',
          },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'ACTIVE',
        },
        {
          organizationId: organization.id,
          userId: users[1]?.id || users[0].id,
          identityProviderId: createdProviders[1].id,
          sessionId: `saml-session-${Date.now()}-2`,
          assertionId: `assertion-${Date.now()}-2`,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
          attributes: {
            email: users[1]?.email || users[0].email,
            name: users[1]?.name || users[0].name,
            firstName: 'Jane',
            lastName: 'Smith',
            department: 'Security',
            role: 'USER',
          },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          status: 'ACTIVE',
        },
      ];

      for (const session of samlSessions) {
        await prisma.sAMLSession.create({
          data: session,
        });
      }
      samlSessionsCount = samlSessions.length;
      console.log(`   ✅ Created ${samlSessions.length} SAML sessions`);
    }

    // Create sample provisioning audit logs
    console.log('\n📋 Creating sample provisioning audit logs...');
    
    // Get the created SCIM endpoints to get their actual IDs
    const createdEndpoints = await prisma.sCIMEndpoint.findMany({
      where: { organizationId: organization.id },
    });

    const provisioningAudit = [
      {
        organizationId: organization.id,
        identityProviderId: createdProviders[0].id,
        scimEndpointId: createdEndpoints[0].id,
        action: 'CREATE',
        userId: users[0]?.id || 'user-1',
        scimUserId: 'scim-user-1',
        performedBy: 'SCIM_SYNC',
        details: {
          email: users[0]?.email || 'user@example.com',
          name: users[0]?.name || 'Test User',
          department: 'IT',
        },
        result: 'SUCCESS',
      },
      {
        organizationId: organization.id,
        identityProviderId: createdProviders[1].id,
        scimEndpointId: createdEndpoints[1].id,
        action: 'UPDATE',
        userId: users[1]?.id || users[0]?.id || 'user-2',
        scimUserId: 'scim-user-2',
        performedBy: 'SCIM_SYNC',
        details: {
          email: users[1]?.email || users[0]?.email || 'user2@example.com',
          name: users[1]?.name || users[0]?.name || 'Test User 2',
          department: 'Security',
        },
        result: 'SUCCESS',
      },
    ];

    for (const audit of provisioningAudit) {
      await prisma.provisioningAudit.create({
        data: audit,
      });
    }
    console.log(`   ✅ Created ${provisioningAudit.length} provisioning audit logs`);

    // Create sample encryption configuration
    console.log('\n🔒 Creating sample encryption configuration...');
    const encryptionConfig = {
      organizationId: organization.id,
      keyManagementType: 'CLOUD_KMS',
      kmsProvider: 'AWS_KMS',
      byokEnabled: true,
      clientSideEncryption: true,
      keyRotationPolicy: {
        rotationInterval: 90,
        autoRotation: true,
        notificationDays: [7, 3, 1],
      },
      complianceRequirements: ['FIPS_140_2', 'GDPR', 'SOX'],
    };

    await prisma.encryptionConfig.upsert({
      where: { organizationId: organization.id },
      update: encryptionConfig,
      create: encryptionConfig,
    });
    console.log('   ✅ Created encryption configuration');

    // Create sample data residency configuration
    console.log('\n🌍 Creating sample data residency configuration...');
    const dataResidency = {
      organizationId: organization.id,
      primaryRegion: 'US_EAST',
      backupRegions: ['US_WEST', 'EU_IRELAND'],
      residencyRequirements: {
        dataTypes: ['personal', 'financial', 'health'],
        retentionPeriods: { personal: 7, financial: 10, health: 10 },
        crossBorderTransfers: false,
        localProcessing: true,
      },
      complianceCertifications: ['SOC2', 'ISO27001', 'GDPR'],
      lastValidatedAt: new Date(),
    };

    await prisma.orgDataResidency.upsert({
      where: { organizationId: organization.id },
      update: dataResidency,
      create: dataResidency,
    });
    console.log('   ✅ Created data residency configuration');

    // Create sample security policies
    console.log('\n🛡️ Creating sample security policies...');
    const securityPolicies = [
      {
        organizationId: organization.id,
        policyType: 'ACCESS_CONTROL',
        policyConfig: {
          mfaRequired: true,
          sessionTimeout: 8,
          maxConcurrentSessions: 3,
          ipAllowlist: ['192.168.1.0/24'],
        },
        enforcementLevel: 'STRICT',
        createdBy: users[0]?.id || 'system',
        effectiveDate: new Date(),
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        organizationId: organization.id,
        policyType: 'DATA_ENCRYPTION',
        policyConfig: {
          encryptionAtRest: true,
          encryptionInTransit: true,
          keyRotationInterval: 90,
          clientSideEncryption: true,
        },
        enforcementLevel: 'STRICT',
        createdBy: users[0]?.id || 'system',
        effectiveDate: new Date(),
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const policy of securityPolicies) {
      await prisma.securityPolicy.create({
        data: policy,
      });
    }
    console.log(`   ✅ Created ${securityPolicies.length} security policies`);

    // Create sample security audit logs
    console.log('\n📊 Creating sample security audit logs...');
    const securityAuditLogs = [
      {
        organizationId: organization.id,
        eventType: 'LOGIN_SUCCESS',
        userId: users[0]?.id || 'user-1',
        action: 'LOGIN',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        riskScore: 0.1,
        alertTriggered: false,
        metadata: {
          loginMethod: 'SAML_SSO',
          provider: 'Okta',
          sessionDuration: 0,
        },
      },
      {
        organizationId: organization.id,
        eventType: 'DATA_ACCESS',
        userId: users[1]?.id || users[0]?.id || 'user-2',
        resourceId: 'evidence-123',
        action: 'VIEW_EVIDENCE',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        riskScore: 0.2,
        alertTriggered: false,
        metadata: {
          resourceType: 'EVIDENCE',
          accessMethod: 'WEB_UI',
          dataClassification: 'CONFIDENTIAL',
        },
      },
    ];

    for (const log of securityAuditLogs) {
      await prisma.securityAuditLog.create({
        data: log,
      });
    }
    console.log(`   ✅ Created ${securityAuditLogs.length} security audit logs`);

    console.log('\n✅ Enterprise Features data population completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Data Regions: ${regions.length}`);
    console.log(`   - Identity Providers: ${identityProviders.length}`);
    console.log(`   - SCIM Endpoints: ${scimEndpoints.length}`);
    console.log(`   - SAML Sessions: ${samlSessionsCount}`);
    console.log(`   - Provisioning Audit Logs: ${provisioningAudit.length}`);
    console.log(`   - Encryption Configuration: 1`);
    console.log(`   - Data Residency Configuration: 1`);
    console.log(`   - Security Policies: ${securityPolicies.length}`);
    console.log(`   - Security Audit Logs: ${securityAuditLogs.length}`);

  } catch (error) {
    console.error('❌ Enterprise data population failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population script
populateEnterpriseData()
  .then(() => {
    console.log('\n🎉 Enterprise Features data population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Enterprise Features data population failed:', error);
    process.exit(1);
  });
