const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// SOC 2 Type II Controls
const soc2Controls = [
  {
    name: 'CC6.1 - Logical and Physical Access Controls',
    description: 'The entity implements logical and physical access security measures to protect against threats from sources outside its system boundaries.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'CC6.2 - Prior to Issuing System Credentials',
    description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'CC6.3 - Access to Data and Software',
    description: 'The entity authorizes, modifies, or removes access to data, software, and hardware resources based on roles, responsibilities, or the system design and changes.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'CC6.4 - Restriction of Access to Information',
    description: 'The entity restricts access to information assets including hardware, software, mobile devices, output, and offline elements.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'CC6.5 - Access to Data and Software',
    description: 'The entity discontinues or modifies access to data, software, and hardware resources when an individual no longer has a business need for such access.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'CC6.6 - Restriction of Access to Information',
    description: 'The entity restricts access to information assets including hardware, software, mobile devices, output, and offline elements.',
    category: 'TECHNOLOGY',
    criticality: 'MEDIUM'
  },
  {
    name: 'CC6.7 - Data Transmission and Disposal',
    description: 'The entity protects against unauthorized access to data during transmission and disposal.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'CC6.8 - Data Transmission and Disposal',
    description: 'The entity protects against unauthorized access to data during transmission and disposal.',
    category: 'TECHNOLOGY',
    criticality: 'MEDIUM'
  },
  {
    name: 'CC7.1 - System Operations',
    description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) anomalies that result from system errors or faulty transactions, (2) anomalies that result from unauthorized or inappropriate system use, and (3) vulnerabilities that could be exploited by unauthorized users.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'CC7.2 - System Operations',
    description: 'The entity monitors the system and takes action to maintain compliance with its objectives.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'CC7.3 - System Operations',
    description: 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives and, if so, takes action to prevent or address such failure.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'CC7.4 - System Operations',
    description: 'The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'CC7.5 - System Operations',
    description: 'The entity identifies, develops, and implements activities to recover from identified security incidents.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'CC8.1 - Change Management',
    description: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, and maintains system changes.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'CC8.2 - Change Management',
    description: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, and maintains system changes.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'CC9.1 - Risk Management',
    description: 'The entity identifies, analyzes, and responds to risks related to the achievement of objectives.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'CC9.2 - Risk Management',
    description: 'The entity identifies, analyzes, and responds to risks related to the achievement of objectives.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'CC9.3 - Risk Management',
    description: 'The entity identifies, analyzes, and responds to risks related to the achievement of objectives.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'CC9.4 - Risk Management',
    description: 'The entity identifies, analyzes, and responds to risks related to the achievement of objectives.',
    category: 'PROCESS',
    criticality: 'LOW'
  },
  {
    name: 'CC9.5 - Risk Management',
    description: 'The entity identifies, analyzes, and responds to risks related to the achievement of objectives.',
    category: 'PROCESS',
    criticality: 'LOW'
  }
];

