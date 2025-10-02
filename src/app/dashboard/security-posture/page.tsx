'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { } from '@/components/ui/badge';
import { Plus, 
  Settings, 
  RefreshCw, 
  Download, 
  Share2,
  Layout } from 'lucide-react';
import { ComplianceScoreWidget } from '@/components/dashboard/widgets/compliance-score-widget';
import { EvidenceExpirationWidget } from '@/components/dashboard/widgets/evidence-expiration-widget';
import { TaskManagementWidget } from '@/components/dashboard/widgets/task-management-widget';
import { FrameworkCoverageWidget } from '@/components/dashboard/widgets/framework-coverage-widget';
import { ControlStatusDistributionWidget } from '@/components/dashboard/widgets/control-status-distribution-widget';
import { ComplianceHeatmapWidget } from '@/components/dashboard/widgets/compliance-heatmap-widget';
import { EvidenceUtilizationAnalyticsWidget } from '@/components/dashboard/widgets/evidence-utilization-analytics-widget';
import { EvidenceApprovalPipelineWidget } from '@/components/dashboard/widgets/evidence-approval-pipeline-widget';
import { TrendAnalysisWidget } from '@/components/dashboard/widgets/trend-analysis-widget';
import { ExecutiveSummaryWidget } from '@/components/dashboard/widgets/executive-summary-widget';
import { WorkflowEfficiencyWidget } from '@/components/dashboard/widgets/workflow-efficiency-widget';
import { AuditReadinessScorecardWidget } from '@/components/dashboard/widgets/audit-readiness-scorecard-widget';
import { FindingsManagementAnalyticsWidget } from '@/components/dashboard/widgets/findings-management-analytics-widget';
import { AuditHistoryTimelineWidget } from '@/components/dashboard/widgets/audit-history-timeline-widget';
import { RiskPostureOverviewWidget } from '@/components/dashboard/widgets/risk-posture-overview-widget';
import { PolicyComplianceTrackingWidget } from '@/components/dashboard/widgets/policy-compliance-tracking-widget';
import { ComparativeAnalyticsWidget } from '@/components/dashboard/widgets/comparative-analytics-widget';

interface DashboardWidget {
  id: string;
  widgetType: string;
  position: { x: number; y: number; width: number; height: number };
  size: string;
  config: Record<string, unknown>;
  isActive: boolean;
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  widgets: Record<string, unknown>[];
  isDefault: boolean;
}

