import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pin } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { CommunityAvatar } from './CommunityAvatar';

export function CommunitiesSection({ communities, communityVisibility, communityPinned, onVisibilityToggle, onPinToggle }) {
  return (
    <Card className="p-6">
      <h1 className="text-3xl font-semibold text-gray-900">Communities</h1>
      <p className="mt-2 text-sm text-gray-500">Drag and drop to reorder, pin to sidebar, or hide.</p>

      {communities.length > 0 ? (
        <div className="mt-6 space-y-4">
          {communities.map((community) => (
            <div key={community.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <CommunityAvatar community={community} />
                <p className="font-semibold text-gray-900 truncate">{community.name}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to={`/community/${community.slug}/settings`}
                  className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  SETTINGS
                </Link>

                <button
                  type="button"
                  onClick={() => onVisibilityToggle(community)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                  aria-label={`${communityVisibility[community.id] === false ? 'Show' : 'Hide'} ${community.name}`}
                >
                  {communityVisibility[community.id] === false ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onPinToggle(community)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 ${
                    communityPinned[community.id] ? 'text-amber-600' : 'text-gray-400'
                  }`}
                  aria-label={`Pin ${community.name}`}
                >
                  <Pin className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">No communities yet. Join a course or create a community first.</p>
      )}
    </Card>
  );
}