// ISO 27001 Annex A Controls
const iso27001Controls = [
  {
    name: 'A.5.1 - Information Security Policies',
    description: 'Management direction and support for information security in accordance with business requirements and relevant laws and regulations.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.5.2 - Information Security Policies',
    description: 'Management direction and support for information security in accordance with business requirements and relevant laws and regulations.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.6.1 - Organization of Information Security',
    description: 'Internal organization and mobile devices and teleworking.',
    category: 'PEOPLE',
    criticality: 'HIGH'
  },
  {
    name: 'A.6.2 - Organization of Information Security',
    description: 'Internal organization and mobile devices and teleworking.',
    category: 'PEOPLE',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.7.1 - Human Resource Security',
    description: 'Prior to employment, during employment, and termination or change of employment.',
    category: 'PEOPLE',
    criticality: 'HIGH'
  },
  {
    name: 'A.7.2 - Human Resource Security',
    description: 'Prior to employment, during employment, and termination or change of employment.',
    category: 'PEOPLE',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.7.3 - Human Resource Security',
    description: 'Prior to employment, during employment, and termination or change of employment.',
    category: 'PEOPLE',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.8.1 - Asset Management',
    description: 'Responsibility for assets and information classification.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.8.2 - Asset Management',
    description: 'Responsibility for assets and information classification.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.8.3 - Asset Management',
    description: 'Responsibility for assets and information classification.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.9.1 - Access Control',
    description: 'Business requirements of access control.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.9.2 - Access Control',
    description: 'User access management.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.9.3 - Access Control',
    description: 'User responsibilities.',
    category: 'PEOPLE',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.9.4 - Access Control',
    description: 'System and application access control.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.10.1 - Cryptography',
    description: 'Cryptographic controls.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.11.1 - Physical and Environmental Security',
    description: 'Secure areas.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.11.2 - Physical and Environmental Security',
    description: 'Equipment.',
    category: 'TECHNOLOGY',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.12.1 - Operations Security',
    description: 'Operational procedures and responsibilities.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.12.2 - Operations Security',
    description: 'Protection from malware.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.12.3 - Operations Security',
    description: 'Backup.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.12.4 - Operations Security',
    description: 'Logging and monitoring.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.12.5 - Operations Security',
    description: 'Control of operational software.',
    category: 'TECHNOLOGY',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.12.6 - Operations Security',
    description: 'Technical vulnerability management.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.12.7 - Operations Security',
    description: 'Information systems audit considerations.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.13.1 - Communications Security',
    description: 'Network security management.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.13.2 - Communications Security',
    description: 'Information transfer.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'A.14.1 - System Acquisition, Development and Maintenance',
    description: 'Security requirements of information systems.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.14.2 - System Acquisition, Development and Maintenance',
    description: 'Security in development and support processes.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.14.3 - System Acquisition, Development and Maintenance',
    description: 'Test data.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.15.1 - Supplier Relationships',
    description: 'Information security in supplier relationships.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.15.2 - Supplier Relationships',
    description: 'Supplier service delivery management.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.16.1 - Information Security Incident Management',
    description: 'Management of information security incidents and improvements.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.17.1 - Information Security Aspects of Business Continuity Management',
    description: 'Information security continuity.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.17.2 - Information Security Aspects of Business Continuity Management',
    description: 'Redundancies.',
    category: 'TECHNOLOGY',
    criticality: 'MEDIUM'
  },
  {
    name: 'A.18.1 - Compliance',
    description: 'Compliance with legal and contractual requirements.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'A.18.2 - Compliance',
    description: 'Information security reviews.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  }
];

// Common Control Library
const commonControls = [
  {
    name: 'Access Management',
    description: 'Implement and maintain access controls for all systems and data.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'Asset Management',
    description: 'Maintain inventory and lifecycle management of IT assets.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Backup and Recovery',
    description: 'Implement and test backup and recovery procedures.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'Change Management',
    description: 'Control and manage changes to systems and processes.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Data Classification',
    description: 'Classify and protect data based on sensitivity levels.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Encryption',
    description: 'Implement encryption for data at rest and in transit.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'Incident Response',
    description: 'Establish and maintain incident response procedures.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Logging and Monitoring',
    description: 'Implement comprehensive logging and monitoring systems.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'Network Security',
    description: 'Implement network security controls and segmentation.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'Patch Management',
    description: 'Implement and maintain patch management processes.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Physical Security',
    description: 'Implement physical security controls for facilities and equipment.',
    category: 'TECHNOLOGY',
    criticality: 'MEDIUM'
  },
  {
    name: 'Policy Management',
    description: 'Develop, maintain, and communicate security policies.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Risk Management',
    description: 'Implement risk assessment and management processes.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Security Awareness',
    description: 'Provide security awareness training to all personnel.',
    category: 'PEOPLE',
    criticality: 'MEDIUM'
  },
  {
    name: 'Vendor Management',
    description: 'Manage third-party vendor security risks and relationships.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  },
  {
    name: 'Vulnerability Management',
    description: 'Implement vulnerability scanning and remediation processes.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'Disaster Recovery',
    description: 'Implement disaster recovery planning and testing.',
    category: 'PROCESS',
    criticality: 'HIGH'
  },
  {
    name: 'Data Loss Prevention',
    description: 'Implement data loss prevention controls and monitoring.',
    category: 'TECHNOLOGY',
    criticality: 'MEDIUM'
  },
  {
    name: 'Identity and Access Management',
    description: 'Implement identity and access management solutions.',
    category: 'TECHNOLOGY',
    criticality: 'HIGH'
  },
  {
    name: 'Security Testing',
    description: 'Conduct regular security testing and assessments.',
    category: 'PROCESS',
    criticality: 'MEDIUM'
  }
];

async function populateFrameworks() {
  try {
    console.log('Starting framework population...');

    // Check for existing organizations
    let organizations = await prisma.organization.findMany();
    if (organizations.length === 0) {
      console.log('No organizations found. Creating default organization...');
      const newOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          status: 'active',
          plan: 'free',
          description: 'Default organization for complianceOS',
        },
      });
      organizations = [newOrg];
    }

    const orgId = organizations[0].id;
    console.log('Using organization ID:', orgId);

    // Check for system user or create one
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@complianceos.com' }
    });

    if (!systemUser) {
      console.log('Creating system user...');
      systemUser = await prisma.user.create({
        data: {
          name: 'System User',
          email: 'system@complianceos.com',
          platformRoleId: null, // Will be set later if needed
        },
      });
    }

    console.log('Using system user ID:', systemUser.id);

    // Create frameworks
    const soc2Framework = await prisma.framework.create({
      data: {
        organizationId: orgId,
        name: 'SOC 2 Type II',
        version: '2017',
        description: 'Service Organization Control 2 Type II compliance framework',
        source: 'AICPA',
        type: 'SOC2_TYPE_II',
        isActive: true,
      },
    });

    const iso27001Framework = await prisma.framework.create({
      data: {
        organizationId: orgId,
        name: 'ISO 27001',
        version: '2022',
        description: 'Information Security Management System standard',
        source: 'ISO',
        type: 'ISO_27001',
        isActive: true,
      },
    });

    const commonFramework = await prisma.framework.create({
      data: {
        organizationId: orgId,
        name: 'Common Control Library',
        version: '1.0',
        description: 'Baseline security controls applicable across multiple frameworks',
        source: 'Internal',
        type: 'CUSTOM',
        isActive: true,
      },
    });

    console.log('Created frameworks:', { soc2Framework: soc2Framework.id, iso27001Framework: iso27001Framework.id, commonFramework: commonFramework.id });

    // Create SOC 2 controls
    console.log('Creating SOC 2 controls...');
    for (const control of soc2Controls) {
      await prisma.control.create({
        data: {
          organizationId: orgId,
          frameworkId: soc2Framework.id,
          name: control.name,
          description: control.description,
          category: control.category,
          status: 'GAP',
          criticality: control.criticality,
          createdBy: systemUser.id,
          updatedBy: systemUser.id,
        },
      });
    }

    // Create ISO 27001 controls
    console.log('Creating ISO 27001 controls...');
    for (const control of iso27001Controls) {
      await prisma.control.create({
        data: {
          organizationId: orgId,
          frameworkId: iso27001Framework.id,
          name: control.name,
          description: control.description,
          category: control.category,
          status: 'GAP',
          criticality: control.criticality,
          createdBy: systemUser.id,
          updatedBy: systemUser.id,
        },
      });
    }

    // Create Common Control Library controls
    console.log('Creating Common Control Library controls...');
    for (const control of commonControls) {
      await prisma.control.create({
        data: {
          organizationId: orgId,
          frameworkId: commonFramework.id,
          name: control.name,
          description: control.description,
          category: control.category,
          status: 'GAP',
          criticality: control.criticality,
          createdBy: systemUser.id,
          updatedBy: systemUser.id,
        },
      });
    }

    console.log('Framework population completed successfully!');
    console.log(`Created ${soc2Controls.length} SOC 2 controls`);
    console.log(`Created ${iso27001Controls.length} ISO 27001 controls`);
    console.log(`Created ${commonControls.length} Common Control Library controls`);

  } catch (error) {
    console.error('Error populating frameworks:', error);
    throw error;
  }
}

// Run the population script
populateFrameworks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
