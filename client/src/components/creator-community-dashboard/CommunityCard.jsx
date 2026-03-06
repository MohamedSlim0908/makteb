import { Globe2, Lock, Settings } from 'lucide-react';

export function CommunityCard({ communityData, onOpenSettings }) {
  const isPrivate = communityData.privacyType === 'private';

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex h-36 w-full items-center justify-center bg-gray-800 text-gray-300 hover:bg-gray-700"
      >
        {communityData.coverImage ? (
          <img
            src={communityData.coverImage}
            alt={`${communityData.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          'Upload cover photo'
        )}
      </button>

      <div className="p-4">
        <h3 className="text-3xl font-semibold text-gray-900">{communityData.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500">
          {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
          {isPrivate ? 'Private group' : 'Public group'}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          {communityData.description}
        </p>

        <div className="mt-4 grid grid-cols-3 border border-gray-100 text-center">
          <div className="p-2">
            <p className="text-lg font-semibold text-gray-900">{communityData.stats.members}</p>
            <p className="text-xs text-gray-500">Members</p>
          </div>
          <div className="border-x border-gray-100 p-2">
            <p className="text-lg font-semibold text-gray-900">{communityData.stats.online}</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
          <div className="p-2">
            <p className="text-lg font-semibold text-gray-900">{communityData.stats.admins}</p>
            <p className="text-xs text-gray-500">Admins</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
          SETTINGS
        </button>
      </div>
    </div>
  );
}
