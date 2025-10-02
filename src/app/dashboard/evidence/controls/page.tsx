'use client';

import { useState, useEffect } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface Control {
  id: string;
  name: string;
  description: string;
  status: string;
  criticality: string;
  category: string;
  framework: {
    id: string;
    name: string;
    type: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    evidenceLinks: number;
    tasks: number;
  };
}

export default function ControlsPage() {
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [criticalityFilter, setCriticalityFilter] = useState('all');
  const [frameworkFilter, setFrameworkFilter] = useState('all');

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/controls');
      if (response.ok) {
        const data = await response.json();
        setControls(data.controls || []);
      }
    } catch (error) {
      console.error('Error fetching controls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredControls = controls.filter(control => {
    const matchesSearch = control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         control.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || control.status === statusFilter;
    const matchesCriticality = criticalityFilter === 'all' || control.criticality === criticalityFilter;
    const matchesFramework = frameworkFilter === 'all' || control.framework.id === frameworkFilter;
    
    return matchesSearch && matchesStatus && matchesCriticality && matchesFramework;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'MET': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PARTIAL': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'GAP': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'NOT_APPLICABLE': return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'MET': return 'bg-green-100 text-green-800';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'GAP': return 'bg-red-100 text-red-800';
      case 'NOT_APPLICABLE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCriticalityBadgeColor = (criticality: string) => {
    switch (criticality) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueFrameworks = Array.from(
    new Set(controls.map(c => c.framework.id))
  ).map(id => controls.find(c => c.framework.id === id)?.framework).filter(Boolean);

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Controls</h1>
            <p className="text-gray-600">Manage compliance controls and their implementation status</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Control
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
                <p className="text-sm text-gray-600">Total Controls</p>
                <p className="text-2xl font-bold text-gray-900">{controls.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Met Controls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {controls.filter(c => c.status === 'MET').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gap Controls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {controls.filter(c => c.status === 'GAP').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">With Evidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {controls.filter(c => c._count.evidenceLinks > 0).length}
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
                  placeholder="Search controls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="MET">Met</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="GAP">Gap</SelectItem>
                <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Criticality</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                {uniqueFrameworks.map((framework) => (
                  <SelectItem key={framework?.id} value={framework?.id || ''}>
                    {framework?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Controls Table */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Controls</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading controls...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredControls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No controls found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredControls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{control.name}</div>
                          <div className="text-sm text-gray-500">{control.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{control.framework.name}</div>
                          <div className="text-gray-500">{control.framework.type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(control.status)}
                          <Badge className={getStatusBadgeColor(control.status)}>
                            {control.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCriticalityBadgeColor(control.criticality)}>
                          {control.criticality}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {control.owner ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{control.owner.name}</div>
                            <div className="text-gray-500">{control.owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{control._count.evidenceLinks}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{control._count.tasks}</span>
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
