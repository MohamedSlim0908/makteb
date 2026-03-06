import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Leaderboard } from './Leaderboard';
import { getMemberPresence } from './mockData';

export function CommunitySidebar({
  course,
  community: communityProp,
  members,
  leaderboard,
  isEnrolled,
  isMember,
  onEnroll,
  onJoin,
  isEnrolling,
  isJoining,
  onOpenLeaderboard,
}) {
  const community = communityProp || course?.community;
  const memberCount = members?.length || community?._count?.members || 0;
  const adminCount = members?.filter((member) => ['OWNER', 'ADMIN'].includes(member.role)).length || 1;
  const onlineCount =
    members?.filter((member) => getMemberPresence(member.user?.id || member.id).isOnline).length || 1;

  const coverImage = course?.coverImage || community?.coverImage;
  const name = community?.name || course?.title;
  const description = community?.description || course?.description || 'A community for learning and growing together.';
  const slug = community?.slug || course?.id;

  return (
    <aside className="space-y-4 hidden lg:block">
      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-28 bg-gray-200">
          {coverImage && (
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">skool.com/{slug}</p>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">
            {description}
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{memberCount}</p>
              <p className="text-[11px] text-gray-500">Members</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{onlineCount}</p>
              <p className="text-[11px] text-gray-500">Online</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{adminCount}</p>
              <p className="text-[11px] text-gray-500">Admins</p>
            </div>
          </div>

          <div className="mt-4">
            {isEnrolled || isMember ? (
              <button
                type="button"
                className="h-10 w-full rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Invite People
              </button>
            ) : (
              <Button className="w-full" onClick={onEnroll || onJoin} isLoading={isEnrolling || isJoining}>
                {course ? 'Enroll Now' : 'Join Community'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Members preview */}
      {members && members.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Members</h3>
          <div className="flex -space-x-2">
            {members.slice(0, 8).map((m) => (
              <Avatar
                key={m.user?.id || m.id}
                src={m.user?.avatar}
                name={m.user?.name || 'User'}
                size="sm"
                className="ring-2 ring-white"
              />
            ))}
            {members.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 ring-2 ring-white">
                +{members.length - 8}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard preview */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Leaderboard</h3>
          <Leaderboard entries={leaderboard} compact onViewAll={onOpenLeaderboard} />
        </div>
      )}
    </aside>
  );
}
