'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building, 
  Users, 
  Shield, 
  Eye, 
  BarChart3, } from 'lucide-react';

const navigation = [
  {
    name: 'Assets',
    href: '/dashboard/assets',
    icon: Building,
    description: 'IT asset inventory and lifecycle management'
  },
  {
    name: 'Vendors',
    href: '/dashboard/vendors',
    icon: Users,
    description: 'Vendor relationships and contract management'
  },
  {
    name: 'Software & Licenses',
    href: '/dashboard/software',
    icon: Shield,
    description: 'Software catalog and license compliance'
  },
  {
    name: 'Access Registry',
    href: '/dashboard/access',
    icon: Eye,
    description: 'User access controls and reviews'
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    description: 'Compliance reports and evidence generation'
  }
];

export default function AssetManagementNavigation() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Asset Management</h2>
        <p className="text-sm text-gray-500">
          Complete IT asset and access management for compliance
        </p>
      </div>
      
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900">1,247</div>
            <div className="text-xs text-gray-500">Total Assets</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900">23</div>
            <div className="text-xs text-gray-500">Warranty Expiring</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900">156</div>
            <div className="text-xs text-gray-500">Active Licenses</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900">12</div>
            <div className="text-xs text-gray-500">Reviews Due</div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Compliance Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Score</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <span className="text-sm font-medium text-gray-900">85%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Asset Coverage</span>
            <span className="text-sm font-medium text-green-600">Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Access Reviews</span>
            <span className="text-sm font-medium text-yellow-600">In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
