'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Grid3X3, 
  CheckCircle, 
  AlertTriangle,
  Minus,
  BarChart3,
  ExternalLink,
  Eye,
  EyeOff } from 'lucide-react';

interface ComplianceHeatmapWidgetProps {
  organizationId: string;
  config?: {
    showControls?: boolean;
    showFamilies?: boolean;
    granularity?: 'framework' | 'category' | 'control';
    showDetails?: boolean;
  };
}

interface HeatmapData {
  id: string;
  name: string;
  type: 'framework' | 'category' | 'control';
  complianceScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  children?: HeatmapData[];
}

export function ComplianceHeatmapWidget({ organizationId, config = {} }: ComplianceHeatmapWidgetProps) {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(config.showDetails || false);
  const [selectedItem, setSelectedItem] = useState<HeatmapData | null>(null);

  const {
    granularity = 'category'
  } = config;

  useEffect(() => {
    fetchHeatmapData();
  }, [organizationId, granularity]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockData: HeatmapData[] = [
        {
          id: 'soc2',
          name: 'SOC 2',
          type: 'framework',
          complianceScore: 85,
          status: 'good',
          children: [
            {
              id: 'cc1',
              name: 'CC1 - Control Environment',
              type: 'category',
              complianceScore: 90,
              status: 'excellent',
              children: [
                { id: 'cc1.1', name: 'CC1.1 - Control Environment', type: 'control', complianceScore: 95, status: 'excellent' },
                { id: 'cc1.2', name: 'CC1.2 - Commitment to Competence', type: 'control', complianceScore: 85, status: 'good' },
                { id: 'cc1.3', name: 'CC1.3 - Management Participation', type: 'control', complianceScore: 90, status: 'excellent' }
              ]
            },
            {
              id: 'cc2',
              name: 'CC2 - Communication and Information',
              type: 'category',
              complianceScore: 80,
              status: 'good',
              children: [
                { id: 'cc2.1', name: 'CC2.1 - Communication', type: 'control', complianceScore: 85, status: 'good' },
                { id: 'cc2.2', name: 'CC2.2 - Information System', type: 'control', complianceScore: 75, status: 'warning' }
              ]
            },
            {
              id: 'cc3',
              name: 'CC3 - Risk Assessment',
              type: 'category',
              complianceScore: 70,
              status: 'warning',
              children: [
                { id: 'cc3.1', name: 'CC3.1 - Risk Identification', type: 'control', complianceScore: 65, status: 'warning' },
                { id: 'cc3.2', name: 'CC3.2 - Risk Analysis', type: 'control', complianceScore: 75, status: 'warning' }
              ]
            }
          ]
        },
        {
          id: 'iso27001',
          name: 'ISO 27001',
          type: 'framework',
          complianceScore: 78,
          status: 'warning',
          children: [
            {
              id: 'a5',
              name: 'A.5 - Information Security Policies',
              type: 'category',
              complianceScore: 85,
              status: 'good',
              children: [
                { id: 'a5.1', name: 'A.5.1 - Management Direction', type: 'control', complianceScore: 90, status: 'excellent' },
                { id: 'a5.2', name: 'A.5.2 - Information Security Policies', type: 'control', complianceScore: 80, status: 'good' }
              ]
            },
            {
              id: 'a6',
              name: 'A.6 - Organization of Information Security',
              type: 'category',
              complianceScore: 70,
              status: 'warning',
              children: [
                { id: 'a6.1', name: 'A.6.1 - Internal Organization', type: 'control', complianceScore: 65, status: 'warning' },
                { id: 'a6.2', name: 'A.6.2 - Mobile Devices', type: 'control', complianceScore: 75, status: 'warning' }
              ]
            }
          ]
        },
        {
          id: 'pci',
          name: 'PCI DSS',
          type: 'framework',
          complianceScore: 92,
          status: 'excellent',
          children: [
            {
              id: 'req1',
              name: 'Req 1 - Firewall Configuration',
              type: 'category',
              complianceScore: 95,
              status: 'excellent',
              children: [
                { id: 'req1.1', name: 'Req 1.1 - Firewall Configuration', type: 'control', complianceScore: 100, status: 'excellent' },
                { id: 'req1.2', name: 'Req 1.2 - Firewall Configuration', type: 'control', complianceScore: 90, status: 'excellent' }
              ]
            },
            {
              id: 'req2',
              name: 'Req 2 - Default Passwords',
              type: 'category',
              complianceScore: 88,
              status: 'good',
              children: [
                { id: 'req2.1', name: 'Req 2.1 - Default Passwords', type: 'control', complianceScore: 85, status: 'good' },
                { id: 'req2.2', name: 'Req 2.2 - Default Passwords', type: 'control', complianceScore: 90, status: 'excellent' }
              ]
            }
          ]
        }
      ];
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-800';
      case 'good': return 'text-green-800';
      case 'warning': return 'text-yellow-800';
      case 'critical': return 'text-red-800';
      default: return 'text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getIntensity = (score: number) => {
    if (score >= 90) return 1.0;
    if (score >= 80) return 0.8;
    if (score >= 70) return 0.6;
    if (score >= 60) return 0.4;
    return 0.2;
  };

  const renderHeatmapGrid = (items: HeatmapData[], level: number = 0) => {
    const maxItemsPerRow = level === 0 ? 3 : level === 1 ? 4 : 6;
    const rows = [];
    
    for (let i = 0; i < items.length; i += maxItemsPerRow) {
      const rowItems = items.slice(i, i + maxItemsPerRow);
      rows.push(
        <div key={i} className="flex space-x-2 mb-2">
          {rowItems.map((item) => (
            <div
              key={item.id}
              className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                backgroundColor: `rgba(59, 130, 246, ${getIntensity(item.complianceScore) * 0.1})`,
                borderColor: getStatusColor(item.status).replace('bg-', 'border-')
              }}
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(item.status)}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${getStatusTextColor(item.status)}`}>
                  {item.complianceScore}%
                </span>
              </div>
              
              {showDetails && (
                <div className="text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>{item.type}</span>
                    <Badge className={`text-xs ${getStatusColor(item.status)} ${getStatusTextColor(item.status)}`}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return rows;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Grid3X3 className="h-8 w-8 mx-auto mb-2" />
          <p>No compliance heatmap data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Grid3X3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Compliance Heatmap</h3>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={granularity}
            onChange={() => {/* Handle granularity change */}}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="framework">Framework</option>
            <option value="category">Category</option>
            <option value="control">Control</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="mb-6">
        {renderHeatmapGrid(data)}
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{selectedItem.name}</h4>
            <Badge className={`${getStatusColor(selectedItem.status)} ${getStatusTextColor(selectedItem.status)}`}>
              {selectedItem.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Compliance Score:</span>
              <span className="font-semibold ml-2">{selectedItem.complianceScore}%</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="font-semibold ml-2">{selectedItem.type}</span>
            </div>
          </div>
          {selectedItem.children && selectedItem.children.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">Sub-items:</div>
              <div className="space-y-1">
                {selectedItem.children.slice(0, 3).map((child) => (
                  <div key={child.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{child.name}</span>
                    <span className={`font-semibold ${getStatusTextColor(child.status)}`}>
                      {child.complianceScore}%
                    </span>
                  </div>
                ))}
                {selectedItem.children.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{selectedItem.children.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mb-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Compliance Level:</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Excellent (90-100%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>Good (80-89%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Warning (70-79%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Critical (&lt;70%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {data.filter(d => d.status === 'excellent').length}
            </div>
            <div className="text-sm text-gray-600">Excellent</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {data.filter(d => d.status === 'good').length}
            </div>
            <div className="text-sm text-gray-600">Good</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {data.filter(d => d.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Warning</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {data.filter(d => d.status === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
