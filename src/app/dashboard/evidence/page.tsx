'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FrameworkType,
  ControlStatus,
  EvidenceStatus,
  EvidenceType,
  TaskStatus,
  TaskPriority,
  TaskType
} from '@prisma/client';
import { Plus, 
  Download, 
  Eye, 
  Edit, 
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  BarChart3,
  Link as LinkIcon,
  Lock } from 'lucide-react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
// import Link from 'next/link';

interface DashboardStats {
  totalFrameworks: number;
  totalControls: number;
  totalEvidence: number;
  totalTasks: number;
  controlsMet: number;
  controlsPartial: number;
  controlsGap: number;
  evidenceExpiring: number;
  tasksOverdue: number;
  tasksDueToday: number;
}

interface Framework {
  id: string;
  name: string;
  type: FrameworkType;
  isActive: boolean;
  _count: {
    controls: number;
    mappings: number;
  };
}

interface Control {
  id: string;
  name: string;
  status: ControlStatus;
  criticality: string;
  framework: {
    name: string;
    type: FrameworkType;
  };
  owner?: {
    name: string;
  };
  _count: {
    evidenceLinks: number;
    tasks: number;
  };
}

interface Evidence {
  id: string;
  title: string;
  type: EvidenceType;
  status: EvidenceStatus;
  expiryDate?: string;
  uploader: {
    name: string;
  };
  _count: {
    controlLinks: number;
    versions: number;
  };
}

interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: {
    name: string;
  };
  control?: {
    name: string;
  };
  evidence?: {
    title: string;
  };
}

