'use client';

import { useState, useEffect } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Calendar,
  Users } from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  source: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    controls: number;
  };
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/frameworks');
      if (response.ok) {
        const data = await response.json();
        setFrameworks(data.frameworks || []);
      }
    } catch (error) {
      console.error('Error fetching frameworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFrameworks = frameworks.filter(framework => {
    const matchesSearch = framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         framework.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || framework.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && framework.isActive) ||
                         (statusFilter === 'inactive' && !framework.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'SOC2_TYPE_II': return 'bg-blue-100 text-blue-800';
      case 'ISO27001': return 'bg-green-100 text-green-800';
      case 'PCI_DSS': return 'bg-purple-100 text-purple-800';
      case 'COMMON_CONTROLS': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'SOC2_TYPE_II': return 'SOC 2 Type II';
      case 'ISO27001': return 'ISO 27001';
      case 'PCI_DSS': return 'PCI DSS';
      case 'COMMON_CONTROLS': return 'Common Controls';
      default: return type;
    }
  };

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control Frameworks</h1>
            <p className="text-gray-600">Manage compliance frameworks and their controls</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Framework
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Frameworks</p>
                <p className="text-2xl font-bold text-gray-900">{frameworks.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Frameworks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {frameworks.filter(f => f.isActive).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Controls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {frameworks.reduce((sum, f) => sum + f._count.controls, 0)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Latest Update</p>
                <p className="text-sm font-medium text-gray-900">
                  {frameworks.length > 0 ? 
                    new Date(frameworks[0].createdAt).toLocaleDateString() : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search frameworks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SOC2_TYPE_II">SOC 2 Type II</SelectItem>
                <SelectItem value="ISO27001">ISO 27001</SelectItem>
                <SelectItem value="PCI_DSS">PCI DSS</SelectItem>
                <SelectItem value="COMMON_CONTROLS">Common Controls</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Frameworks Table */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Frameworks</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Framework</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Controls</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading frameworks...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFrameworks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No frameworks found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFrameworks.map((framework) => (
                    <TableRow key={framework.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{framework.name}</div>
                          <div className="text-sm text-gray-500">{framework.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(framework.type)}>
                          {getTypeDisplayName(framework.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{framework.version}</TableCell>
                      <TableCell className="text-gray-600">{framework._count.controls}</TableCell>
                      <TableCell>
                        <Badge className={framework.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {framework.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{framework.source}</TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(framework.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
