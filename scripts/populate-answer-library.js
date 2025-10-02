const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const answerLibraryEntries = [
  // Access Control
  {
    category: 'ACCESS_CONTROL',
    subcategory: 'User Authentication',
    keyPhrases: ['authentication', 'login', 'password', 'multi-factor', 'mfa'],
    standardAnswer: 'We implement multi-factor authentication (MFA) for all user accounts. Our authentication system requires users to provide two or more verification factors, including something they know (password), something they have (mobile device), or something they are (biometric). All authentication attempts are logged and monitored for suspicious activity.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 85
  },
  {
    category: 'ACCESS_CONTROL',
    subcategory: 'Access Management',
    keyPhrases: ['access control', 'permissions', 'authorization', 'role-based', 'rbac'],
    standardAnswer: 'We maintain a comprehensive access control system based on the principle of least privilege. User access rights are granted based on job roles and responsibilities, and are regularly reviewed and updated. Access permissions are managed through our centralized identity and access management (IAM) system.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },
  {
    category: 'ACCESS_CONTROL',
    subcategory: 'Account Management',
    keyPhrases: ['account management', 'user provisioning', 'onboarding', 'offboarding'],
    standardAnswer: 'We have established formal procedures for user account lifecycle management. New user accounts are created with appropriate access levels based on job requirements, and access is promptly revoked when users leave the organization or change roles. All account changes are documented and approved by appropriate personnel.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 75
  },

  // Data Protection
  {
    category: 'DATA_PROTECTION',
    subcategory: 'Encryption',
    keyPhrases: ['encryption', 'data protection', 'cryptographic', 'at rest', 'in transit'],
    standardAnswer: 'We implement industry-standard encryption for data protection. Sensitive data is encrypted both at rest using AES-256 encryption and in transit using TLS 1.3. Our encryption keys are managed through a secure key management system with regular key rotation policies.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 90
  },
  {
    category: 'DATA_PROTECTION',
    subcategory: 'Data Classification',
    keyPhrases: ['data classification', 'sensitive data', 'confidential', 'public', 'internal'],
    standardAnswer: 'We have implemented a data classification system that categorizes information based on sensitivity levels (Public, Internal, Confidential, Restricted). Each classification level has specific handling requirements and protection measures. All employees are trained on data classification policies and procedures.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },
  {
    category: 'DATA_PROTECTION',
    subcategory: 'Privacy',
    keyPhrases: ['privacy', 'gdpr', 'personal data', 'data subject', 'consent'],
    standardAnswer: 'We comply with applicable privacy regulations including GDPR, CCPA, and other regional privacy laws. We maintain a comprehensive privacy program that includes data mapping, privacy impact assessments, consent management, and data subject rights procedures. Our privacy policies are regularly reviewed and updated.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 85
  },

  // Incident Response
  {
    category: 'INCIDENT_RESPONSE',
    subcategory: 'Security Incidents',
    keyPhrases: ['incident response', 'security incident', 'breach', 'response plan', 'forensics'],
    standardAnswer: 'We maintain a comprehensive incident response plan that defines procedures for detecting, analyzing, containing, eradicating, and recovering from security incidents. Our incident response team is trained and ready to respond to various types of security incidents. All incidents are documented and lessons learned are incorporated into our security program.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 85
  },
  {
    category: 'INCIDENT_RESPONSE',
    subcategory: 'Communication',
    keyPhrases: ['incident communication', 'notification', 'stakeholders', 'customers', 'regulators'],
    standardAnswer: 'We have established communication procedures for security incidents that include notification requirements for stakeholders, customers, and regulatory authorities. Our communication plan ensures timely and accurate information sharing while protecting sensitive details during active investigations.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 75
  },

  // Network Security
  {
    category: 'NETWORK_SECURITY',
    subcategory: 'Firewall',
    keyPhrases: ['firewall', 'network security', 'perimeter', 'network segmentation'],
    standardAnswer: 'We deploy enterprise-grade firewalls at network perimeters and between network segments. Our firewall rules are regularly reviewed and updated based on business requirements and security best practices. Network traffic is monitored and logged for security analysis.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },
  {
    category: 'NETWORK_SECURITY',
    subcategory: 'Network Monitoring',
    keyPhrases: ['network monitoring', 'intrusion detection', 'ids', 'ips', 'network traffic'],
    standardAnswer: 'We implement continuous network monitoring using intrusion detection and prevention systems (IDS/IPS). Network traffic is analyzed in real-time for suspicious activities and potential security threats. Security alerts are automatically generated and investigated by our security team.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },

  // Physical Security
  {
    category: 'PHYSICAL_SECURITY',
    subcategory: 'Facility Access',
    keyPhrases: ['physical security', 'facility access', 'badge', 'visitor management', 'access control'],
    standardAnswer: 'We maintain physical security controls including badge-based access control systems, visitor management procedures, and security cameras. Physical access to sensitive areas is restricted to authorized personnel only. All physical access events are logged and monitored.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 75
  },
  {
    category: 'PHYSICAL_SECURITY',
    subcategory: 'Data Center',
    keyPhrases: ['data center', 'server room', 'environmental controls', 'power', 'cooling'],
    standardAnswer: 'Our data centers are equipped with environmental controls including redundant power systems, cooling systems, and fire suppression systems. Physical access is restricted and monitored 24/7. Environmental conditions are continuously monitored and maintained within optimal ranges.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },

  // Business Continuity
  {
    category: 'BUSINESS_CONTINUITY',
    subcategory: 'Backup',
    keyPhrases: ['backup', 'data backup', 'recovery', 'business continuity', 'disaster recovery'],
    standardAnswer: 'We maintain comprehensive backup procedures for all critical data and systems. Backups are performed regularly and stored in secure, geographically separate locations. Our backup and recovery procedures are tested regularly to ensure business continuity in case of system failures or disasters.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 85
  },
  {
    category: 'BUSINESS_CONTINUITY',
    subcategory: 'Disaster Recovery',
    keyPhrases: ['disaster recovery', 'business continuity', 'recovery time', 'recovery point'],
    standardAnswer: 'We have established disaster recovery procedures with defined recovery time objectives (RTO) and recovery point objectives (RPO). Our disaster recovery plan includes procedures for various disaster scenarios and is regularly tested and updated. Critical systems can be restored within defined timeframes.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },

  // Vendor Management
  {
    category: 'VENDOR_MANAGEMENT',
    subcategory: 'Third Party Risk',
    keyPhrases: ['vendor management', 'third party', 'supplier', 'risk assessment', 'due diligence'],
    standardAnswer: 'We maintain a comprehensive vendor management program that includes risk assessments, due diligence procedures, and ongoing monitoring of third-party vendors. All vendors are required to meet our security standards and undergo regular security assessments. Vendor contracts include security requirements and breach notification clauses.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },
  {
    category: 'VENDOR_MANAGEMENT',
    subcategory: 'Cloud Services',
    keyPhrases: ['cloud services', 'saas', 'paas', 'iaas', 'cloud security'],
    standardAnswer: 'We carefully evaluate cloud service providers for security capabilities and compliance requirements. All cloud services undergo security assessments before implementation. We maintain visibility into cloud environments and ensure appropriate security controls are in place.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 75
  },

  // Compliance Framework
  {
    category: 'COMPLIANCE_FRAMEWORK',
    subcategory: 'ISO 27001',
    keyPhrases: ['iso 27001', 'information security', 'management system', 'isms'],
    standardAnswer: 'We maintain an Information Security Management System (ISMS) based on ISO 27001 standards. Our ISMS includes policies, procedures, risk assessments, and continuous improvement processes. We undergo regular internal audits and external certification audits to maintain compliance.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 85
  },
  {
    category: 'COMPLIANCE_FRAMEWORK',
    subcategory: 'SOC 2',
    keyPhrases: ['soc 2', 'service organization', 'trust services', 'audit'],
    standardAnswer: 'We maintain SOC 2 Type II compliance through regular audits by independent auditors. Our controls address the Trust Services Criteria including security, availability, processing integrity, confidentiality, and privacy. SOC 2 reports are available to customers upon request.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 85
  },
  {
    category: 'COMPLIANCE_FRAMEWORK',
    subcategory: 'PCI DSS',
    keyPhrases: ['pci dss', 'payment card', 'credit card', 'payment security'],
    standardAnswer: 'We maintain PCI DSS compliance for processing, storing, or transmitting payment card data. Our security controls include network security, access controls, encryption, and regular security testing. We undergo annual PCI DSS assessments and maintain compliance documentation.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },

  // General Security
  {
    category: 'GENERAL_SECURITY',
    subcategory: 'Security Awareness',
    keyPhrases: ['security awareness', 'training', 'education', 'phishing', 'social engineering'],
    standardAnswer: 'We provide regular security awareness training to all employees covering topics such as phishing, social engineering, password security, and data protection. Training is mandatory for all staff and is updated regularly to address emerging threats. We conduct simulated phishing exercises to test awareness.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  },
  {
    category: 'GENERAL_SECURITY',
    subcategory: 'Security Monitoring',
    keyPhrases: ['security monitoring', 'siem', 'log analysis', 'threat detection'],
    standardAnswer: 'We implement continuous security monitoring using Security Information and Event Management (SIEM) systems. Security logs are collected, analyzed, and correlated to detect potential security threats. Our security operations center (SOC) monitors systems 24/7 and responds to security alerts.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 85
  },
  {
    category: 'GENERAL_SECURITY',
    subcategory: 'Vulnerability Management',
    keyPhrases: ['vulnerability management', 'patch management', 'security testing', 'penetration testing'],
    standardAnswer: 'We maintain a comprehensive vulnerability management program that includes regular vulnerability scans, patch management procedures, and penetration testing. Critical vulnerabilities are prioritized and remediated according to defined timelines. We conduct annual penetration tests by qualified third-party assessors.',
    evidenceReferences: [],
    usageCount: 0,
    confidenceScore: 80
  }
];

async function populateAnswerLibrary() {
  try {
    console.log('Starting answer library population...');

    // Check if we have an organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('No organization found. Creating default organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          domain: 'default.com',
          status: 'active',
          plan: 'enterprise',
          description: 'Default organization for answer library',
          settings: {}
        }
      });
    }

    // Check if we have a system user
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@complianceos.com' }
    });
    if (!systemUser) {
      console.log('No system user found. Creating system user...');
      systemUser = await prisma.user.create({
        data: {
          name: 'System User',
          email: 'system@complianceos.com',
          password: 'system-password-change-in-production'
        }
      });
    }

    console.log(`Creating ${answerLibraryEntries.length} answer library entries...`);

    for (const entry of answerLibraryEntries) {
      await prisma.answerLibrary.create({
        data: {
          organizationId: organization.id,
          category: entry.category,
          subcategory: entry.subcategory,
          keyPhrases: entry.keyPhrases,
          standardAnswer: entry.standardAnswer,
          evidenceReferences: entry.evidenceReferences,
          usageCount: entry.usageCount,
          confidenceScore: entry.confidenceScore,
          createdBy: systemUser.id,
          isActive: true,
          metadata: {
            source: 'initial_population',
            createdAt: new Date().toISOString()
          }
        }
      });
    }

    console.log('Answer library population completed successfully!');
    console.log(`Created ${answerLibraryEntries.length} entries for organization: ${organization.name}`);

  } catch (error) {
    console.error('Error populating answer library:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateAnswerLibrary()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
