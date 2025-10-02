import React from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, 
  Globe, 
  Users, 
  Settings, 
  Activity,
  Lock,
  Database,
  CheckCircle } from 'lucide-react';

export default function EnterpriseManagementPage() {
  return (
    <PlatformAdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Enterprise Management</h1>
            <p className="text-gray-600 mt-2">
              Advanced enterprise features for large-scale compliance management
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Enterprise Edition
          </Badge>
        </div>

        {/* Enterprise Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Identity Providers</p>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-green-600 mt-1">✓ Active</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SCIM Endpoints</p>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-green-600 mt-1">✓ Synced</p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Regions</p>
                <p className="text-2xl font-bold">6</p>
                <p className="text-xs text-blue-600 mt-1">Global</p>
              </div>
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-green-600 mt-1">Excellent</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Enterprise Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Identity & Access Management */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Identity & Access Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Enterprise-grade authentication and user provisioning with SAML SSO and SCIM integration.
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">SAML 2.0 Single Sign-On</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">SCIM 2.0 User Provisioning</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Multi-Provider Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Just-In-Time Provisioning</span>
              </div>
            </div>
            <Button className="w-full">
              {/* Manage Identity Providers */}
            </Button>
          </Card>

          {/* Data Residency & Sovereignty */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold">Data Residency & Sovereignty</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Global data residency controls with regional deployment and compliance validation.
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Multi-Region Deployment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Data Sovereignty Controls</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Cross-Border Transfer Management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Compliance Certification</span>
              </div>
            </div>
            <Button className="w-full">
              Configure Data Residency
            </Button>
          </Card>

          {/* Advanced Security Framework */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold">Advanced Security Framework</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Enterprise-grade encryption, threat protection, and security monitoring.
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">HSM-Backed Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Bring Your Own Key (BYOK)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Threat Detection & Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Security Policy Enforcement</span>
              </div>
            </div>
            <Button className="w-full">
              {/* Manage Security Settings */}
            </Button>
          </Card>

          {/* Enterprise Operations */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold">Enterprise Operations</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Scalable infrastructure, monitoring, and operational excellence.
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">High Availability Architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Performance Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Automated Scaling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Disaster Recovery</span>
              </div>
            </div>
            <Button className="w-full">
              View Operations Dashboard
            </Button>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Recent Enterprise Activity</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">SAML SSO authentication successful</span>
              </div>
              <span className="text-xs text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-sm">SCIM user synchronization completed</span>
              </div>
              <span className="text-xs text-gray-500">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Encryption key rotation scheduled</span>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Data residency compliance validated</span>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
          </div>
        </Card>

        {/* Compliance Status */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Enterprise Compliance Status</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">SOC 2 Type II</h3>
              <p className="text-sm text-green-600">Compliant</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">ISO 27001</h3>
              <p className="text-sm text-green-600">Certified</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">GDPR</h3>
              <p className="text-sm text-green-600">Compliant</p>
            </div>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
