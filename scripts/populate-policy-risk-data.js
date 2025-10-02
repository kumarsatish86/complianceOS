const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Policy & Risk Management data population...');

  try {
    // Check for existing organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('📝 Creating default organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          domain: 'default.com',
          status: 'active',
          plan: 'enterprise',
          description: 'Default organization for Policy & Risk Management',
          settings: {}
        }
      });
    }

    // Check for existing system user
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@complianceos.com' }
    });
    if (!systemUser) {
      console.log('👤 Creating system user...');
      systemUser = await prisma.user.create({
        data: {
          name: 'System User',
          email: 'system@complianceos.com',
          platformRoleId: null
        }
      });
    }

    console.log('📋 Creating sample policies...');
    
    // Create sample policies
    const policies = await Promise.all([
      prisma.policy.create({
        data: {
          organizationId: organization.id,
          title: 'Information Security Policy',
          description: 'Comprehensive policy covering information security requirements, data protection, and security controls.',
          category: 'GOVERNANCE',
          policyType: 'INFORMATION_SECURITY',
          version: '2.1.0',
          status: 'PUBLISHED',
          ownerId: systemUser.id,
          reviewerId: systemUser.id,
          approverId: systemUser.id,
          publishedAt: new Date(),
          effectiveDate: new Date(),
          nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          retentionPeriod: 2555, // 7 years
          metadata: {
            tags: ['security', 'data-protection', 'compliance'],
            classification: 'CONFIDENTIAL',
            reviewCycle: 'ANNUAL'
          }
        }
      }),
      prisma.policy.create({
        data: {
          organizationId: organization.id,
          title: 'Data Protection and Privacy Policy',
          description: 'Policy governing the collection, processing, and protection of personal data in compliance with GDPR and other privacy regulations.',
          category: 'LEGAL',
          policyType: 'DATA_PROTECTION',
          version: '1.5.0',
          status: 'PUBLISHED',
          ownerId: systemUser.id,
          reviewerId: systemUser.id,
          approverId: systemUser.id,
          publishedAt: new Date(),
          effectiveDate: new Date(),
          nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
          retentionPeriod: 1825, // 5 years
          metadata: {
            tags: ['privacy', 'gdpr', 'data-protection'],
            classification: 'PUBLIC',
            reviewCycle: 'SEMI_ANNUAL'
          }
        }
      }),
      prisma.policy.create({
        data: {
          organizationId: organization.id,
          title: 'Access Control Policy',
          description: 'Defines access control requirements, user authentication, authorization, and access management procedures.',
          category: 'TECHNICAL',
          policyType: 'ACCESS_CONTROL',
          version: '1.2.0',
          status: 'UNDER_REVIEW',
          ownerId: systemUser.id,
          reviewerId: systemUser.id,
          effectiveDate: new Date(),
          nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
          retentionPeriod: 1095, // 3 years
          metadata: {
            tags: ['access-control', 'authentication', 'authorization'],
            classification: 'INTERNAL',
            reviewCycle: 'QUARTERLY'
          }
        }
      }),
      prisma.policy.create({
        data: {
          organizationId: organization.id,
          title: 'Incident Response Policy',
          description: 'Establishes procedures for detecting, responding to, and recovering from security incidents.',
          category: 'OPERATIONAL',
          policyType: 'INCIDENT_RESPONSE',
          version: '1.0.0',
          status: 'DRAFT',
          ownerId: systemUser.id,
          effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
          nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
          retentionPeriod: 2555, // 7 years
          metadata: {
            tags: ['incident-response', 'security', 'emergency'],
            classification: 'CONFIDENTIAL',
            reviewCycle: 'SEMI_ANNUAL'
          }
        }
      }),
      prisma.policy.create({
        data: {
          organizationId: organization.id,
          title: 'Business Continuity Policy',
          description: 'Ensures business operations continue during and after disruptive events through comprehensive continuity planning.',
          category: 'OPERATIONAL',
          policyType: 'BUSINESS_CONTINUITY',
          version: '1.3.0',
          status: 'PUBLISHED',
          ownerId: systemUser.id,
          reviewerId: systemUser.id,
          approverId: systemUser.id,
          publishedAt: new Date(),
          effectiveDate: new Date(),
          nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          retentionPeriod: 2555, // 7 years
          metadata: {
            tags: ['business-continuity', 'disaster-recovery', 'resilience'],
            classification: 'CONFIDENTIAL',
            reviewCycle: 'ANNUAL'
          }
        }
      })
    ]);

    console.log('✅ Created', policies.length, 'policies');

    // Create policy acknowledgments
    console.log('📝 Creating policy acknowledgments...');
    const acknowledgments = [];
    for (const policy of policies.filter(p => p.status === 'PUBLISHED')) {
      // Create acknowledgments for different users
      const acknowledgmentData = [
        { userId: systemUser.id, status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
        { userId: systemUser.id, status: 'PENDING' },
        { userId: systemUser.id, status: 'ACKNOWLEDGED', acknowledgedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        { userId: systemUser.id, status: 'OVERDUE' },
        { userId: systemUser.id, status: 'ACKNOWLEDGED', acknowledgedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      ];

      for (const ackData of acknowledgmentData) {
        const acknowledgment = await prisma.policyAcknowledgment.create({
          data: {
            policyId: policy.id,
            policyVersion: policy.version,
            userId: ackData.userId,
            acknowledgedAt: ackData.acknowledgedAt,
            method: 'WEB_PORTAL',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            status: ackData.status,
            metadata: {
              deviceType: 'desktop',
              browser: 'chrome',
              os: 'windows'
            }
          }
        });
        acknowledgments.push(acknowledgment);
      }
    }

    console.log('✅ Created', acknowledgments.length, 'policy acknowledgments');

    // Create sample risks
    console.log('⚠️ Creating sample risks...');
    const risks = await Promise.all([
      prisma.risk.create({
        data: {
          organizationId: organization.id,
          title: 'Data Breach Risk',
          description: 'Risk of unauthorized access to sensitive data leading to data breach and regulatory penalties.',
          category: 'SECURITY',
          subcategory: 'DATA_PROTECTION_RISK',
          likelihoodInherent: 'LIKELY',
          impactInherent: 'HIGH',
          severityInherent: 'HIGH',
          likelihoodResidual: 'POSSIBLE',
          impactResidual: 'MEDIUM',
          severityResidual: 'MEDIUM',
          status: 'TREATMENT_IMPLEMENTED',
          businessUnit: 'IT',
          ownerId: systemUser.id,
          metadata: {
            tags: ['data-breach', 'security', 'compliance'],
            riskSource: 'EXTERNAL',
            riskVelocity: 'HIGH',
            interdependencies: ['cybersecurity-risk', 'vendor-risk']
          }
        }
      }),
      prisma.risk.create({
        data: {
          organizationId: organization.id,
          title: 'Cybersecurity Attack Risk',
          description: 'Risk of cyber attacks including malware, phishing, and ransomware affecting business operations.',
          category: 'SECURITY',
          subcategory: 'CYBERSECURITY_RISK',
          likelihoodInherent: 'LIKELY',
          impactInherent: 'VERY_HIGH',
          severityInherent: 'VERY_HIGH',
          likelihoodResidual: 'UNLIKELY',
          impactResidual: 'HIGH',
          severityResidual: 'HIGH',
          status: 'MONITORED',
          businessUnit: 'IT',
          ownerId: systemUser.id,
          metadata: {
            tags: ['cybersecurity', 'malware', 'ransomware'],
            riskSource: 'EXTERNAL',
            riskVelocity: 'VERY_HIGH',
            interdependencies: ['data-breach-risk', 'vendor-risk']
          }
        }
      }),
      prisma.risk.create({
        data: {
          organizationId: organization.id,
          title: 'Vendor Dependency Risk',
          description: 'Risk associated with over-dependence on critical vendors for essential business services.',
          category: 'OPERATIONAL',
          subcategory: 'SUPPLY_CHAIN_RISK',
          likelihoodInherent: 'POSSIBLE',
          impactInherent: 'HIGH',
          severityInherent: 'HIGH',
          likelihoodResidual: 'POSSIBLE',
          impactResidual: 'MEDIUM',
          severityResidual: 'MEDIUM',
          status: 'ASSESSED',
          businessUnit: 'Operations',
          ownerId: systemUser.id,
          metadata: {
            tags: ['vendor', 'supply-chain', 'dependency'],
            riskSource: 'EXTERNAL',
            riskVelocity: 'MEDIUM',
            interdependencies: ['operational-risk', 'financial-risk']
          }
        }
      }),
      prisma.risk.create({
        data: {
          organizationId: organization.id,
          title: 'Regulatory Compliance Risk',
          description: 'Risk of non-compliance with applicable regulations leading to penalties and reputational damage.',
          category: 'COMPLIANCE',
          subcategory: 'REGULATORY_RISK',
          likelihoodInherent: 'POSSIBLE',
          impactInherent: 'VERY_HIGH',
          severityInherent: 'VERY_HIGH',
          likelihoodResidual: 'UNLIKELY',
          impactResidual: 'HIGH',
          severityResidual: 'HIGH',
          status: 'TREATMENT_PLANNED',
          businessUnit: 'Legal',
          ownerId: systemUser.id,
          metadata: {
            tags: ['compliance', 'regulatory', 'penalties'],
            riskSource: 'EXTERNAL',
            riskVelocity: 'LOW',
            interdependencies: ['reputation-risk', 'financial-risk']
          }
        }
      }),
      prisma.risk.create({
        data: {
          organizationId: organization.id,
          title: 'Technology Infrastructure Risk',
          description: 'Risk of technology infrastructure failure affecting business operations and service delivery.',
          category: 'TECHNOLOGY',
          subcategory: 'TECHNOLOGY_RISK',
          likelihoodInherent: 'POSSIBLE',
          impactInherent: 'HIGH',
          severityInherent: 'HIGH',
          likelihoodResidual: 'UNLIKELY',
          impactResidual: 'MEDIUM',
          severityResidual: 'MEDIUM',
          status: 'IDENTIFIED',
          businessUnit: 'IT',
          ownerId: systemUser.id,
          metadata: {
            tags: ['infrastructure', 'technology', 'availability'],
            riskSource: 'INTERNAL',
            riskVelocity: 'HIGH',
            interdependencies: ['operational-risk', 'business-continuity-risk']
          }
        }
      })
    ]);

    console.log('✅ Created', risks.length, 'risks');

    // Create risk assessments
    console.log('📊 Creating risk assessments...');
    const assessments = [];
    for (const risk of risks) {
      const assessment = await prisma.riskAssessment.create({
        data: {
          riskId: risk.id,
          assessedBy: systemUser.id,
          methodology: 'QUANTITATIVE',
          assessmentDate: new Date(),
          likelihoodScore: 4.0,
          impactScore: 4.5,
          severityCalculation: risk.severityInherent,
          confidenceLevel: 85.0,
          notes: 'Assessment based on historical data and expert judgment',
          nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
          approvedBy: systemUser.id,
          approvedAt: new Date(),
          metadata: {
            assessmentFramework: 'ISO_31000',
            assessorExperience: 'SENIOR',
            dataQuality: 'HIGH'
          }
        }
      });
      assessments.push(assessment);
    }

    console.log('✅ Created', assessments.length, 'risk assessments');

    // Create risk treatments
    console.log('🔧 Creating risk treatments...');
    const treatments = [];
    for (const risk of risks.filter(r => r.status === 'TREATMENT_IMPLEMENTED' || r.status === 'MONITORED')) {
      const treatment = await prisma.riskTreatment.create({
        data: {
          riskId: risk.id,
          treatmentStrategy: 'MITIGATE',
          treatmentDescription: 'Implement comprehensive security controls and monitoring systems to reduce risk exposure.',
          ownerId: systemUser.id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          targetCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          actualCompletionDate: risk.status === 'MONITORED' ? new Date() : null,
          budgetAllocated: 50000.0,
          actualCost: risk.status === 'MONITORED' ? 45000.0 : null,
          status: risk.status === 'MONITORED' ? 'COMPLETED' : 'IN_PROGRESS',
          effectivenessRating: risk.status === 'MONITORED' ? 85.0 : null,
          metadata: {
            treatmentType: 'CONTROL_IMPLEMENTATION',
            implementationPhase: risk.status === 'MONITORED' ? 'COMPLETED' : 'IN_PROGRESS',
            successMetrics: ['reduction_in_incidents', 'improved_detection_rate']
          }
        }
      });
      treatments.push(treatment);
    }

    console.log('✅ Created', treatments.length, 'risk treatments');

    // Create governance metrics
    console.log('📈 Creating governance metrics...');
    const metrics = await Promise.all([
      prisma.governanceMetric.create({
        data: {
          organizationId: organization.id,
          metricType: 'POLICY_COMPLIANCE',
          metricName: 'Policy Acknowledgment Rate',
          metricValue: 85.5,
          targetValue: 95.0,
          unit: 'PERCENTAGE',
          calculationMethod: 'ACKNOWLEDGED_POLICIES / TOTAL_POLICIES * 100',
          dataSource: 'POLICY_ACKNOWLEDGMENT_TABLE',
          metadata: {
            category: 'COMPLIANCE',
            frequency: 'DAILY',
            trend: 'IMPROVING'
          }
        }
      }),
      prisma.governanceMetric.create({
        data: {
          organizationId: organization.id,
          metricType: 'RISK_EXPOSURE',
          metricName: 'Critical Risk Count',
          metricValue: 2.0,
          targetValue: 1.0,
          unit: 'COUNT',
          calculationMethod: 'COUNT_OF_RISKS_WITH_SEVERITY_CRITICAL',
          dataSource: 'RISK_TABLE',
          metadata: {
            category: 'RISK',
            frequency: 'WEEKLY',
            trend: 'STABLE'
          }
        }
      }),
      prisma.governanceMetric.create({
        data: {
          organizationId: organization.id,
          metricType: 'CONTROL_EFFECTIVENESS',
          metricName: 'Control Compliance Rate',
          metricValue: 92.3,
          targetValue: 95.0,
          unit: 'PERCENTAGE',
          calculationMethod: 'MET_CONTROLS / TOTAL_CONTROLS * 100',
          dataSource: 'CONTROL_TABLE',
          metadata: {
            category: 'COMPLIANCE',
            frequency: 'MONTHLY',
            trend: 'IMPROVING'
          }
        }
      })
    ]);

    console.log('✅ Created', metrics.length, 'governance metrics');

    // Create governance alerts
    console.log('🚨 Creating governance alerts...');
    const alerts = await Promise.all([
      prisma.governanceAlert.create({
        data: {
          organizationId: organization.id,
          alertType: 'POLICY_OVERDUE',
          title: 'Overdue Policy Acknowledgments',
          description: 'Several employees have not acknowledged critical policies within the required timeframe.',
          severity: 'MEDIUM',
          status: 'ACTIVE',
          triggeredAt: new Date(),
          metadata: {
            affectedPolicies: 2,
            affectedUsers: 5,
            escalationLevel: 1
          }
        }
      }),
      prisma.governanceAlert.create({
        data: {
          organizationId: organization.id,
          alertType: 'RISK_THRESHOLD',
          title: 'Critical Risk Identified',
          description: 'New critical risk identified requiring immediate attention and treatment planning.',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          triggeredAt: new Date(),
          metadata: {
            riskId: risks[0].id,
            riskTitle: risks[0].title,
            escalationLevel: 3
          }
        }
      }),
      prisma.governanceAlert.create({
        data: {
          organizationId: organization.id,
          alertType: 'COMPLIANCE_GAP',
          title: 'Compliance Gap Detected',
          description: 'Gap identified in control implementation requiring remediation action.',
          severity: 'HIGH',
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy: systemUser.id,
          triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          metadata: {
            controlId: 'ctrl-001',
            gapDescription: 'Missing access control documentation',
            remediationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    console.log('✅ Created', alerts.length, 'governance alerts');

    console.log('🎉 Policy & Risk Management data population completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Policies:', policies.length);
    console.log('   - Policy Acknowledgments:', acknowledgments.length);
    console.log('   - Risks:', risks.length);
    console.log('   - Risk Assessments:', assessments.length);
    console.log('   - Risk Treatments:', treatments.length);
    console.log('   - Governance Metrics:', metrics.length);
    console.log('   - Governance Alerts:', alerts.length);

  } catch (error) {
    console.error('❌ Error populating Policy & Risk Management data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
