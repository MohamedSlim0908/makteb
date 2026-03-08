import { getInitials } from '../settingsConstants';

export function CommunityAvatar({ community }) {
  if (community.coverImage) {
    return (
      <img
        src={community.coverImage}
        alt={community.name}
        className="h-10 w-10 rounded-lg object-cover border border-gray-200"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-lg bg-gray-900 text-white text-sm font-bold flex items-center justify-center">
      {getInitials(community.name)}
    </div>
  );
}
