import { Users, FileText, Globe, BookOpen } from 'lucide-react';
import { useAdminStats } from '../useAdmin';

function StatCard({ icon, label, value }) {
  const IconComponent = icon;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value ?? '-'}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminOverviewTab() {
  const { data: stats } = useAdminStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Users} label="Users" value={stats?.userCount} />
      <StatCard icon={Globe} label="Communities" value={stats?.communityCount} />
      <StatCard icon={BookOpen} label="Courses" value={stats?.courseCount} />
      <StatCard icon={FileText} label="Posts" value={stats?.postCount} />
    </div>
  );
}
