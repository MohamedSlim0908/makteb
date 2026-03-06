import { CommunityCard } from './CommunityCard';

export function CommunitySidebar({ communityData, onOpenSettings }) {
  return (
    <aside className="space-y-4">
      <CommunityCard communityData={communityData} onOpenSettings={onOpenSettings} />
      <p className="text-center text-xs text-gray-400">
        powered by <span className="font-semibold text-gray-500">makteb</span>
      </p>
    </aside>
  );
}
