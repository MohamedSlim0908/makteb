import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useCourse } from '../features/courses/useCourse';
import { useCourseProgress } from '../features/courses/useCourseProgress';
import { useEnroll } from '../features/courses/useEnroll';
import { useMembers } from '../features/community/useMembers';
import { useLeaderboard } from '../features/gamification/useLeaderboard';
import { useCreatePost } from '../features/posts/useCreatePost';
import { useToggleLike } from '../features/posts/useToggleLike';
import { useUpdatePost } from '../features/posts/useUpdatePost';
import { useDeletePost } from '../features/posts/useDeletePost';
import { useTogglePin } from '../features/posts/useTogglePin';
import { useMembership } from '../features/community/useMembership';
import { EditPostModal } from '../components/course-community/EditPostModal';
import { DeleteConfirmModal } from '../components/course-community/DeleteConfirmModal';
import { useCommunitySocket } from '../hooks/useCommunitySocket';
import { Button } from '../components/ui/Button';
import { PaymentModal } from '../components/ui/PaymentModal';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSpinner } from '../components/ui/Spinner';
import { PostComposer } from '../components/course-community/PostComposer';
import { CategoryFilters } from '../components/course-community/CategoryFilters';
import { PostCard } from '../components/course-community/PostCard';
import { CommunitySidebar } from '../components/course-community/CommunitySidebar';
import { Leaderboard } from '../components/course-community/Leaderboard';
import { MembersList } from '../components/course-community/MembersList';
import { CalendarMonthView } from '../components/course-community/CalendarMonthView';
import {
  COURSE_TABS,
  POST_CATEGORIES,
} from '../components/course-community/mockData';
import { EventNotice } from '../components/course-community/EventNotice';
import { useUpcomingEvent } from '../features/events/useUpcomingEvent';

const PUBLIC_TAB_IDS = new Set(['community', 'about']);

function getAvailableTabs(isEnrolled) {
  if (isEnrolled) return COURSE_TABS;
  return COURSE_TABS.filter((tab) => PUBLIC_TAB_IDS.has(tab.id));
}

function sortModules(modules = []) {
  return [...modules].sort((a, b) => a.order - b.order);
}

export function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);

  const requestedTab = searchParams.get('tab') || 'community';

  const { data: course, isLoading: courseLoading } = useCourse(id);

  const { data: progress } = useCourseProgress(id, user?.id);

  const isEnrolled = Boolean(progress);
  const availableTabs = useMemo(() => getAvailableTabs(isEnrolled), [isEnrolled]);
  const activeTab = availableTabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'community';

  useEffect(() => {
    if (requestedTab !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, requestedTab, searchParams, setSearchParams]);

  const communityId = course?.community?.id;

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', communityId, activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '20');
      if (activeCategory !== 'ALL') params.set('category', activeCategory);
      const { data } = await api.get(`/posts/community/${communityId}?${params}`);
      return data.posts;
    },
    enabled: !!communityId && activeTab === 'community',
  });

  const { data: members } = useMembers(communityId);

  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(communityId);

  const enrollMutation = useEnroll(id, user?.id);

  const { data: membership } = useMembership(communityId, user?.id);
  const memberRole = membership?.membership?.role;

  const createPostMutation = useCreatePost(communityId);
  const likeMutation = useToggleLike(communityId);
  const updatePostMutation = useUpdatePost(communityId);
  const deletePostMutation = useDeletePost(communityId);
  const togglePinMutation = useTogglePin(communityId);

  useCommunitySocket(communityId);

  const { data: upcomingEvent } = useUpcomingEvent(communityId);

  function handleTabChange(tabId) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next);
  }

  function handleCreatePost(e) {
    e.preventDefault();
    if (!isEnrolled) { toast.error('Enroll first.'); return; }
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
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create post'),
      }
    );
  }

  function handleLike(postId) {
    if (!user) { toast.error('Sign in to like.'); return; }
    if (!isEnrolled) { toast.error('Enroll to interact.'); return; }
    likeMutation.mutate(postId, {
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to like'),
    });
  }

  function doEnroll() {
    enrollMutation.mutate(undefined, {
      onSuccess: () => toast.success('You are now enrolled!'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to enroll'),
    });
  }

  function handleEnroll() {
    if (!user) { navigate('/login'); return; }
    if (course?.price && Number(course.price) > 0) {
      setShowPaymentModal(true);
    } else {
      doEnroll();
    }
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false);
    doEnroll();
  }

  if (courseLoading || !course) return <PageSpinner />;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4">
          <Tabs tabs={availableTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <CalendarMonthView communityId={communityId} />
        </div>
      )}

      {activeTab !== 'calendar' && (
        <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            {activeTab === 'community' && (
              <>
                {!isEnrolled && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Lock className="w-4 h-4" />
                      Enroll to unlock all tabs and features.
                    </div>
                    <Button onClick={handleEnroll} isLoading={enrollMutation.isPending}>
                      {course?.price > 0 ? `Enroll Now - ${course.price} TND` : 'Enroll Now'}
                    </Button>
                  </div>
                )}

                {isEnrolled && user && (
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

                <EventNotice event={upcomingEvent} />
                <CategoryFilters
                  categories={POST_CATEGORIES}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />

                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} variant="post" />)}
                  </div>
                ) : posts?.length ? (
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
                          onError: () => toast.error('Failed to pin post'),
                        })}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12">
                    <EmptyState icon={Lock} title="No posts yet" description="Be the first to start the discussion." />
                  </div>
                )}
              </>
            )}

            {activeTab === 'classroom' && isEnrolled && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Classroom</h2>
                <p className="text-sm text-gray-500 mb-6">Modules and lessons for this course.</p>
                <div className="space-y-3">
                  {sortModules(course.modules).map((module, idx) => (
                    <div key={module.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Module {idx + 1}</p>
                      <h3 className="text-base font-semibold text-gray-900 mt-1">{module.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{module.lessons.length} lessons</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link to={`/course/${id}/learn`}>
                    <Button>Start Learning</Button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'members' && isEnrolled && <MembersList members={members || []} />}

            {activeTab === 'leaderboards' && isEnrolled && (
              <Leaderboard entries={leaderboardLoading ? [] : leaderboard || []} />
            )}

            {activeTab === 'about' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About This Course</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {course.community?.description || course.description || 'No description provided yet.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{members?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{course.community?._count?.posts || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Modules</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{course.modules?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <CommunitySidebar
            course={course}
            members={members || []}
            leaderboard={leaderboard || []}
            isEnrolled={isEnrolled}
            onEnroll={handleEnroll}
            isEnrolling={enrollMutation.isPending}
            onOpenLeaderboard={() => handleTabChange('leaderboards')}
          />
        </div>
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          isPending={updatePostMutation.isPending}
          onClose={() => setEditingPost(null)}
          onSave={(data) => updatePostMutation.mutate(data, {
            onSuccess: () => { setEditingPost(null); toast.success('Post updated'); },
            onError: () => toast.error('Failed to update post'),
          })}
        />
      )}

      {deletingPost && (
        <DeleteConfirmModal
          isPending={deletePostMutation.isPending}
          onClose={() => setDeletingPost(null)}
          onConfirm={() => deletePostMutation.mutate(deletingPost.id, {
            onSuccess: () => { setDeletingPost(null); toast.success('Post deleted'); },
            onError: () => toast.error('Failed to delete post'),
          })}
        />
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        type="COURSE"
        referenceId={id}
        amount={Number(course?.price) || 0}
        itemName={course?.title || 'Course'}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
