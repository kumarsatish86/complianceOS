'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, 
  Users, 
  Shield, 
  Eye, 
  BarChart3,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  Upload,
  Plus,
  ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface DashboardStats {
  totalAssets: number;
  totalVendors: number;
  totalLicenses: number;
  totalSystems: number;
  warrantyExpiring: number;
  accessReviewsDue: number;
  complianceScore: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export default function AssetManagementDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setTimeout(() => {
      setStats({
        totalAssets: 1247,
        totalVendors: 45,
        totalLicenses: 156,
        totalSystems: 28,
        warrantyExpiring: 23,
        accessReviewsDue: 12,
        complianceScore: 85,
        recentActivity: [
          {
            id: '1',
            type: 'asset',
            description: 'New laptop assigned to John Doe',
            timestamp: '2 hours ago',
            user: 'Sarah Wilson'
          },
          {
            id: '2',
            type: 'license',
            description: 'Microsoft Office license renewed',
            timestamp: '4 hours ago',
            user: 'Mike Johnson'
          },
          {
            id: '3',
            type: 'access',
            description: 'Access review completed for Salesforce',
            timestamp: '1 day ago',
            user: 'Lisa Chen'
          },
          {
            id: '4',
            type: 'vendor',
            description: 'New vendor Dell Technologies added',
            timestamp: '2 days ago',
            user: 'Tom Brown'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const quickActions = [
    {
      title: 'Add Asset',
      description: 'Register a new IT asset',
      icon: Plus,
      href: '/dashboard/assets',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Import Data',
      description: 'Bulk import assets and licenses',
      icon: Upload,
      href: '/dashboard/assets',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Generate Report',
      description: 'Create compliance reports',
      icon: Download,
      href: '/dashboard/reports',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Review Access',
      description: 'Conduct access reviews',
      icon: Eye,
      href: '/dashboard/access',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const complianceFrameworks = [
    {
      name: 'ISO 27001',
      status: 'Compliant',
      score: 92,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'SOC 2',
      status: 'In Progress',
      score: 78,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      name: 'PCI DSS',
      status: 'Compliant',
      score: 88,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'GDPR',
      status: 'Compliant',
      score: 95,
      color: 'text-green-600 bg-green-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground">
            Complete IT asset and access management for compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty Expiring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.warrantyExpiring}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLicenses}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalVendors} vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Reviews Due</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.accessReviewsDue}</div>
            <p className="text-xs text-muted-foreground">
              Quarterly reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Button variant="outline" className="w-full justify-start h-auto p-4">
                      <IconComponent className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm text-muted-foreground">{action.description}</div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Module Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Module Overview</CardTitle>
              <CardDescription>
                Navigate to different asset management modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/assets">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Building className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">Asset Inventory</h3>
                          <p className="text-sm text-muted-foreground">
                            {/* Manage IT assets and lifecycle */}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/vendors">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="font-semibold">Vendor Management</h3>
                          <p className="text-sm text-muted-foreground">
                            Vendor relationships and contracts
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/software">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-purple-600" />
                        <div>
                          <h3 className="font-semibold">Software & Licenses</h3>
                          <p className="text-sm text-muted-foreground">
                            Software catalog and compliance
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/access">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Eye className="h-8 w-8 text-orange-600" />
                        <div>
                          <h3 className="font-semibold">Access Registry</h3>
                          <p className="text-sm text-muted-foreground">
                            User access controls and reviews
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Compliance Status
          </CardTitle>
          <CardDescription>
            Current compliance scores across different frameworks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {complianceFrameworks.map((framework) => (
              <div key={framework.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{framework.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${framework.color}`}>
                    {framework.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${framework.score}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{framework.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest changes and updates in asset management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp} by {activity.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </PlatformAdminLayout>
  );
}
