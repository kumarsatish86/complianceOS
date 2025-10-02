import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { GuestAuditorManagement } from '@/components/audit/guest-auditor-management';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, Users } from 'lucide-react';

export default function GuestAuditorsPage() {
  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Guest Auditor Management</h1>
          <p className="text-gray-600 mt-1">
            Invite and manage external auditors for collaborative audit reviews
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Invited</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-bold">8</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">3</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-xl font-bold">1</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Guest Auditor Management */}
        <GuestAuditorManagement auditRunId="audit-run-123" />

        {/* Best Practices */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Guest Auditor Best Practices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Security Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use time-limited access with automatic expiration</li>
                <li>• Grant minimal necessary permissions (read-only by default)</li>
                <li>• Monitor guest auditor activity and access patterns</li>
                <li>• Require strong authentication for external access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Collaboration Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Provide clear audit scope and objectives</li>
                <li>• Establish communication protocols and timelines</li>
                <li>• Use structured review workflows for consistency</li>
                <li>• Document all guest auditor interactions</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
