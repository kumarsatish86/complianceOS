const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const integrationProviders = [
  {
    name: 'google_workspace',
    displayName: 'Google Workspace',
    type: 'IDENTITY_PROVIDER',
    category: 'GOOGLE_WORKSPACE',
    authType: 'OAUTH2',
    supportedScopes: [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.group.readonly',
      'https://www.googleapis.com/auth/admin.directory.device.mobile.readonly',
      'https://www.googleapis.com/auth/admin.directory.device.chromeos.readonly'
    ],
    apiVersion: 'v1',
    documentationUrl: 'https://developers.google.com/admin-sdk/directory',
    logoUrl: 'https://developers.google.com/identity/images/g-logo.png',
    setupInstructions: {
      title: 'Google Workspace Setup',
      steps: [
        'Create a Google Cloud Project',
        'Enable the Admin SDK API',
        'Create OAuth 2.0 credentials',
        'Configure authorized redirect URIs',
        'Grant domain-wide delegation'
      ],
      requirements: [
        'Google Workspace Admin account',
        'Domain verification',
        'API access enabled'
      ]
    },
    capabilities: {
      userSync: true,
      groupSync: true,
      deviceSync: true,
      securityEvents: true,
      evidenceGeneration: true
    }
  },
  {
    name: 'microsoft_entra_id',
    displayName: 'Microsoft Entra ID',
    type: 'IDENTITY_PROVIDER',
    category: 'MICROSOFT_ENTRA_ID',
    authType: 'OAUTH2',
    supportedScopes: [
      'https://graph.microsoft.com/User.Read.All',
      'https://graph.microsoft.com/Group.Read.All',
      'https://graph.microsoft.com/Device.Read.All',
      'https://graph.microsoft.com/AuditLog.Read.All',
      'https://graph.microsoft.com/SecurityEvents.Read.All'
    ],
    apiVersion: 'v1.0',
    documentationUrl: 'https://docs.microsoft.com/en-us/graph/',
    logoUrl: 'https://docs.microsoft.com/en-us/graph/images/microsoft-graph.png',
    setupInstructions: {
      title: 'Microsoft Entra ID Setup',
      steps: [
        'Register an application in Azure portal',
        'Configure API permissions',
        'Grant admin consent',
        'Create client secret',
        'Configure redirect URIs'
      ],
      requirements: [
        'Azure AD tenant',
        'Global Administrator or Application Administrator role',
        'Microsoft Graph API access'
      ]
    },
    capabilities: {
      userSync: true,
      groupSync: true,
      deviceSync: true,
      securityEvents: true,
      auditLogs: true,
      evidenceGeneration: true
    }
  },
  {
    name: 'aws_config',
    displayName: 'AWS Config',
    type: 'CLOUD_SECURITY',
    category: 'AWS_CONFIG',
    authType: 'API_KEY',
    supportedScopes: [],
    apiVersion: '2014-11-12',
    documentationUrl: 'https://docs.aws.amazon.com/config/',
    logoUrl: 'https://a0.awsstatic.com/main/images/logos/aws_logo_smile_1200x630.png',
    setupInstructions: {
      title: 'AWS Config Setup',
      steps: [
        'Enable AWS Config service',
        'Create IAM role with Config permissions',
        'Configure Config rules',
        'Set up S3 bucket for configuration history',
        'Enable SNS notifications'
      ],
      requirements: [
        'AWS account with Config enabled',
        'IAM permissions for Config access',
        'S3 bucket for configuration snapshots'
      ]
    },
    capabilities: {
      resourceInventory: true,
      complianceMonitoring: true,
      configurationHistory: true,
      ruleEvaluation: true,
      evidenceGeneration: true
    }
  },
  {
    name: 'azure_security_center',
    displayName: 'Azure Security Center',
    type: 'CLOUD_SECURITY',
    category: 'AZURE_SECURITY_CENTER',
    authType: 'OAUTH2',
    supportedScopes: [
      'https://management.azure.com/user_impersonation'
    ],
    apiVersion: '2021-06-01',
    documentationUrl: 'https://docs.microsoft.com/en-us/azure/security-center/',
    logoUrl: 'https://docs.microsoft.com/en-us/azure/security-center/images/asc-logo.png',
    setupInstructions: {
      title: 'Azure Security Center Setup',
      steps: [
        'Enable Security Center in Azure portal',
        'Configure security policies',
        'Set up continuous export',
        'Enable security recommendations',
        'Configure Log Analytics workspace'
      ],
      requirements: [
        'Azure subscription',
        'Security Center Standard tier',
        'Log Analytics workspace'
      ]
    },
    capabilities: {
      securityRecommendations: true,
      threatDetection: true,
      complianceMonitoring: true,
      vulnerabilityAssessment: true,
      evidenceGeneration: true
    }
  },
  {
    name: 'okta',
    displayName: 'Okta',
    type: 'IDENTITY_PROVIDER',
    category: 'OKTA',
    authType: 'OAUTH2',
    supportedScopes: [
      'okta.users.read',
      'okta.groups.read',
      'okta.apps.read',
      'okta.logs.read'
    ],
    apiVersion: 'v1',
    documentationUrl: 'https://developer.okta.com/docs/api/',
    logoUrl: 'https://www.okta.com/sites/default/files/Okta_Logo_BrightBlue_Medium.png',
    setupInstructions: {
      title: 'Okta Setup',
      steps: [
        'Create Okta developer account',
        'Create OAuth 2.0 application',
        'Configure scopes and permissions',
        'Generate client credentials',
        'Test API access'
      ],
      requirements: [
        'Okta organization',
        'Super Admin or Org Admin role',
        'API access enabled'
      ]
    },
    capabilities: {
      userSync: true,
      groupSync: true,
      appSync: true,
      logSync: true,
      evidenceGeneration: true
    }
  },
  {
    name: 'jira',
    displayName: 'Jira',
    type: 'TICKETING_SYSTEM',
    category: 'JIRA',
    authType: 'API_KEY',
    supportedScopes: [],
    apiVersion: '3',
    documentationUrl: 'https://developer.atlassian.com/cloud/jira/platform/',
    logoUrl: 'https://wac-cdn.atlassian.com/dam/jcr:616e6748-ad8c-48d9-ae93-e49019ed5259/Atlassian-horizontal-blue-rgb.svg',
    setupInstructions: {
      title: 'Jira Setup',
      steps: [
        'Create API token in Jira',
        'Configure project permissions',
        'Set up webhook endpoints',
        'Configure field mappings',
        'Test API connectivity'
      ],
      requirements: [
        'Jira Cloud or Server instance',
        'Admin permissions',
        'API access enabled'
      ]
    },
    capabilities: {
      issueSync: true,
      projectSync: true,
      userSync: true,
      workflowSync: true,
      evidenceGeneration: true
    }
  },
  {
    name: 'servicenow',
    displayName: 'ServiceNow',
    type: 'TICKETING_SYSTEM',
    category: 'SERVICENOW',
    authType: 'OAUTH2',
    supportedScopes: [
      'user:read',
      'incident:read',
      'change:read',
      'cmdb:read'
    ],
    apiVersion: 'v2',
    documentationUrl: 'https://developer.servicenow.com/',
    logoUrl: 'https://www.servicenow.com/content/dam/servicenow-assets/images/logos/servicenow-logo.svg',
    setupInstructions: {
      title: 'ServiceNow Setup',
      steps: [
        'Create OAuth application',
        'Configure OAuth provider',
        'Set up user roles',
        'Configure table permissions',
        'Test API access'
      ],
      requirements: [
        'ServiceNow instance',
        'Admin role',
        'OAuth plugin enabled'
      ]
    },
    capabilities: {
      incidentSync: true,
      changeSync: true,
      cmdbSync: true,
      userSync: true,
      evidenceGeneration: true
    }
  },
  {
    name: 'splunk',
    displayName: 'Splunk',
    type: 'MONITORING_TOOL',
    category: 'SPLUNK',
    authType: 'API_KEY',
    supportedScopes: [],
    apiVersion: 'v1',
    documentationUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/RESTAPI/',
    logoUrl: 'https://www.splunk.com/content/dam/splunk2/images/company/brand/splunk-logo.svg',
    setupInstructions: {
      title: 'Splunk Setup',
      steps: [
        'Create API token',
        'Configure search permissions',
        'Set up data inputs',
        'Configure alerts',
        'Test API connectivity'
      ],
      requirements: [
        'Splunk Enterprise or Cloud',
        'Admin or Power User role',
        'REST API enabled'
      ]
    },
    capabilities: {
      logSync: true,
      alertSync: true,
      searchSync: true,
      dashboardSync: true,
      evidenceGeneration: true
    }
  }
];

async function populateIntegrationProviders() {
  try {
    console.log('Starting to populate integration providers...');

    for (const provider of integrationProviders) {
      const existingProvider = await prisma.integrationProvider.findUnique({
        where: { name: provider.name }
      });

      if (existingProvider) {
        console.log(`Provider ${provider.name} already exists, skipping...`);
        continue;
      }

      const createdProvider = await prisma.integrationProvider.create({
        data: provider
      });

      console.log(`Created provider: ${createdProvider.displayName}`);
    }

    console.log('Integration providers populated successfully!');
  } catch (error) {
    console.error('Error populating integration providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateIntegrationProviders();
