'use client';

import { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, Shield, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface ExecutiveDashboardData {
  policyCompliance: {
    totalPolicies: number;
    publishedPolicies: number;
    totalAcknowledgments: number;
    acknowledgedPolicies: number;
    overdueAcknowledgments: number;
    complianceRate: number;
  };
  riskExposure: {
    totalRisks: number;
    riskDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    statusDistribution: {
      identified: number;
      assessed: number;
      treatmentPlanned: number;
      treatmentImplemented: number;
      closed: number;
    };
  };
  complianceStatus: {
    totalControls: number;
    metControls: number;
    partialControls: number;
    gapControls: number;
    controlComplianceRate: number;
    totalEvidence: number;
    approvedEvidence: number;
    expiringEvidence: number;
    evidenceApprovalRate: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
  };
  recentAlerts: Array<{
    id: string;
    alertType: string;
    title: string;
    severity: string;
    status: string;
    triggeredAt: string;
  }>;
}

interface RiskHeatmapData {
  category: string;
  subcategory?: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  businessUnits: string[];
}

interface ComplianceTrend {
  date: string;
  complianceRate: number;
  total: number;
  acknowledged: number;
}

export default function GovernancePage() {
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [riskHeatmapData, setRiskHeatmapData] = useState<RiskHeatmapData[]>([]);
  const [complianceTrends, setComplianceTrends] = useState<ComplianceTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRiskHeatmapData();
    fetchComplianceTrends();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/governance/dashboard?organizationId=org-123&dashboardType=EXECUTIVE');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskHeatmapData = async () => {
    try {
      const response = await fetch('/api/admin/governance/risk-heatmap?organizationId=org-123');
      const data = await response.json();
      setRiskHeatmapData(data);
    } catch (error) {
      console.error('Error fetching risk heatmap data:', error);
    }
  };

  const fetchComplianceTrends = async () => {
    try {
      const response = await fetch('/api/admin/governance/compliance-trends?organizationId=org-123&days=30');
      const data = await response.json();
      setComplianceTrends(data);
    } catch (error) {
      console.error('Error fetching compliance trends:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      LOW: { color: 'bg-green-100 text-green-800', label: 'Low' },
      MEDIUM: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      HIGH: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      CRITICAL: { color: 'bg-red-100 text-red-800', label: 'Critical' }
    };
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.MEDIUM;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-red-100 text-red-800', label: 'Active' },
      ACKNOWLEDGED: { color: 'bg-yellow-100 text-yellow-800', label: 'Acknowledged' },
      RESOLVED: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
      DISMISSED: { color: 'bg-gray-100 text-gray-800', label: 'Dismissed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading governance dashboard...</p>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Governance Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Executive overview of policy compliance, risk exposure, and organizational governance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('/dashboard/governance/alerts', '_blank')}>
              <AlertTriangle className="h-4 w-4" />
              View All Alerts
            </Button>
            <Button variant="outline" onClick={() => window.open('/dashboard/governance/reports', '_blank')}>
              <BarChart3 className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Trends</TabsTrigger>
            <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Policy Compliance</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData.policyCompliance.complianceRate}%</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Critical Risks</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData.riskExposure.riskDistribution.critical}</p>
                    </div>
                    <Shield className="h-8 w-8 text-red-600" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Control Compliance</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData.complianceStatus.controlComplianceRate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Task Completion</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData.complianceStatus.taskCompletionRate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </Card>
              </div>
            )}

            {/* Policy Compliance Overview */}
            {dashboardData && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Compliance Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData.policyCompliance.totalPolicies}</div>
                    <div className="text-sm text-gray-600">Total Policies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData.policyCompliance.publishedPolicies}</div>
                    <div className="text-sm text-gray-600">Published</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData.policyCompliance.acknowledgedPolicies}</div>
                    <div className="text-sm text-gray-600">Acknowledged</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData.policyCompliance.overdueAcknowledgments}</div>
                    <div className="text-sm text-gray-600">Overdue</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Risk Exposure Overview */}
            {dashboardData && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Exposure Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData.riskExposure.totalRisks}</div>
                    <div className="text-sm text-gray-600">Total Risks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{dashboardData.riskExposure.riskDistribution.critical}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{dashboardData.riskExposure.riskDistribution.high}</div>
                    <div className="text-sm text-gray-600">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{dashboardData.riskExposure.riskDistribution.medium}</div>
                    <div className="text-sm text-gray-600">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dashboardData.riskExposure.riskDistribution.low}</div>
                    <div className="text-sm text-gray-600">Low</div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            {/* Risk Heatmap */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution by Category</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Critical</TableHead>
                      <TableHead>High</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead>Low</TableHead>
                      <TableHead>Business Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskHeatmapData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell>{item.subcategory || '-'}</TableCell>
                        <TableCell>{item.total}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">{item.critical}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800">{item.high}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">{item.medium}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{item.low}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.businessUnits.map((unit, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{unit}</Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            {/* Compliance Trends */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Compliance Trends (Last 30 Days)</h3>
              <div className="space-y-4">
                {complianceTrends.slice(-7).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{trend.date}</div>
                      <div className="text-sm text-gray-600">{trend.total} total acknowledgments</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{trend.complianceRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">{trend.acknowledged} acknowledged</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Recent Alerts */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-4">
                {dashboardData?.recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-900">{alert.title}</div>
                        <div className="text-sm text-gray-600">{alert.alertType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      {getStatusBadge(alert.status)}
                      <div className="text-sm text-gray-500">
                        {new Date(alert.triggeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformAdminLayout>
  );
}
