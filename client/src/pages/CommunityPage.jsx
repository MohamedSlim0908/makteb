import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MessageCircle,
  Search,
  Users,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSpinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCommunity } from '../features/community/useCommunity';
import { useMembership } from '../features/community/useMembership';
import { useMembers } from '../features/community/useMembers';
import { useJoinCommunity } from '../features/community/useJoinCommunity';
import { useLeaveCommunity } from '../features/community/useLeaveCommunity';
import { usePosts } from '../features/posts/usePosts';
import { useCreatePost } from '../features/posts/useCreatePost';
import { useToggleLike } from '../features/posts/useToggleLike';
import { useUpdatePost } from '../features/posts/useUpdatePost';
import { useDeletePost } from '../features/posts/useDeletePost';
import { useTogglePin } from '../features/posts/useTogglePin';
import { EditPostModal } from '../components/course-community/EditPostModal';
import { DeleteConfirmModal } from '../components/course-community/DeleteConfirmModal';
import { useLeaderboard } from '../features/gamification/useLeaderboard';
import { useCourses } from '../features/courses/useCourses';
import { useCommunitySocket } from '../hooks/useCommunitySocket';
import { PaymentModal } from '../components/ui/PaymentModal';
import { PostCard } from '../components/course-community/PostCard';
import { PostComposer } from '../components/course-community/PostComposer';
import { CommunitySidebar } from '../components/course-community/CommunitySidebar';
import { Leaderboard } from '../components/course-community/Leaderboard';
import { MembersList } from '../components/course-community/MembersList';
import { CalendarMonthView } from '../components/course-community/CalendarMonthView';

const PAGE_SIZE = 10;

