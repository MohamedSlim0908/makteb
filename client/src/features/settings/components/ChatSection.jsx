import { ChevronDown, MessageCircle, MessageCircleOff } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Toggle } from '../../../components/ui/Toggle';
import { CommunityAvatar } from './CommunityAvatar';

export function ChatSection({
  notificationSettings,
  onNotificationSettingsChange,
  communities,
  communityChatMode,
  onChatModeToggle,
}) {
  return (
    <Card className="p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-2 text-lg text-gray-800">
            Notify me with sound and blinking tab header when somebody messages me.
          </p>
        </div>
        <Toggle
          checked={notificationSettings.chat}
          onChange={() => onNotificationSettingsChange((prev) => ({ ...prev, chat: !prev.chat }))}
        />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">Email notifications</h2>
          <p className="mt-2 text-lg text-gray-800">
            If you&apos;re offline and somebody messages you, we&apos;ll let you know via email. We won&apos;t email you if you&apos;re online.
          </p>
        </div>
        <Toggle
          checked={notificationSettings.email}
          onChange={() => onNotificationSettingsChange((prev) => ({ ...prev, email: !prev.email }))}
        />
      </div>

      <div>
        <h2 className="text-3xl font-semibold text-gray-900">Who can message me?</h2>
        <p className="mt-2 text-lg text-gray-800">
          Only members in the group you&apos;re in can message you. You choose what group users can message you from by turning your chat on/off below.
        </p>
      </div>

      <div className="space-y-3">
        {communities.map((community) => {
          const mode = communityChatMode[community.id] || 'ON';
          return (
            <div key={community.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <CommunityAvatar community={community} />
                <p className="font-semibold text-gray-900 truncate">{community.name}</p>
              </div>
              <button
                type="button"
                onClick={() => onChatModeToggle(community.id)}
                className="inline-flex h-12 min-w-[124px] items-center justify-center gap-2 rounded-md border border-gray-300 text-lg font-semibold text-gray-500 bg-white"
              >
                {mode === 'ON' ? <MessageCircle className="w-4 h-4" /> : <MessageCircleOff className="w-4 h-4" />}
                {mode}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-3xl font-semibold text-gray-900">Blocked users</h2>
        <p className="mt-3 text-lg text-gray-800">You have no blocked users.</p>
      </div>
    </Card>
  );
}
