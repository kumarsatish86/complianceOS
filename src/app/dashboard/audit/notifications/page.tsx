import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { NotificationCenter } from '@/components/audit/notification-center';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Mail, MessageSquare, AlertTriangle, Settings } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-1">
            {/* Manage audit notifications and communication preferences */}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-xl font-bold">156</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BellRing className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-xl font-bold">23</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-xl font-bold">3</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Sent Today</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Notification Center */}
        <NotificationCenter organizationId="org-123" />

        {/* Notification Settings */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Notification Preferences</h3>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Audit Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Audit Status Changes</div>
                    <div className="text-xs text-gray-500">When audit status is updated</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-xs text-gray-500">Email</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Control Assignments</div>
                    <div className="text-xs text-gray-500">When controls are assigned to you</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-xs text-gray-500">In-App</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Finding Updates</div>
                    <div className="text-xs text-gray-500">When findings are created or updated</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-xs text-gray-500">Slack</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">System Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Deadline Reminders</div>
                    <div className="text-xs text-gray-500">Before audit deadlines</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-xs text-gray-500">Email</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Guest Auditor Activity</div>
                    <div className="text-xs text-gray-500">When guest auditors join or leave</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-xs text-gray-500">Teams</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">System Alerts</div>
                    <div className="text-xs text-gray-500">Critical system notifications</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-xs text-gray-500">SMS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Integration Status */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">Email Service</div>
                <div className="text-sm text-green-700">Connected</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">Slack Integration</div>
                <div className="text-sm text-green-700">Active</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-yellow-900">Teams Integration</div>
                <div className="text-sm text-yellow-700">Not Configured</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
