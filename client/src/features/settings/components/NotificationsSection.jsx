import { ChevronDown } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Toggle } from '../../../components/ui/Toggle';
import { CommunityAvatar } from './CommunityAvatar';

export function NotificationsSection({
  notificationSettings,
  onNotificationSettingsChange,
  communities,
  communityNotificationMode,
  onCycleNotificationMode,
}) {
  return (
    <Card className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg text-gray-900">New follower</span>
          <Toggle
            checked={notificationSettings.follower}
            onChange={() => onNotificationSettingsChange((prev) => ({ ...prev, follower: !prev.follower }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg text-gray-900">Likes</span>
          <Toggle
            checked={notificationSettings.likes}
            onChange={() => onNotificationSettingsChange((prev) => ({ ...prev, likes: !prev.likes }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg text-gray-900">Ka-ching</span>
          <Toggle
            checked={notificationSettings.kaching}
            onChange={() => onNotificationSettingsChange((prev) => ({ ...prev, kaching: !prev.kaching }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg text-gray-900">Affiliate referral</span>
          <Toggle
            checked={notificationSettings.affiliate}
            onChange={() => onNotificationSettingsChange((prev) => ({ ...prev, affiliate: !prev.affiliate }))}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {communities.map((community) => (
          <div key={community.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <CommunityAvatar community={community} />
              <p className="font-semibold text-gray-900 truncate">{community.name}</p>
            </div>
            <button
              type="button"
              onClick={() => onCycleNotificationMode(community.id)}
              className="inline-flex items-center gap-1 text-gray-500"
            >
              {communityNotificationMode[community.id] || 'All'}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
