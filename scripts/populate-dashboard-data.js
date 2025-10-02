const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateDashboardData() {
  try {
    console.log('🚀 Starting Security Posture Dashboard data population...');

    // Get or create default organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          id: 'org-123',
          name: 'Default Organization',
          description: 'Default organization for dashboard testing',
          isActive: true
        }
      });
      console.log('✅ Created default organization');
    } else {
      console.log('✅ Using existing organization:', organization.name);
    }

    // Get or create system user
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@complianceos.com' }
    });
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          id: 'system-user',
          email: 'system@complianceos.com',
          name: 'System User',
          role: 'PLATFORM_ADMIN',
          emailVerified: new Date()
        }
      });
      console.log('✅ Created system user');
    } else {
      console.log('✅ Using existing system user');
    }

    // Create metric snapshots for different time periods
    const now = new Date();
    const timeframes = [
      { days: 0, label: 'current' },
      { days: -1, label: 'yesterday' },
      { days: -7, label: '1 week ago' },
      { days: -30, label: '1 month ago' },
      { days: -90, label: '3 months ago' }
    ];

    console.log('📊 Creating metric snapshots...');

    for (const timeframe of timeframes) {
      const captureDate = new Date(now.getTime() + (timeframe.days * 24 * 60 * 60 * 1000));
      
      // Compliance Score (improving over time)
      const complianceScore = Math.max(60, Math.min(95, 75 + (timeframe.days * -0.5)));
      await prisma.metricSnapshot.create({
        data: {
          organizationId: organization.id,
          metricType: 'COMPLIANCE_SCORE',
          metricCategory: 'COMPLIANCE',
          value: complianceScore,
          metadata: {
            frameworks: 3,
            average: complianceScore,
            breakdown: [
              { framework: 'SOC 2', coverage: complianceScore + Math.random() * 10 - 5 },
              { framework: 'ISO 27001', coverage: complianceScore + Math.random() * 10 - 5 },
              { framework: 'PCI DSS', coverage: complianceScore + Math.random() * 10 - 5 }
            ]
          },
          capturedAt: captureDate,
          calculationMethod: 'weighted_average',
          dataSource: 'framework_metrics'
        }
      });

      // Evidence Health (fluctuating)
      const evidenceHealth = Math.max(70, Math.min(98, 85 + Math.random() * 20 - 10));
      const totalEvidence = 150 + Math.floor(Math.random() * 50);
      const expiring30Days = Math.floor(totalEvidence * (0.05 + Math.random() * 0.15));
      const expiring60Days = Math.floor(totalEvidence * (0.08 + Math.random() * 0.12));
      const expiring90Days = Math.floor(totalEvidence * (0.10 + Math.random() * 0.10));

      await prisma.metricSnapshot.create({
        data: {
          organizationId: organization.id,
          metricType: 'EVIDENCE_HEALTH',
          metricCategory: 'EVIDENCE',
          value: evidenceHealth,
          metadata: {
            totalEvidence,
            expiring30Days,
            expiring60Days,
            expiring90Days,
            reusePercentage: 65 + Math.random() * 20,
            approvalBacklog: Math.floor(Math.random() * 10)
          },
          capturedAt: captureDate,
          calculationMethod: 'health_score',
          dataSource: 'evidence_metrics'
        }
      });

      // Task Performance (generally good with some variation)
      const taskPerformance = Math.max(75, Math.min(95, 85 + Math.random() * 15 - 5));
      const totalTasks = 80 + Math.floor(Math.random() * 40);
      const completedTasks = Math.floor(totalTasks * (taskPerformance / 100));
      const overdueTasks = Math.floor(totalTasks * (0.05 + Math.random() * 0.10));

      await prisma.metricSnapshot.create({
        data: {
          organizationId: organization.id,
          metricType: 'TASK_PERFORMANCE',
          metricCategory: 'OPERATIONAL',
          value: taskPerformance,
          metadata: {
            totalTasks,
            completedTasks,
            overdueTasks,
            averageCompletionTime: 24 + Math.random() * 48,
            slaComplianceRate: taskPerformance + Math.random() * 10 - 5
          },
          capturedAt: captureDate,
          calculationMethod: 'completion_rate',
          dataSource: 'task_metrics'
        }
      });

      // Audit Readiness (improving over time)
      const auditReadiness = Math.max(60, Math.min(95, 70 + (timeframe.days * -0.3)));
      await prisma.metricSnapshot.create({
        data: {
          organizationId: organization.id,
          metricType: 'AUDIT_READINESS',
          metricCategory: 'AUDIT',
          value: auditReadiness,
          metadata: {
            activeAudits: 2 + Math.floor(Math.random() * 3),
            averageReadiness: auditReadiness,
            breakdown: [
              {
                auditId: 'audit-1',
                auditName: 'SOC 2 Type II',
                readiness: auditReadiness + Math.random() * 10 - 5,
                controls: 50 + Math.floor(Math.random() * 20),
                evidenceLinked: Math.floor((50 + Math.floor(Math.random() * 20)) * (auditReadiness / 100))
              },
              {
                auditId: 'audit-2',
                auditName: 'ISO 27001',
                readiness: auditReadiness + Math.random() * 10 - 5,
                controls: 40 + Math.floor(Math.random() * 15),
                evidenceLinked: Math.floor((40 + Math.floor(Math.random() * 15)) * (auditReadiness / 100))
              }
            ]
          },
          capturedAt: captureDate,
          calculationMethod: 'evidence_coverage',
          dataSource: 'audit_metrics'
        }
      });
    }

    console.log('✅ Created metric snapshots for all timeframes');

    // Create framework metrics
    console.log('🏗️ Creating framework metrics...');
    
    const frameworks = await prisma.framework.findMany({
      where: { organizationId: organization.id }
    });

    if (frameworks.length === 0) {
      console.log('⚠️ No frameworks found, creating sample frameworks...');
      
      const sampleFrameworks = [
        {
          name: 'SOC 2 Type II',
          description: 'Service Organization Control 2 Type II',
          type: 'SOC_2',
          version: '2017'
        },
        {
          name: 'ISO 27001',
          description: 'Information Security Management System',
          type: 'ISO_27001',
          version: '2013'
        },
        {
          name: 'PCI DSS',
          description: 'Payment Card Industry Data Security Standard',
          type: 'PCI_DSS',
          version: '4.0'
        }
      ];

      for (const frameworkData of sampleFrameworks) {
        await prisma.framework.create({
          data: {
            organizationId: organization.id,
            name: frameworkData.name,
            description: frameworkData.description,
            type: frameworkData.type,
            version: frameworkData.version,
            isActive: true
          }
        });
      }

      // Refresh frameworks list
      frameworks = await prisma.framework.findMany({
        where: { organizationId: organization.id }
      });
    }

    // Create framework metrics for each framework
    for (const framework of frameworks) {
      const coveragePercentage = 70 + Math.random() * 25;
      const totalControls = 50 + Math.floor(Math.random() * 30);
      const controlsMet = Math.floor(totalControls * (coveragePercentage / 100));
      const controlsPartial = Math.floor(totalControls * 0.15);
      const controlsGap = totalControls - controlsMet - controlsPartial;

      await prisma.frameworkMetric.create({
        data: {
          organizationId: organization.id,
          frameworkId: framework.id,
          coveragePercentage,
          controlsMet,
          controlsPartial,
          controlsGap,
          controlsNotApplicable: Math.floor(Math.random() * 5)
        }
      });
    }

    console.log('✅ Created framework metrics');

    // Create evidence metrics
    console.log('📄 Creating evidence metrics...');
    
    const totalEvidence = 150 + Math.floor(Math.random() * 50);
    const expiring30Days = Math.floor(totalEvidence * 0.12);
    const expiring60Days = Math.floor(totalEvidence * 0.08);
    const expiring90Days = Math.floor(totalEvidence * 0.10);

    await prisma.evidenceMetric.create({
      data: {
        organizationId: organization.id,
        totalEvidence,
        expiring30Days,
        expiring60Days,
        expiring90Days,
        reusePercentage: 65 + Math.random() * 20,
        approvalBacklog: Math.floor(Math.random() * 10),
        averageProcessingTime: 24 + Math.random() * 48,
        qualityScore: 80 + Math.random() * 15
      }
    });

    console.log('✅ Created evidence metrics');

    // Create task metrics
    console.log('✅ Creating task metrics...');
    
    const totalTasks = 80 + Math.floor(Math.random() * 40);
    const completedTasks = Math.floor(totalTasks * 0.85);
    const overdueTasks = Math.floor(totalTasks * 0.08);

    await prisma.taskMetric.create({
      data: {
        organizationId: organization.id,
        totalTasks,
        completedTasks,
        overdueTasks,
        averageCompletionTime: 24 + Math.random() * 48,
        slaComplianceRate: 85 + Math.random() * 10,
        productivityScore: 80 + Math.random() * 15
      }
    });

    console.log('✅ Created task metrics');

    // Create dashboard templates
    console.log('🎨 Creating dashboard templates...');
    
    const defaultTemplates = [
      {
        name: 'Executive Dashboard',
        description: 'High-level compliance overview for executives',
        role: 'EXECUTIVE',
        widgets: [
          {
            type: 'COMPLIANCE_SCORE',
            position: { x: 0, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showTrend: true, showBreakdown: true }
          },
          {
            type: 'FRAMEWORK_COVERAGE',
            position: { x: 6, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showProgress: true }
          },
          {
            type: 'EVIDENCE_EXPIRATION_MONITOR',
            position: { x: 0, y: 4, width: 4, height: 3 },
            size: 'MEDIUM',
            config: { alertThreshold: 30 }
          },
          {
            type: 'AUDIT_READINESS_SCORECARD',
            position: { x: 4, y: 4, width: 4, height: 3 },
            size: 'MEDIUM',
            config: { showDetails: false }
          },
          {
            type: 'FINDINGS_MANAGEMENT_ANALYTICS',
            position: { x: 8, y: 4, width: 4, height: 3 },
            size: 'MEDIUM',
            config: { showSeverity: true }
          }
        ],
        isDefault: true
      },
      {
        name: 'Manager Dashboard',
        description: 'Operational metrics and team performance',
        role: 'MANAGER',
        widgets: [
          {
            type: 'TASK_MANAGEMENT_DASHBOARD',
            position: { x: 0, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showAssignees: true, showSLA: true }
          },
          {
            type: 'WORKFLOW_EFFICIENCY_METRICS',
            position: { x: 6, y: 0, width: 6, height: 4 },
            size: 'LARGE',
            config: { showBottlenecks: true }
          },
          {
            type: 'EVIDENCE_APPROVAL_PIPELINE',
            position: { x: 0, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { showBacklog: true }
          },
          {
            type: 'CONTROL_STATUS_DISTRIBUTION',
            position: { x: 6, y: 4, width: 6, height: 3 },
            size: 'MEDIUM',
            config: { showDetails: true }
          }
        ],
        isDefault: true
      }
    ];

    for (const templateData of defaultTemplates) {
      await prisma.dashboardTemplate.create({
        data: {
          organizationId: organization.id,
          name: templateData.name,
          description: templateData.description,
          role: templateData.role,
          widgets: templateData.widgets,
          isPublic: false,
          isDefault: templateData.isDefault
        }
      });
    }

    console.log('✅ Created dashboard templates');

    // Create sample dashboard widgets
    console.log('🧩 Creating sample dashboard widgets...');
    
    const sampleWidgets = [
      {
        widgetType: 'COMPLIANCE_SCORE',
        position: { x: 0, y: 0, width: 6, height: 4 },
        size: 'LARGE',
        config: { showTrend: true, showBreakdown: true }
      },
      {
        widgetType: 'EVIDENCE_EXPIRATION_MONITOR',
        position: { x: 6, y: 0, width: 6, height: 4 },
        size: 'LARGE',
        config: { alertThreshold: 30, showTrend: true }
      },
      {
        widgetType: 'TASK_MANAGEMENT_DASHBOARD',
        position: { x: 0, y: 4, width: 6, height: 4 },
        size: 'LARGE',
        config: { showAssignees: true, showSLA: true }
      },
      {
        widgetType: 'AUDIT_READINESS_SCORECARD',
        position: { x: 6, y: 4, width: 6, height: 4 },
        size: 'LARGE',
        config: { showDetails: true, showEvidence: true }
      }
    ];

    for (const widgetData of sampleWidgets) {
      await prisma.dashboardWidget.create({
        data: {
          organizationId: organization.id,
          widgetType: widgetData.widgetType,
          position: widgetData.position,
          size: widgetData.size,
          config: widgetData.config,
          isActive: true
        }
      });
    }

    console.log('✅ Created sample dashboard widgets');

    // Create dashboard events
    console.log('📡 Creating dashboard events...');
    
    const eventTypes = [
      'COMPLIANCE_CHANGE',
      'EVIDENCE_EXPIRING',
      'TASK_OVERDUE',
      'AUDIT_STATUS_CHANGE',
      'CONTROL_STATUS_CHANGE',
      'FINDING_CREATED',
      'USER_ACTION',
      'DATA_UPDATE'
    ];

    for (let i = 0; i < 20; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const eventDate = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Last 7 days

      await prisma.dashboardEvent.create({
        data: {
          organizationId: organization.id,
          eventType,
          eventData: {
            timestamp: eventDate.toISOString(),
            source: 'system',
            metadata: {
              value: Math.random() * 100,
              threshold: 80,
              severity: Math.random() > 0.7 ? 'high' : 'medium'
            }
          },
          processed: Math.random() > 0.3
        }
      });
    }

    console.log('✅ Created dashboard events');

    // Create sample alerts
    console.log('🚨 Creating sample alerts...');
    
    const alertTypes = [
      'COMPLIANCE_THRESHOLD',
      'EVIDENCE_EXPIRING',
      'TASK_OVERDUE',
      'AUDIT_DEADLINE',
      'CONTROL_GAP'
    ];

    const severities = ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'];

    for (let i = 0; i < 10; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const alertDate = new Date(now.getTime() - (Math.random() * 3 * 24 * 60 * 60 * 1000)); // Last 3 days

      await prisma.dashboardAlert.create({
        data: {
          organizationId: organization.id,
          alertType,
          severity,
          title: `${alertType.replace('_', ' ')} Alert`,
          message: `This is a sample ${severity.toLowerCase()} alert for ${alertType.toLowerCase()}`,
          status: Math.random() > 0.7 ? 'ACKNOWLEDGED' : 'ACTIVE',
          threshold: 80 + Math.random() * 20,
          currentValue: 60 + Math.random() * 30,
          metadata: {
            source: 'automated',
            category: 'compliance',
            priority: severity.toLowerCase()
          },
          acknowledgedAt: Math.random() > 0.7 ? alertDate : null,
          resolvedAt: Math.random() > 0.8 ? alertDate : null
        }
      });
    }

    console.log('✅ Created sample alerts');

    console.log('🎉 Security Posture Dashboard data population completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Organization: ${organization.name}`);
    console.log(`   • Metric snapshots: ${timeframes.length * 4} (4 metrics × ${timeframes.length} timeframes)`);
    console.log(`   • Framework metrics: ${frameworks.length}`);
    console.log(`   • Evidence metrics: 1`);
    console.log(`   • Task metrics: 1`);
    console.log(`   • Dashboard templates: ${defaultTemplates.length}`);
    console.log(`   • Dashboard widgets: ${sampleWidgets.length}`);
    console.log(`   • Dashboard events: 20`);
    console.log(`   • Dashboard alerts: 10`);
    console.log('');
    console.log('🚀 You can now access the Security Posture Dashboard at:');
    console.log('   /dashboard/security-posture');
    console.log('   /dashboard/security-posture/analytics');

  } catch (error) {
    console.error('❌ Error populating dashboard data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population script
populateDashboardData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