const TABS = [
  { id: 'community', label: 'Community' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'members', label: 'Members' },
  { id: 'leaderboards', label: 'Leaderboards' },
  { id: 'about', label: 'About' },
];

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'GENERAL', label: 'General' },
  { value: 'WINS', label: 'Wins' },
  { value: 'WORKFLOW_PRODUCTIVITY', label: 'Resources' },
  { value: 'INTRODUCE_YOURSELF', label: 'Introduce Yourself' },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CommunityPage() {
  const { slug } = useParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('community');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const observerRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);

  const { data: community, isLoading: communityLoading } = useCommunity(slug);

  const communityId = community?.id;

  const { data: membership } = useMembership(communityId, user?.id);

  const isMember = !!membership?.membership;
  const memberRole = membership?.membership?.role;

  const { data: members, isLoading: membersLoading } = useMembers(communityId);

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = usePosts(communityId, { category: activeCategory, pageSize: PAGE_SIZE, enabled: activeTab === 'community' });

  const posts = useMemo(
    () => postsData?.pages.flatMap((p) => p.posts || []) ?? [],
    [postsData]
  );

  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(communityId);

  const { data: courses, isLoading: coursesLoading } = useCourses(communityId, { enabled: activeTab === 'classroom' });

  useCommunitySocket(communityId);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchNextPage(); },
      { threshold: 0.5 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const joinMutation = useJoinCommunity(communityId, slug);
  const leaveMutation = useLeaveCommunity(communityId, slug);
  const createPostMutation = useCreatePost(communityId);
  const likeMutation = useToggleLike(communityId);
  const updatePostMutation = useUpdatePost(communityId);
  const deletePostMutation = useDeletePost(communityId);
  const togglePinMutation = useTogglePin(communityId);

  function doJoin() {
    joinMutation.mutate(undefined, {
      onSuccess: () => toast.success('Welcome to the community!'),
    });
  }

  function handleJoin() {
    if (community?.price && Number(community.price) > 0) {
      setShowPaymentModal(true);
    } else {
      doJoin();
    }
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false);
    doJoin();
  }

  function handleCreatePost(e) {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    createPostMutation.mutate(
      {
        communityId,
        title: postTitle.trim(),
        content: postContent.trim(),
        type: 'DISCUSSION',
        category: postCategory,
      },
      {
        onSuccess: () => {
          setPostTitle('');
          setPostContent('');
          setPostCategory('GENERAL');
          toast.success('Post created!');
        },
      }
    );
  }

  function handleLike(postId) {
    if (!user) { toast.error('Sign in to like posts.'); return; }
    likeMutation.mutate(postId);
  }

  if (communityLoading) return <PageSpinner />;
  if (!community) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-white flex items-center justify-center">
        <EmptyState icon={Users} title="Community not found" description="This community doesn't exist or has been removed." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">
                  {(community.name || 'C').charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {community.memberCount || community._count?.members || 0} members
                    {community.visibility === 'PRIVATE' && ' · Private'}
                    {community.price > 0 && ` · $${community.price}/mo`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user && isMember ? (
                  <>
                    {(memberRole === 'OWNER' || memberRole === 'ADMIN') && (
                      <Link to={`/community/${slug}/settings`}>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" onClick={() => leaveMutation.mutate(undefined, {
                      onSuccess: () => toast.success('You left the community.'),
                    })} isLoading={leaveMutation.isPending}>
                      Leave
                    </Button>
                  </>
                ) : user ? (
                  <Button onClick={handleJoin} isLoading={joinMutation.isPending}>
                    {community.price > 0 ? `Join Community - ${community.price} TND` : 'Join Community'}
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button>Sign in to Join</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              {isMember && user && (
                <PostComposer
                  user={user}
                  title={postTitle}
                  content={postContent}
                  category={postCategory}
                  onTitleChange={setPostTitle}
                  onContentChange={setPostContent}
                  onCategoryChange={setPostCategory}
                  onSubmit={handleCreatePost}
                  isSubmitting={createPostMutation.isPending}
                />
              )}

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Posts */}
              {postsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="post" />)}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onToggleLike={handleLike}
                      likePending={likeMutation.isPending}
                      currentUserId={user?.id}
                      memberRole={memberRole}
                      onEdit={() => setEditingPost(post)}
                      onDelete={() => setDeletingPost(post)}
                      onTogglePin={() => togglePinMutation.mutate(post.id, {
                        onSuccess: () => toast.success(post.pinned ? 'Post unpinned' : 'Post pinned'),
                      })}
                    />
                  ))}
                  <div ref={observerRef} className="h-4" />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12">
                  <EmptyState
                    icon={MessageCircle}
                    title="No posts yet"
                    description={isMember ? 'Be the first to start a discussion!' : 'Join the community to participate.'}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <CommunitySidebar
              community={community}
              members={members || []}
              leaderboard={leaderboard || []}
              isMember={isMember}
              onJoin={handleJoin}
              isJoining={joinMutation.isPending}
              onOpenLeaderboard={() => setActiveTab('leaderboards')}
            />
          </div>
        )}

        {activeTab === 'classroom' && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Courses</h2>
            {coursesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} variant="course-row" />)}
              </div>
            ) : courses && courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {course.coverImage && (
                        <img src={course.coverImage} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">{course.title}</h3>
                        {course.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{course.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{course.modules?.length || 0} modules</span>
                          <span>{course.price ? `$${course.price}` : 'Free'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12">
                <EmptyState icon={Search} title="No courses yet" description="Courses will appear here once they're created." />
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarMonthView
            communityId={communityId}
            isAdmin={memberRole === 'OWNER' || memberRole === 'ADMIN'}
          />
        )}

        {activeTab === 'members' && <MembersList members={members || []} isLoading={membersLoading} />}

        {activeTab === 'leaderboards' && (
          <Leaderboard entries={leaderboardLoading ? [] : leaderboard || []} />
        )}

        {activeTab === 'about' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">About {community.name}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {community.description || 'No description provided yet.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {community.memberCount || community._count?.members || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{community._count?.posts || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatDate(community.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingPost && (
        <EditPostModal
          post={editingPost}
          isPending={updatePostMutation.isPending}
          onClose={() => setEditingPost(null)}
          onSave={(data) => updatePostMutation.mutate(data, {
            onSuccess: () => { setEditingPost(null); toast.success('Post updated'); },
          })}
        />
      )}

      {deletingPost && (
        <DeleteConfirmModal
          isPending={deletePostMutation.isPending}
          onClose={() => setDeletingPost(null)}
          onConfirm={() => deletePostMutation.mutate(deletingPost.id, {
            onSuccess: () => { setDeletingPost(null); toast.success('Post deleted'); },
          })}
        />
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        type="COMMUNITY"
        referenceId={communityId}
        amount={Number(community.price) || 0}
        itemName={community.name}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
