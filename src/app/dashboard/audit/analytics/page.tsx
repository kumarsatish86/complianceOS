import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { AuditAnalyticsDashboard } from '@/components/audit/audit-analytics-dashboard';

export default function AuditAnalyticsPage() {
  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Audit Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for audit performance and compliance trends
          </p>
        </div>

        <AuditAnalyticsDashboard organizationId="org-123" />
      </div>
    </PlatformAdminLayout>
  );
}
