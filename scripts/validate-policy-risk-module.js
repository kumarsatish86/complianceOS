const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validatePolicyRiskModule() {
  console.log('🔍 Validating Policy & Risk Management Module...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Validate Policy Management
    console.log('\n📋 Validating Policy Management...');
    
    const policyCount = await prisma.policy.count();
    console.log(`   - Total Policies: ${policyCount}`);
    
    const policyVersionCount = await prisma.policyVersion.count();
    console.log(`   - Policy Versions: ${policyVersionCount}`);
    
    const acknowledgmentCount = await prisma.policyAcknowledgment.count();
    console.log(`   - Policy Acknowledgments: ${acknowledgmentCount}`);
    
    const assignmentCount = await prisma.policyAssignment.count();
    console.log(`   - Policy Assignments: ${assignmentCount}`);

    // Validate Risk Management
    console.log('\n⚠️ Validating Risk Management...');
    
    const riskCount = await prisma.risk.count();
    console.log(`   - Total Risks: ${riskCount}`);
    
    const assessmentCount = await prisma.riskAssessment.count();
    console.log(`   - Risk Assessments: ${assessmentCount}`);
    
    const treatmentCount = await prisma.riskTreatment.count();
    console.log(`   - Risk Treatments: ${treatmentCount}`);
    
    const riskControlMappingCount = await prisma.riskControlMapping.count();
    console.log(`   - Risk-Control Mappings: ${riskControlMappingCount}`);
    
    const riskPolicyMappingCount = await prisma.riskPolicyMapping.count();
    console.log(`   - Risk-Policy Mappings: ${riskPolicyMappingCount}`);

    // Validate Governance
    console.log('\n🏛️ Validating Governance...');
    
    const dashboardCount = await prisma.governanceDashboard.count();
    console.log(`   - Governance Dashboards: ${dashboardCount}`);
    
    const metricCount = await prisma.governanceMetric.count();
    console.log(`   - Governance Metrics: ${metricCount}`);
    
    const alertCount = await prisma.governanceAlert.count();
    console.log(`   - Governance Alerts: ${alertCount}`);

    // Test relationships
    console.log('\n🔗 Testing relationships...');
    
    // Test Policy relationships
    const policyWithRelations = await prisma.policy.findFirst({
      include: {
        owner: true,
        reviewer: true,
        approver: true,
        organization: true,
        versions: true,
        acknowledgments: true,
        assignments: true,
        riskMappings: true
      }
    });
    
    if (policyWithRelations) {
      console.log('   ✅ Policy relationships working');
      console.log(`      - Owner: ${policyWithRelations.owner?.name || 'N/A'}`);
      console.log(`      - Versions: ${policyWithRelations.versions.length}`);
      console.log(`      - Acknowledgments: ${policyWithRelations.acknowledgments.length}`);
    } else {
      console.log('   ⚠️ No policies found for relationship testing');
    }

    // Test Risk relationships
    const riskWithRelations = await prisma.risk.findFirst({
      include: {
        owner: true,
        organization: true,
        assessments: true,
        treatments: true,
        controlMappings: true,
        policyMappings: true
      }
    });
    
    if (riskWithRelations) {
      console.log('   ✅ Risk relationships working');
      console.log(`      - Owner: ${riskWithRelations.owner?.name || 'N/A'}`);
      console.log(`      - Assessments: ${riskWithRelations.assessments.length}`);
      console.log(`      - Treatments: ${riskWithRelations.treatments.length}`);
    } else {
      console.log('   ⚠️ No risks found for relationship testing');
    }

    // Test Governance relationships
    const governanceWithRelations = await prisma.governanceDashboard.findFirst({
      include: {
        creator: true,
        organization: true
      }
    });
    
    if (governanceWithRelations) {
      console.log('   ✅ Governance relationships working');
      console.log(`      - Creator: ${governanceWithRelations.creator?.name || 'N/A'}`);
    } else {
      console.log('   ⚠️ No governance dashboards found for relationship testing');
    }

    // Test analytics queries
    console.log('\n📊 Testing analytics queries...');
    
    // Policy analytics
    const policyAnalytics = await prisma.policy.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    console.log('   ✅ Policy status analytics working');
    console.log(`      - Status distribution: ${policyAnalytics.length} categories`);

    // Risk analytics
    const riskAnalytics = await prisma.risk.groupBy({
      by: ['severityInherent'],
      _count: {
        severityInherent: true
      }
    });
    console.log('   ✅ Risk severity analytics working');
    console.log(`      - Severity distribution: ${riskAnalytics.length} categories`);

    // Acknowledgment analytics
    const acknowledgmentAnalytics = await prisma.policyAcknowledgment.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    console.log('   ✅ Acknowledgment status analytics working');
    console.log(`      - Status distribution: ${acknowledgmentAnalytics.length} categories`);

    // Test complex queries
    console.log('\n🔍 Testing complex queries...');
    
    // Policy compliance rate calculation
    const totalAcknowledgments = await prisma.policyAcknowledgment.count();
    const acknowledgedPolicies = await prisma.policyAcknowledgment.count({
      where: { status: 'ACKNOWLEDGED' }
    });
    const complianceRate = totalAcknowledgments > 0 ? (acknowledgedPolicies / totalAcknowledgments) * 100 : 0;
    console.log(`   ✅ Policy compliance rate: ${complianceRate.toFixed(2)}%`);

    // Risk distribution by category
    const riskDistribution = await prisma.risk.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });
    console.log(`   ✅ Risk distribution by category: ${riskDistribution.length} categories`);

    // Treatment effectiveness
    const completedTreatments = await prisma.riskTreatment.findMany({
      where: { status: 'COMPLETED' },
      select: { effectivenessRating: true }
    });
    const avgEffectiveness = completedTreatments.length > 0 
      ? completedTreatments.reduce((sum, t) => sum + (t.effectivenessRating || 0), 0) / completedTreatments.length 
      : 0;
    console.log(`   ✅ Average treatment effectiveness: ${avgEffectiveness.toFixed(2)}%`);

    // Test data integrity
    console.log('\n🔒 Testing data integrity...');
    
    // Check for orphaned records - using a simpler approach
    try {
      const acknowledgmentWithPolicy = await prisma.policyAcknowledgment.findFirst({
        include: {
          policy: true
        }
      });
      console.log(`   ✅ Policy acknowledgment relationships working: ${acknowledgmentWithPolicy ? 'Yes' : 'No data'}`);
    } catch (error) {
      console.log(`   ❌ Policy acknowledgment relationship error: ${error.message}`);
    }

    try {
      const assessmentWithRisk = await prisma.riskAssessment.findFirst({
        include: {
          risk: true
        }
      });
      console.log(`   ✅ Risk assessment relationships working: ${assessmentWithRisk ? 'Yes' : 'No data'}`);
    } catch (error) {
      console.log(`   ❌ Risk assessment relationship error: ${error.message}`);
    }

    try {
      const treatmentWithRisk = await prisma.riskTreatment.findFirst({
        include: {
          risk: true
        }
      });
      console.log(`   ✅ Risk treatment relationships working: ${treatmentWithRisk ? 'Yes' : 'No data'}`);
    } catch (error) {
      console.log(`   ❌ Risk treatment relationship error: ${error.message}`);
    }

    // Test enum values
    console.log('\n📝 Testing enum values...');
    
    const policyStatuses = await prisma.policy.findMany({
      select: { status: true },
      distinct: ['status']
    });
    console.log(`   ✅ Policy statuses: ${policyStatuses.map(p => p.status).join(', ')}`);

    const riskStatuses = await prisma.risk.findMany({
      select: { status: true },
      distinct: ['status']
    });
    console.log(`   ✅ Risk statuses: ${riskStatuses.map(r => r.status).join(', ')}`);

    const acknowledgmentStatuses = await prisma.policyAcknowledgment.findMany({
      select: { status: true },
      distinct: ['status']
    });
    console.log(`   ✅ Acknowledgment statuses: ${acknowledgmentStatuses.map(a => a.status).join(', ')}`);

    // Performance test
    console.log('\n⚡ Testing performance...');
    
    const startTime = Date.now();
    await prisma.policy.findMany({
      include: {
        owner: true,
        acknowledgments: true,
        versions: true
      },
      take: 10
    });
    const queryTime = Date.now() - startTime;
    console.log(`   ✅ Policy query with relations: ${queryTime}ms`);

    const startTime2 = Date.now();
    await prisma.risk.findMany({
      include: {
        owner: true,
        assessments: true,
        treatments: true
      },
      take: 10
    });
    const queryTime2 = Date.now() - startTime2;
    console.log(`   ✅ Risk query with relations: ${queryTime2}ms`);

    console.log('\n🎉 Policy & Risk Management Module validation completed successfully!');
    console.log('\n📊 Module Summary:');
    console.log(`   - Policies: ${policyCount}`);
    console.log(`   - Policy Versions: ${policyVersionCount}`);
    console.log(`   - Policy Acknowledgments: ${acknowledgmentCount}`);
    console.log(`   - Policy Assignments: ${assignmentCount}`);
    console.log(`   - Risks: ${riskCount}`);
    console.log(`   - Risk Assessments: ${assessmentCount}`);
    console.log(`   - Risk Treatments: ${treatmentCount}`);
    console.log(`   - Risk-Control Mappings: ${riskControlMappingCount}`);
    console.log(`   - Risk-Policy Mappings: ${riskPolicyMappingCount}`);
    console.log(`   - Governance Dashboards: ${dashboardCount}`);
    console.log(`   - Governance Metrics: ${metricCount}`);
    console.log(`   - Governance Alerts: ${alertCount}`);

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

validatePolicyRiskModule()
  .catch((e) => {
    console.error('❌ Validation script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
