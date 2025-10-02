'use client';

import React, { useState, useEffect } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, 
  Shield, 
  MapPin, 
  CheckCircle,
  Activity,
  Database,
  Lock } from 'lucide-react';

interface DataRegion {
  id: string;
  regionCode: string;
  regionName: string;
  jurisdiction: string;
  dataCenterLocations: string[];
  regulatoryRequirements: Record<string, unknown>;
  activeFlag: boolean;
}

interface DataResidencyConfig {
  configured: boolean;
  primaryRegion: {
    name: string;
    jurisdiction: string;
    dataCenters: string[];
  };
  backupRegions: Array<{
    name: string;
    jurisdiction: string;
    dataCenters: string[];
  }>;
  residencyRequirements: Record<string, unknown>;
  complianceCertifications: string[];
  recentTransfers: Array<{
    sourceRegion: string;
    destinationRegion: string;
    dataType: string;
    transferredAt: string;
    status: string;
  }>;
}

export default function DataResidencyPage() {
  const [regions, setRegions] = useState<DataRegion[]>([]);
  const [residencyConfig, setResidencyConfig] = useState<DataResidencyConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataResidency();
  }, []);

  const fetchDataResidency = async () => {
    try {
      setLoading(true);
      
      // Fetch available regions
      const regionsResponse = await fetch('/api/enterprise/data-residency?action=regions');
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json();
        setRegions(regionsData);
      }

      // Fetch residency configuration
      const configResponse = await fetch('/api/enterprise/data-residency?organizationId=default-org');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setResidencyConfig(configData);
      }
    } catch (error) {
      console.error('Failed to fetch data residency:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceBadgeColor = (certification: string) => {
    switch (certification) {
      case 'SOC2': return 'bg-blue-100 text-blue-800';
      case 'ISO27001': return 'bg-green-100 text-green-800';
      case 'GDPR': return 'bg-purple-100 text-purple-800';
      case 'HIPAA': return 'bg-red-100 text-red-800';
      case 'SOX': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-spin" />
              <span>Loading data residency configuration...</span>
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
            <h1 className="text-3xl font-bold">Data Residency & Sovereignty</h1>
            <p className="text-gray-600 mt-2">
              {/* Manage global data residency and compliance requirements */}
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Configure Residency
          </Button>
        </div>

        {/* Current Configuration */}
        {residencyConfig?.configured ? (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold">Current Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Primary Region</h3>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{residencyConfig.primaryRegion.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {residencyConfig.primaryRegion.jurisdiction}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Data Centers: {residencyConfig.primaryRegion.dataCenters.join(', ')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Backup Regions</h3>
                <div className="space-y-2">
                  {residencyConfig.backupRegions.map((region, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{region.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{region.jurisdiction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Compliance Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {residencyConfig.complianceCertifications.map((cert, index) => (
                  <Badge key={index} className={getComplianceBadgeColor(cert)}>
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Residency Configuration</h3>
              <p className="text-gray-600 mb-4">
                Configure data residency settings to ensure compliance with regional requirements
              </p>
              <Button className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configure Data Residency
              </Button>
            </div>
          </Card>
        )}

        {/* Available Regions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Available Data Regions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((region) => (
              <div key={region.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold">{region.regionName}</h3>
                  {region.activeFlag && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{region.jurisdiction}</p>
                <p className="text-xs text-gray-500 mb-3">
                  Data Centers: {region.dataCenterLocations.join(', ')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(region.regulatoryRequirements || {}).map((req) => (
                    <Badge key={req} variant="secondary" className="text-xs">
                      {req.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Data Transfers */}
        {residencyConfig?.recentTransfers && residencyConfig.recentTransfers.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Data Transfers</h2>
            <div className="space-y-3">
              {residencyConfig.recentTransfers.map((transfer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-sm font-medium">
                        {transfer.sourceRegion} → {transfer.destinationRegion}
                      </span>
                      <p className="text-xs text-gray-600">{transfer.dataType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={
                        transfer.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {transfer.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transfer.transferredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Compliance Requirements */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Compliance Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Data Protection
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  GDPR compliance for EU data
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  SOC 2 Type II certification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  ISO 27001 security standards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  HIPAA compliance for healthcare
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                Data Sovereignty
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Regional data isolation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Cross-border transfer controls
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Local processing requirements
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Data residency certification
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