export default function EvidenceLockerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'frameworks' | 'controls' | 'evidence' | 'tasks'>('overview');
  const [searchTerm] = useState('');
  const [statusFilter] = useState('all');
  const [currentPage] = useState(1);

  // Mock organization ID - in real app, get from context/auth
  // const organizationId = 'org-123';

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab, currentPage, searchTerm, statusFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, fetch from API
      setTimeout(() => {
        setStats({
          totalFrameworks: 3,
          totalControls: 89,
          totalEvidence: 156,
          totalTasks: 23,
          controlsMet: 45,
          controlsPartial: 28,
          controlsGap: 16,
          evidenceExpiring: 8,
          tasksOverdue: 3,
          tasksDueToday: 5,
        });

        setFrameworks([
          {
            id: '1',
            name: 'SOC 2 Type II',
            type: 'SOC2_TYPE_II',
            isActive: true,
            _count: { controls: 30, mappings: 12 }
          },
          {
            id: '2',
            name: 'ISO 27001',
            type: 'ISO_27001',
            isActive: true,
            _count: { controls: 35, mappings: 8 }
          },
          {
            id: '3',
            name: 'PCI DSS',
            type: 'PCI_DSS',
            isActive: true,
            _count: { controls: 24, mappings: 5 }
          }
        ]);

        setControls([
          {
            id: '1',
            name: 'Access Control Policy',
            status: 'MET',
            criticality: 'HIGH',
            framework: { name: 'SOC 2 Type II', type: 'SOC2_TYPE_II' },
            owner: { name: 'John Smith' },
            _count: { evidenceLinks: 3, tasks: 1 }
          },
          {
            id: '2',
            name: 'User Access Reviews',
            status: 'PARTIAL',
            criticality: 'HIGH',
            framework: { name: 'SOC 2 Type II', type: 'SOC2_TYPE_II' },
            owner: { name: 'Jane Doe' },
            _count: { evidenceLinks: 2, tasks: 2 }
          },
          {
            id: '3',
            name: 'Data Encryption',
            status: 'GAP',
            criticality: 'CRITICAL',
            framework: { name: 'ISO 27001', type: 'ISO_27001' },
            _count: { evidenceLinks: 0, tasks: 3 }
          }
        ]);

        setEvidence([
          {
            id: '1',
            title: 'Access Control Policy Document',
            type: 'POLICY',
            status: 'APPROVED',
            uploader: { name: 'John Smith' },
            _count: { controlLinks: 2, versions: 1 }
          },
          {
            id: '2',
            title: 'Q3 Access Review Report',
            type: 'REPORT',
            status: 'SUBMITTED',
            expiryDate: '2024-12-31',
            uploader: { name: 'Jane Doe' },
            _count: { controlLinks: 1, versions: 1 }
          },
          {
            id: '3',
            title: 'Encryption Configuration Screenshot',
            type: 'SCREENSHOT',
            status: 'DRAFT',
            uploader: { name: 'Mike Johnson' },
            _count: { controlLinks: 0, versions: 1 }
          }
        ]);

        setTasks([
          {
            id: '1',
            type: 'EVIDENCE_COLLECTION',
            status: 'OPEN',
            priority: 'HIGH',
            dueDate: '2024-01-15',
            assignee: { name: 'John Smith' },
            control: { name: 'Access Control Policy' }
          },
          {
            id: '2',
            type: 'CONTROL_REVIEW',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            dueDate: '2024-01-20',
            assignee: { name: 'Jane Doe' },
            control: { name: 'User Access Reviews' }
          },
          {
            id: '3',
            type: 'EVIDENCE_RENEWAL',
            status: 'OPEN',
            priority: 'HIGH',
            dueDate: '2024-01-10',
            assignee: { name: 'Mike Johnson' },
            evidence: { title: 'Q3 Access Review Report' }
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
            <h1 className="text-3xl font-bold tracking-tight">Evidence Locker & Control Frameworks</h1>
            <p className="text-muted-foreground">
              Comprehensive compliance evidence management and control framework implementation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Evidence
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Frameworks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalFrameworks}</div>
              <p className="text-xs text-muted-foreground">
                {/* Active compliance frameworks */}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalControls}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.controlsMet} Met, {stats?.controlsPartial} Partial, {stats?.controlsGap} Gap
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEvidence}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.evidenceExpiring} expiring soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.tasksOverdue} overdue, {stats?.tasksDueToday} due today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'frameworks' as const, label: 'Frameworks', icon: Shield },
            { id: 'controls' as const, label: 'Controls', icon: FileText },
            { id: 'evidence' as const, label: 'Evidence', icon: Building },
            { id: 'tasks' as const, label: 'Tasks', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Control Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Control Status Overview</CardTitle>
                <CardDescription>
                  Current status of controls across all frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Met</span>
                    </div>
                    <span className="text-sm font-medium">{stats?.controlsMet}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm">Partial</span>
                    </div>
                    <span className="text-sm font-medium">{stats?.controlsPartial}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm">Gap</span>
                    </div>
                    <span className="text-sm font-medium">{stats?.controlsGap}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest evidence and control updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New evidence uploaded</p>
                      <p className="text-xs text-muted-foreground">
                        Access Control Policy Document by John Smith
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Control status updated</p>
                      <p className="text-xs text-muted-foreground">
                        User Access Reviews marked as Partial
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Task assigned</p>
                      <p className="text-xs text-muted-foreground">
                        Evidence Collection task assigned to Mike Johnson
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'frameworks' && (
          <Card>
            <CardHeader>
              <CardTitle>Control Frameworks</CardTitle>
              <CardDescription>
                {/* Manage compliance frameworks and their controls */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {frameworks.map((framework) => (
                  <div key={framework.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <h3 className="font-medium">{framework.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {framework._count.controls} controls • {framework._count.mappings} mappings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        framework.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {framework.isActive ? 'Active' : 'Inactive'}
                      </span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'controls' && (
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>
                {/* Manage compliance controls and their evidence */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Control</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{control.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {control.criticality} Priority
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{control.framework.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          control.status === 'MET' ? 'bg-green-100 text-green-800' :
                          control.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {control.status}
                        </span>
                      </TableCell>
                      <TableCell>{control.owner?.name || 'Unassigned'}</TableCell>
                      <TableCell>{control._count.evidenceLinks} linked</TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'evidence' && (
          <Card>
            <CardHeader>
              <CardTitle>Evidence Repository</CardTitle>
              <CardDescription>
                {/* Manage compliance evidence and documentation */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Controls</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evidence.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {item._count.versions} version{item._count.versions !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          item.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>{item.uploader.name}</TableCell>
                      <TableCell>
                        {item.expiryDate ? (
                          <span className={`text-sm ${
                            new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                              ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>{item._count.controlLinks} linked</TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Lock className="h-4 w-4" />
                            </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Track compliance tasks and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {task.control?.name || task.evidence?.title || 'General Task'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.type.replace('_', ' ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{task.type.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'OPEN' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell>{task.assignee?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <span className={`text-sm ${
                            new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformAdminLayout>
  );
}