export default function SecurityPostureDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch widgets and templates in parallel
      const [widgetsResponse, templatesResponse] = await Promise.all([
        fetch(`/api/admin/dashboard/widgets?organizationId=${organizationId}`),
        fetch(`/api/admin/dashboard/templates?organizationId=${organizationId}`)
      ]);

      if (widgetsResponse.ok) {
        const widgetsData = await widgetsResponse.json();
        setWidgets(widgetsData.widgets || []);
      }

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    // Get organization ID from session or context
    setOrganizationId('org-123'); // This should come from auth context
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTemplateChange = async (templateId: string) => {
    if (!templateId) return;

    try {
      setSelectedTemplate(templateId);
      
      // Apply template widgets
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // Create widgets from template
        const widgetPromises = template.widgets.map((widgetConfig: Record<string, unknown>) =>
          fetch('/api/admin/dashboard/widgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId,
              widgetType: widgetConfig.type,
              position: widgetConfig.position,
              size: widgetConfig.size,
              config: widgetConfig.config
            })
          })
        );

        await Promise.all(widgetPromises);
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExport = () => {
    // TODO: Implement dashboard export
    console.log('Export dashboard');
  };

  const handleShare = () => {
    // TODO: Implement dashboard sharing
    console.log('Share dashboard');
  };

  const renderWidget = (widget: DashboardWidget) => {
    const commonProps = {
      organizationId,
      config: widget.config
    };

    switch (widget.widgetType) {
      case 'COMPLIANCE_SCORE':
        return <ComplianceScoreWidget key={widget.id} {...commonProps} />;
      case 'EVIDENCE_EXPIRATION_MONITOR':
        return <EvidenceExpirationWidget key={widget.id} {...commonProps} />;
      case 'TASK_MANAGEMENT_DASHBOARD':
        return <TaskManagementWidget key={widget.id} {...commonProps} />;
      case 'FRAMEWORK_COVERAGE':
        return <FrameworkCoverageWidget key={widget.id} {...commonProps} />;
      case 'CONTROL_STATUS_DISTRIBUTION':
        return <ControlStatusDistributionWidget key={widget.id} {...commonProps} />;
      case 'COMPLIANCE_HEATMAP':
        return <ComplianceHeatmapWidget key={widget.id} {...commonProps} />;
      case 'EVIDENCE_UTILIZATION_ANALYTICS':
        return <EvidenceUtilizationAnalyticsWidget key={widget.id} {...commonProps} />;
      case 'EVIDENCE_APPROVAL_PIPELINE':
        return <EvidenceApprovalPipelineWidget key={widget.id} {...commonProps} />;
      case 'TREND_ANALYSIS':
        return <TrendAnalysisWidget key={widget.id} {...commonProps} />;
      case 'EXECUTIVE_SUMMARY':
        return <ExecutiveSummaryWidget key={widget.id} {...commonProps} />;
      case 'WORKFLOW_EFFICIENCY_METRICS':
        return <WorkflowEfficiencyWidget key={widget.id} {...commonProps} />;
      case 'AUDIT_READINESS_SCORECARD':
        return <AuditReadinessScorecardWidget key={widget.id} {...commonProps} />;
      case 'FINDINGS_MANAGEMENT_ANALYTICS':
        return <FindingsManagementAnalyticsWidget key={widget.id} {...commonProps} />;
      case 'AUDIT_HISTORY_TIMELINE':
        return <AuditHistoryTimelineWidget key={widget.id} {...commonProps} />;
      case 'RISK_POSTURE_OVERVIEW':
        return <RiskPostureOverviewWidget key={widget.id} {...commonProps} />;
      case 'POLICY_COMPLIANCE_TRACKING':
        return <PolicyComplianceTrackingWidget key={widget.id} {...commonProps} />;
      case 'COMPARATIVE_ANALYTICS':
        return <ComparativeAnalyticsWidget key={widget.id} {...commonProps} />;
      default:
        return (
          <Card key={widget.id} className="p-6">
            <div className="text-center text-gray-500">
              <p>Widget type: {widget.widgetType}</p>
              <p className="text-sm">Not implemented yet</p>
            </div>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Posture Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Real-time compliance monitoring and security insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant={editing ? "default" : "outline"} 
              onClick={() => setEditing(!editing)}
            >
              <Layout className="h-4 w-4 mr-2" />
              {editing ? 'Done' : 'Customize'}
            </Button>
          </div>
        </div>

        {/* Template Selector */}
        {editing && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Dashboard Template:
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} {template.isDefault && '(Default)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  {/* Settings */}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {widgets.length > 0 ? (
            widgets.map((widget) => (
              <div
                key={widget.id}
                className={`${
                  widget.size === 'SMALL' ? 'col-span-1' :
                  widget.size === 'MEDIUM' ? 'col-span-2' :
                  widget.size === 'LARGE' ? 'col-span-3' :
                  'col-span-4'
                }`}
              >
                {renderWidget(widget)}
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <Layout className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No widgets configured
                </h3>
                <p className="text-gray-600 mb-6">
                  {/* Get started by selecting a dashboard template or adding individual widgets. */}
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => setEditing(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widget
                  </Button>
                  <Button variant="outline">
                    <Layout className="h-4 w-4 mr-2" />
                    {/* Choose Template */}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {widgets.length > 0 && (
          <div className="mt-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dashboard Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{widgets.length}</div>
                  <div className="text-sm text-gray-600">Active Widgets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {widgets.filter(w => w.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">Enabled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{templates.length}</div>
                  <div className="text-sm text-gray-600">Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PlatformAdminLayout>
  );
}
