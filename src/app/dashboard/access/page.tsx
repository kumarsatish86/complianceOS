'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { SystemType, AccessStatus, RiskLevel, DataClassification } from '@prisma/client';
import { Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Edit,
  User,
  Server,
  Calendar,
  FileText } from 'lucide-react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface AccessRegistry {
  id: string;
  userId: string;
  systemName: string;
  systemType: SystemType;
  accessLevel: string;
  justification?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewDueDate?: string;
  status: AccessStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  system?: {
    id: string;
    name: string;
    type: SystemType;
    criticality: RiskLevel;
    dataClassification: DataClassification;
  };
  reviews: Array<{
    id: string;
    decision: string;
    justification?: string;
    reviewedAt: string;
    reviewer: {
      id: string;
      name?: string;
      email: string;
    };
  }>;
}

interface System {
  id: string;
  name: string;
  type: SystemType;
  ownerUserId?: string;
  criticality: RiskLevel;
  dataClassification: DataClassification;
  url?: string;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name?: string;
    email: string;
  };
  _count: {
    accessRegistry: number;
  };
}

export default function AccessRegistryPage() {
  const [activeTab, setActiveTab] = useState<'access' | 'systems'>('access');
  const [accessRegistry, setAccessRegistry] = useState<AccessRegistry[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [systemTypeFilter, setSystemTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock organization ID - in real app, get from context/auth
  const organizationId = 'org-123';

  const fetchAccessRegistry = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(systemTypeFilter && systemTypeFilter !== 'all' && { systemType: systemTypeFilter })
      });

      const response = await fetch(`/api/admin/access-registry?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setAccessRegistry(data.accessRegistry || []);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('Failed to fetch access registry:', data.error);
      }
    } catch (error) {
      console.error('Error fetching access registry:', error);
    }
  }, [organizationId, currentPage, searchTerm, statusFilter, systemTypeFilter]);

  const fetchSystems = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(systemTypeFilter && systemTypeFilter !== 'all' && { type: systemTypeFilter })
      });

      const response = await fetch(`/api/admin/systems?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setSystems(data.systems);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching systems:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentPage, searchTerm, systemTypeFilter]);

  useEffect(() => {
    if (activeTab === 'access') {
      fetchAccessRegistry();
    } else {
      fetchSystems();
    }
  }, [activeTab, currentPage, searchTerm, statusFilter, systemTypeFilter, fetchAccessRegistry, fetchSystems]);

  const getStatusColor = (status: AccessStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'SUSPENDED': return 'text-yellow-600 bg-yellow-100';
      case 'REVOKED': return 'text-red-600 bg-red-100';
      case 'PENDING_APPROVAL': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: AccessStatus) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'SUSPENDED': return <Clock className="h-4 w-4" />;
      case 'REVOKED': return <AlertTriangle className="h-4 w-4" />;
      case 'PENDING_APPROVAL': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getCriticalityColor = (criticality: RiskLevel) => {
    switch (criticality) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDataClassificationColor = (classification: DataClassification) => {
    switch (classification) {
      case 'PUBLIC': return 'text-green-600 bg-green-100';
      case 'INTERNAL': return 'text-blue-600 bg-blue-100';
      case 'CONFIDENTIAL': return 'text-orange-600 bg-orange-100';
      case 'RESTRICTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isReviewOverdue = (reviewDueDate?: string) => {
    if (!reviewDueDate) return false;
    return new Date(reviewDueDate) < new Date();
  };

  const isReviewDueSoon = (reviewDueDate?: string) => {
    if (!reviewDueDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(reviewDueDate) <= thirtyDaysFromNow && new Date(reviewDueDate) >= new Date();
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Access Registry</h1>
          <p className="text-muted-foreground">
            {/* Manage user access to systems and conduct access reviews */}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Review
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Grant Access
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accessRegistry.filter(a => a.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Current permissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accessRegistry.filter(a => isReviewOverdue(a.reviewDueDate)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Overdue reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accessRegistry.filter(a => a.status === 'PENDING_APPROVAL').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Systems</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systems.length}</div>
            <p className="text-xs text-muted-foreground">
              Managed systems
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'access' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('access')}
        >
          Access Registry
        </Button>
        <Button
          variant={activeTab === 'systems' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('systems')}
        >
          Systems
        </Button>
      </div>

      {/* Access Registry Tab */}
      {activeTab === 'access' && (
        <Card>
          <CardHeader>
            <CardTitle>User Access Registry</CardTitle>
            <CardDescription>
              Track and manage user permissions across all systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by user, system, or access level..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.values(AccessStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="systemType">System Type</Label>
                  <Select value={systemTypeFilter} onValueChange={setSystemTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.values(SystemType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setSystemTypeFilter('');
                      setCurrentPage(1);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>System</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Review Due</TableHead>
                    <TableHead>Last Review</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessRegistry.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">User {access.userId}</div>
                            <div className="text-xs text-muted-foreground">
                              {access.userId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{access.systemName}</div>
                          <div className="text-sm text-muted-foreground">
                            {access.systemType.replace('_', ' ')}
                          </div>
                          {access.system && (
                            <div className="flex gap-1 mt-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getCriticalityColor(access.system.criticality)}`}>
                                {access.system.criticality}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getDataClassificationColor(access.system.dataClassification)}`}>
                                {access.system.dataClassification}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{access.accessLevel}</span>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(access.status)}`}>
                          {getStatusIcon(access.status)}
                          {access.status.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {access.reviewDueDate ? (
                          <div className="space-y-1">
                            <div className="text-sm">
                              {new Date(access.reviewDueDate).toLocaleDateString()}
                            </div>
                            {isReviewOverdue(access.reviewDueDate) && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                              </div>
                            )}
                            {isReviewDueSoon(access.reviewDueDate) && !isReviewOverdue(access.reviewDueDate) && (
                              <div className="flex items-center gap-1 text-xs text-orange-600">
                                <Clock className="h-3 w-3" />
                                Due soon
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No review</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {access.reviews.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-sm">
                              {new Date(access.reviews[0].reviewedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {access.reviews[0].decision}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Systems Tab */}
      {activeTab === 'systems' && (
        <Card>
          <CardHeader>
            <CardTitle>Business Systems</CardTitle>
            <CardDescription>
              {/* Manage critical business systems and their access controls */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search systems by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="systemType">System Type</Label>
                  <Select value={systemTypeFilter} onValueChange={setSystemTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.values(SystemType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setSystemTypeFilter('');
                      setCurrentPage(1);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Criticality</TableHead>
                    <TableHead>Data Classification</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{system.name}</div>
                          {system.url && (
                            <div className="text-sm text-muted-foreground">
                              <a href={system.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {system.url}
                              </a>
                            </div>
                          )}
                          {system.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {system.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{system.type.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(system.criticality)}`}>
                          {system.criticality}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDataClassificationColor(system.dataClassification)}`}>
                          {system.dataClassification}
                        </span>
                      </TableCell>
                      <TableCell>
                        {system.owner ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{system.owner.name}</div>
                              <div className="text-xs text-muted-foreground">{system.owner.email}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{system._count.accessRegistry}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {activeTab === 'access' ? accessRegistry.length : systems.length} items
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
      </div>
    </PlatformAdminLayout>
  );
}
