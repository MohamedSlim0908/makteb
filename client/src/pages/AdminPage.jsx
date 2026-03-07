import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';
import { AdminOverviewTab } from '../features/admin/components/AdminOverviewTab';
import { AdminUsersTab } from '../features/admin/components/AdminUsersTab';
import { AdminPostsTab } from '../features/admin/components/AdminPostsTab';
import { AdminCommunitiesTab } from '../features/admin/components/AdminCommunitiesTab';
import { AdminCoursesTab } from '../features/admin/components/AdminCoursesTab';
import { AdminEventsTab } from '../features/admin/components/AdminEventsTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'posts', label: 'Posts' },
  { id: 'communities', label: 'Communities' },
  { id: 'courses', label: 'Courses' },
  { id: 'events', label: 'Events' },
];

const TAB_COMPONENTS = {
  overview: AdminOverviewTab,
  users: AdminUsersTab,
  posts: AdminPostsTab,
  communities: AdminCommunitiesTab,
  courses: AdminCoursesTab,
  events: AdminEventsTab,
};

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const ActiveTabComponent = TAB_COMPONENTS[activeTab] ?? AdminOverviewTab;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage users, content, and platform settings</p>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <ActiveTabComponent />
      </div>
    </div>
  );
}
