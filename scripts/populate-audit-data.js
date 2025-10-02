const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateAuditData() {
  try {
    console.log('Starting audit data population...');

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

    // Check for existing users
    let users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('No users found. Creating default users...');
      const adminUser = await prisma.user.create({
        data: {
          name: 'Audit Administrator',
          email: 'audit-admin@complianceos.com',
          platformRoleId: null,
        },
      });
      const reviewerUser = await prisma.user.create({
        data: {
          name: 'Audit Reviewer',
          email: 'audit-reviewer@complianceos.com',
          platformRoleId: null,
        },
      });
      const approverUser = await prisma.user.create({
        data: {
          name: 'Audit Approver',
          email: 'audit-approver@complianceos.com',
          platformRoleId: null,
        },
      });
      users = [adminUser, reviewerUser, approverUser];
    }

    const adminUser = users[0];
    const reviewerUser = users[1] || users[0];
    const approverUser = users[2] || users[0];

    console.log('Using users:', {
      admin: adminUser.email,
      reviewer: reviewerUser.email,
      approver: approverUser.email,
    });

    // Check for existing frameworks
    let frameworks = await prisma.framework.findMany({
      where: { organizationId: orgId },
    });

    if (frameworks.length === 0) {
      console.log('No frameworks found. Creating default frameworks...');
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
      frameworks = [soc2Framework];
    }

    const framework = frameworks[0];

    // Check for existing controls
    let controls = await prisma.control.findMany({
      where: { organizationId: orgId },
      take: 10, // Use first 10 controls
    });

    if (controls.length === 0) {
      console.log('No controls found. Creating sample controls...');
      const sampleControls = [
        {
          name: 'Access Control Policy',
          description: 'Implement and maintain access control policies',
          category: 'PEOPLE',
          criticality: 'HIGH',
          ownerUserId: reviewerUser.id,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
        {
          name: 'User Access Reviews',
          description: 'Regular review of user access rights',
          category: 'PROCESS',
          criticality: 'HIGH',
          ownerUserId: reviewerUser.id,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
        {
          name: 'Data Encryption',
          description: 'Encrypt sensitive data at rest and in transit',
          category: 'PROCESS',
          criticality: 'CRITICAL',
          ownerUserId: approverUser.id,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
        {
          name: 'Incident Response',
          description: 'Establish incident response procedures',
          category: 'PROCESS',
          criticality: 'HIGH',
          ownerUserId: reviewerUser.id,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
        {
          name: 'Security Monitoring',
          description: 'Continuous security monitoring and logging',
          category: 'PROCESS',
          criticality: 'MEDIUM',
          ownerUserId: approverUser.id,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
      ];

      for (const controlData of sampleControls) {
        const control = await prisma.control.create({
          data: {
            organizationId: orgId,
            frameworkId: framework.id,
            ...controlData,
          },
        });
        controls.push(control);
      }
    }

    console.log('Using controls:', controls.length);

    // Create sample audit runs
    const auditRuns = [];

    // Q1 2024 Internal Audit
    const q1Audit = await prisma.auditRun.create({
      data: {
        organizationId: orgId,
        name: 'Q1 2024 Internal Compliance Audit',
        description: 'Quarterly internal compliance audit covering SOC 2 controls',
        frameworkId: framework.id,
        scope: 'All SOC 2 Type II controls',
        createdBy: adminUser.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        auditType: 'INTERNAL',
        status: 'LOCKED',
        lockedAt: new Date('2024-04-01'),
      },
    });
    auditRuns.push(q1Audit);

    // Q2 2024 External Audit
    const q2Audit = await prisma.auditRun.create({
      data: {
        organizationId: orgId,
        name: 'Q2 2024 External SOC 2 Audit',
        description: 'External SOC 2 Type II audit by certified auditor',
        frameworkId: framework.id,
        scope: 'SOC 2 Type II Trust Services Criteria',
        createdBy: adminUser.id,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        auditType: 'EXTERNAL',
        status: 'IN_PROGRESS',
        externalAuditorInfo: {
          auditor: 'ABC Audit Firm',
          contact: 'auditor@abc.com',
          certification: 'CPA, CISA',
        },
      },
    });
    auditRuns.push(q2Audit);

    // Current Self Assessment
    const selfAssessment = await prisma.auditRun.create({
      data: {
        organizationId: orgId,
        name: '2024 Self Assessment',
        description: 'Annual self-assessment of compliance posture',
        frameworkId: framework.id,
        scope: 'All compliance frameworks',
        createdBy: adminUser.id,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        auditType: 'SELF_ASSESSMENT',
        status: 'DRAFT',
      },
    });
    auditRuns.push(selfAssessment);

    console.log('Created audit runs:', auditRuns.length);

    // Create audit controls for each audit run
    for (const auditRun of auditRuns) {
      const auditControls = [];
      
      for (const control of controls.slice(0, 5)) { // Use first 5 controls
        const auditControl = await prisma.auditControl.create({
          data: {
            auditRunId: auditRun.id,
            controlId: control.id,
            reviewerId: reviewerUser.id,
            approverId: approverUser.id,
            status: auditRun.status === 'LOCKED' ? 'MET' : 'GAP',
            submittedAt: auditRun.status === 'LOCKED' ? new Date() : null,
            approvedAt: auditRun.status === 'LOCKED' ? new Date() : null,
          },
        });
        auditControls.push(auditControl);
      }

      // Create tasks for evidence collection
      await prisma.task.createMany({
        data: controls.slice(0, 5).map((control) => ({
          organizationId: orgId,
          type: 'EVIDENCE_COLLECTION',
          controlId: control.id,
          auditRunId: auditRun.id,
          auditPhase: 'EXECUTION',
          assigneeId: reviewerUser.id,
          status: auditRun.status === 'LOCKED' ? 'COMPLETED' : 'OPEN',
          priority: 'MEDIUM',
          comments: `Collect evidence for audit: ${auditRun.name}`,
          createdBy: adminUser.id,
          completedBy: auditRun.status === 'LOCKED' ? reviewerUser.id : null,
          completedAt: auditRun.status === 'LOCKED' ? new Date() : null,
        })),
      });

      console.log(`Created ${auditControls.length} audit controls for ${auditRun.name}`);
    }

    // Create sample audit findings
    const findings = [];

    // Critical finding for Q1 audit
    const criticalFinding = await prisma.auditFinding.create({
      data: {
        auditRunId: auditRuns[0].id,
        controlId: controls[2].id, // Data Encryption control
        severity: 'CRITICAL',
        title: 'Missing Database Encryption',
        description: 'Production database is not encrypted at rest, violating SOC 2 requirements',
        remediationPlan: 'Implement AES-256 encryption for all production databases',
        ownerId: approverUser.id,
        dueDate: new Date('2024-02-15'),
        status: 'MITIGATED',
      },
    });
    findings.push(criticalFinding);

    // High finding for Q2 audit
    const highFinding = await prisma.auditFinding.create({
      data: {
        auditRunId: auditRuns[1].id,
        controlId: controls[0].id, // Access Control Policy
        severity: 'HIGH',
        title: 'Incomplete Access Review Documentation',
        description: 'Access review documentation lacks required approval signatures',
        remediationPlan: 'Update access review process to include digital signatures',
        ownerId: reviewerUser.id,
        dueDate: new Date('2024-05-15'),
        status: 'IN_PROGRESS',
      },
    });
    findings.push(highFinding);

    // Medium finding for self assessment
    const mediumFinding = await prisma.auditFinding.create({
      data: {
        auditRunId: auditRuns[2].id,
        controlId: controls[4].id, // Security Monitoring
        severity: 'MEDIUM',
        title: 'Log Retention Policy Gap',
        description: 'Security logs are retained for only 30 days, should be 1 year minimum',
        remediationPlan: 'Extend log retention to 12 months and implement automated archival',
        ownerId: reviewerUser.id,
        dueDate: new Date('2024-10-31'),
        status: 'OPEN',
      },
    });
    findings.push(mediumFinding);

    console.log('Created audit findings:', findings.length);

    // Create audit activities
    for (const auditRun of auditRuns) {
      await prisma.auditRunActivity.create({
        data: {
          auditRunId: auditRun.id,
          activityType: 'CREATED',
          performedBy: adminUser.id,
          targetEntity: 'audit_run',
          newValue: JSON.stringify({ name: auditRun.name, status: auditRun.status }),
        },
      });

      if (auditRun.status === 'LOCKED') {
        await prisma.auditRunActivity.create({
          data: {
            auditRunId: auditRun.id,
            activityType: 'AUDIT_LOCKED',
            performedBy: adminUser.id,
            targetEntity: 'audit_run',
            newValue: JSON.stringify({ lockedAt: auditRun.lockedAt }),
          },
        });
      }
    }

    console.log('Created audit activities');

    // Create sample evidence links
    const evidenceLinks = [];
    
    // Get some evidence if it exists
    const evidence = await prisma.evidence.findMany({
      where: { organizationId: orgId },
      take: 3,
    });

    if (evidence.length > 0) {
      for (const auditRun of auditRuns.slice(0, 2)) { // Only for first 2 audit runs
        for (const control of controls.slice(0, 3)) {
          for (const evidenceItem of evidence) {
            const link = await prisma.auditEvidenceLink.create({
              data: {
                auditRunId: auditRun.id,
                controlId: control.id,
                evidenceId: evidenceItem.id,
                linkedBy: reviewerUser.id,
                lockedFlag: auditRun.status === 'LOCKED',
                snapshotHash: `hash_${auditRun.id}_${control.id}_${evidenceItem.id}`,
                versionLocked: evidenceItem.version,
              },
            });
            evidenceLinks.push(link);
          }
        }
      }
    }

    console.log('Created evidence links:', evidenceLinks.length);

    console.log('✅ Audit data population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Organizations: ${organizations.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Frameworks: ${frameworks.length}`);
    console.log(`   - Controls: ${controls.length}`);
    console.log(`   - Audit Runs: ${auditRuns.length}`);
    console.log(`   - Audit Findings: ${findings.length}`);
    console.log(`   - Evidence Links: ${evidenceLinks.length}`);

  } catch (error) {
    console.error('❌ Error populating audit data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population
populateAuditData()
  .then(() => {
    console.log('🎉 Audit data population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Audit data population failed:', error);
    process.exit(1);
  });
