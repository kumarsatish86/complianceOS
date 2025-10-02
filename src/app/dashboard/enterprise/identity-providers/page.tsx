'use client';

import React, { useState, useEffect } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Plus, 
  Settings, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

interface IdentityProvider {
  id: string;
  providerType: string;
  providerName: string;
  status: string;
  createdAt: string;
  samlSessions: Record<string, unknown>[];
  scimEndpoints: Record<string, unknown>[];
}

export default function IdentityProvidersPage() {
  const [providers, setProviders] = useState<IdentityProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdentityProviders();
  }, []);

  const fetchIdentityProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/enterprise/identity-providers?organizationId=default-org');
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Failed to fetch identity providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'ERROR': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-spin" />
              <span>Loading identity providers...</span>
            </div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Identity Providers</h1>
            <p className="text-gray-600 mt-2">
              {/* Manage SAML SSO and authentication providers */}
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Providers</p>
                <p className="text-2xl font-bold">{providers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Providers</p>
                <p className="text-2xl font-bold">
                  {providers.filter(p => p.status === 'ACTIVE').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">
                  {providers.reduce((sum, p) => sum + p.samlSessions.length, 0)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SCIM Endpoints</p>
                <p className="text-2xl font-bold">
                  {providers.reduce((sum, p) => sum + p.scimEndpoints.length, 0)}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Identity Providers List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Configured Providers</h2>
            <Badge variant="secondary">{providers.length} providers</Badge>
          </div>

          {providers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Identity Providers</h3>
              <p className="text-gray-600 mb-4">
                {/* Get started by adding your first SAML SSO provider */}
              </p>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Provider
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(provider.status)}
                        <div>
                          <h3 className="font-semibold">{provider.providerName}</h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {provider.providerType.toLowerCase().replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Active Sessions:</span>
                      <span className="ml-2">{provider.samlSessions.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">SCIM Endpoints:</span>
                      <span className="ml-2">{provider.scimEndpoints.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Provider Types */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Supported Provider Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Okta</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enterprise identity management with SAML SSO and SCIM provisioning
              </p>
              <Badge variant="secondary">SAML + SCIM</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Azure Active Directory</h3>
              <p className="text-sm text-gray-600 mb-3">
                Microsoft&apos;s cloud-based identity and access management service
              </p>
              <Badge variant="secondary">SAML + SCIM</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Google Workspace</h3>
              <p className="text-sm text-gray-600 mb-3">
                Google&apos;s suite of productivity and collaboration tools
              </p>
              <Badge variant="secondary">SAML + SCIM</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Ping Identity</h3>
              <p className="text-sm text-gray-600 mb-3">
                Intelligent identity platform for enterprise security
              </p>
              <Badge variant="secondary">SAML + SCIM</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Active Directory FS</h3>
              <p className="text-sm text-gray-600 mb-3">
                Microsoft&apos;s federation service for enterprise environments
              </p>
              <Badge variant="secondary">SAML</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Custom SAML</h3>
              <p className="text-sm text-gray-600 mb-3">
                Custom SAML provider with metadata configuration
              </p>
              <Badge variant="secondary">SAML</Badge>
            </div>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
