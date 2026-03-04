import { Button } from '../ui/Button';
import { Leaderboard } from './Leaderboard';
import { getMemberPresence } from './mockData';

function slugToSupportEmail(slug) {
  if (!slug) return 'support@makteb.com';
  return `${slug.replace(/[^a-z0-9-]/gi, '').toLowerCase()}@makteb.com`;
}

export function CommunitySidebar({
  course,
  members,
  leaderboard,
  isEnrolled,
  onEnroll,
  isEnrolling,
  onOpenLeaderboard,
}) {
  const community = course?.community;
  const memberCount = members?.length || community?._count?.members || course?.memberCount || 0;
  const adminCount = members?.filter((member) => ['OWNER', 'ADMIN'].includes(member.role)).length || 1;
  const onlineCount =
    members?.filter((member) => getMemberPresence(member.user?.id || member.id).isOnline).length || 1;

  return (
    <aside className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-32 bg-black">
          {course?.coverImage && (
            <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-2xl font-semibold text-gray-900">{community?.name || course?.title}</h3>
          <p className="text-sm text-gray-500 mt-1">makteb.com/{community?.slug || course?.id}</p>
          <p className="text-sm text-gray-700 mt-4">
            {community?.description || course?.description || 'Course community for enrolled members.'}
          </p>
          <p className="text-sm text-gray-700 mt-4">
            Support: {slugToSupportEmail(community?.slug)}
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{memberCount}</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{onlineCount}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{adminCount}</p>
              <p className="text-xs text-gray-500">Admins</p>
            </div>
          </div>

          <div className="mt-4">
            {isEnrolled ? (
              <button
                type="button"
                className="h-10 w-full rounded-lg border border-gray-200 bg-white font-semibold hover:bg-gray-50"
              >
                INVITE PEOPLE
              </button>
            ) : (
              <Button className="w-full" onClick={onEnroll} isLoading={isEnrolling}>
                ENROLL TO JOIN CHAT
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <h3 className="text-base font-semibold text-gray-900 px-1 py-1">Leaderboard (30-day)</h3>
        <Leaderboard entries={leaderboard || []} compact onViewAll={onOpenLeaderboard} />
      </div>
    </aside>
  );
}
