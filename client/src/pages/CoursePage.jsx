import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, Lock, Tag, UserRound, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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
import { MapView } from '../components/course-community/MapView';
import { CalendarMonthView } from '../components/course-community/CalendarMonthView';
import {
  COURSE_TABS,
  POST_CATEGORIES,
  findUpcomingEvent,
  getMockCalendarEvents,
} from '../components/course-community/mockData';
import { EventNotice } from '../components/course-community/EventNotice';

function sortModules(modules = []) {
  return [...modules].sort((a, b) => a.order - b.order);
}

function formatCoursePrice(price) {
  const value = Number(price);
  if (!value) return 'Free';
  return `$${value}/month`;
}

function CourseEnrollmentPage({ course, onEnroll, isEnrolling, isLoggedIn }) {
  const modules = sortModules(course.modules || []);
  const totalLessons = modules.reduce((count, module) => count + (module.lessons?.length || 0), 0);
  const memberCount = course.community?._count?.members || 0;
  const enrollmentCount = course._count?.enrollments || 0;
  const creatorName = course.creator?.name || course.community?.creator?.name || 'Course creator';
  const description =
    course.description ||
    course.community?.description ||
    'Join this course to unlock the full classroom and community.';
  const ctaLabel = isLoggedIn
    ? Number(course.price) > 0
      ? `ENROLL FOR ${formatCoursePrice(course.price)}`
      : 'START FREE TRIAL'
    : 'SIGN IN TO START FREE TRIAL';

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <Card className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {course.community?.name || course.title}
          </h1>
          <h2 className="text-base sm:text-lg text-gray-600 mt-1">{course.title}</h2>

          <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-black aspect-[16/9]">
            {course.coverImage ? (
              <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 flex items-center justify-center">
                <p className="text-white/95 text-center text-lg sm:text-2xl font-semibold px-6">{course.title}</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {modules.length > 0 ? (
              modules.slice(0, 6).map((module, index) => (
                <div
                  key={module.id}
                  className="min-w-[132px] max-w-[172px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Module {index + 1}</p>
                  <p className="text-xs text-gray-700 mt-1 line-clamp-2">{module.title}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Course modules will appear here after enrollment.
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-gray-400" />
              {course.community?.visibility === 'PRIVATE' ? 'Private' : 'Public'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              {memberCount.toLocaleString()} members
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-gray-400" />
              {formatCoursePrice(course.price)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="w-4 h-4 text-gray-400" />
              By {creatorName}
            </span>
          </div>

          <p className="mt-5 text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{description}</p>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900">What You Get</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                <span>{modules.length} structured modules</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                <span>{totalLessons} lessons with trackable progress</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                <span>Access to members, leaderboards, and private discussions</span>
              </li>
            </ul>
          </div>
        </Card>

        <aside className="lg:sticky lg:top-[84px] self-start">
          <Card className="overflow-hidden">
            <div className="h-36 bg-black">
              {course.coverImage ? (
                <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-2xl font-semibold text-gray-900">{course.community?.name || course.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {course.community?.slug ? `makteb.com/${course.community.slug}` : `makteb.com/course/${course.id}`}
              </p>
              <p className="text-sm text-gray-700 mt-4 leading-relaxed line-clamp-4">{description}</p>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-semibold text-gray-900">{memberCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">{enrollmentCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Enrolled</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">{modules.length}</p>
                  <p className="text-xs text-gray-500">Modules</p>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-[#e6c66e] text-gray-900 hover:bg-[#d8b963] focus-visible:ring-yellow-500 font-semibold"
                onClick={onEnroll}
                isLoading={isEnrolling}
              >
                {ctaLabel}
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const requestedTab = searchParams.get('tab');

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-shell', id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${id}`);
      return data.course;
    },
    enabled: !!id,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['course-progress', id, user?.id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/courses/${id}/progress`);
        return data.enrollment;
      } catch (err) {
        if (axios.isAxiosError(err) && [401, 402, 404].includes(err.response?.status || 0)) return null;
        throw err;
      }
    },
    enabled: !!id && !!user,
    retry: false,
  });

  const isEnrolled = Boolean(progress);
  const availableTabs = useMemo(() => COURSE_TABS, []);
  const defaultTab = availableTabs[0]?.id || 'community';
  const activeTab = availableTabs.some((tab) => tab.id === requestedTab) ? requestedTab : defaultTab;

  useEffect(() => {
    if (!isEnrolled) return;
    if (requestedTab !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, isEnrolled, requestedTab, searchParams, setSearchParams]);

  const communityId = course?.community?.id;

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['course-community-posts', communityId, activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '20');
      if (activeCategory !== 'ALL') params.set('category', activeCategory);
      const { data } = await api.get(`/posts/community/${communityId}?${params}`);
      return data.posts;
    },
    enabled: !!communityId && isEnrolled && activeTab === 'community',
  });

  const { data: members } = useQuery({
    queryKey: ['course-community-members', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data.members;
    },
    enabled: !!communityId && isEnrolled,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['course-community-leaderboard', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${communityId}`);
      return data.leaderboard;
    },
    enabled: !!communityId && isEnrolled,
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/courses/${id}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', id, user?.id] });
      toast.success('You are now enrolled!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to enroll'),
  });

  const createPostMutation = useMutation({
    mutationFn: (payload) => api.post('/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-community-posts', communityId, activeCategory] });
      setPostTitle('');
      setPostContent('');
      setPostCategory('GENERAL');
      toast.success('Post created!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create post'),
  });

  const likeMutation = useMutation({
    mutationFn: (postId) => api.post(`/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-community-posts', communityId, activeCategory] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to like'),
  });

  const upcomingEvent = useMemo(
    () => findUpcomingEvent(getMockCalendarEvents(new Date())),
    []
  );

  function handleTabChange(tabId) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next);
  }

  function handleCreatePost(e) {
    e.preventDefault();
    if (!isEnrolled) { toast.error('Enroll first.'); return; }
    if (!postTitle.trim() || !postContent.trim()) return;
    createPostMutation.mutateAsync({
      communityId,
      title: postTitle.trim(),
      content: postContent.trim(),
      type: 'DISCUSSION',
      category: postCategory,
    });
  }

  function handleLike(postId) {
    if (!user) { toast.error('Sign in to like.'); return; }
    if (!isEnrolled) { toast.error('Enroll to interact.'); return; }
    likeMutation.mutateAsync(postId);
  }

  function handleEnroll() {
    if (!user) { navigate('/login'); return; }
    enrollMutation.mutate();
  }

  if (authLoading || courseLoading) return <PageSpinner />;
  if (!course) return <PageSpinner />;
  if (user && progressLoading) return <PageSpinner />;

  if (!isEnrolled) {
    return (
      <CourseEnrollmentPage
        course={course}
        onEnroll={handleEnroll}
        isEnrolling={enrollMutation.isPending}
        isLoggedIn={Boolean(user)}
      />
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <Tabs tabs={availableTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <CalendarMonthView />
        </div>
      )}

      {activeTab === 'map' && (
        <div className="max-w-[1600px] mx-auto py-6">
          <MapView members={members || []} />
        </div>
      )}

      {activeTab !== 'calendar' && activeTab !== 'map' && (
        <div className="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            {activeTab === 'community' && (
              <>
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
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} variant="post" />)}
                  </div>
                ) : posts?.length ? (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} onToggleLike={handleLike} likePending={likeMutation.isPending} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <EmptyState icon={Lock} title="No posts yet" description="Be the first to start the discussion." />
                  </Card>
                )}
              </>
            )}

            {activeTab === 'classroom' && isEnrolled && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Classroom</h2>
                <p className="text-sm text-gray-500 mb-6">Structured modules and lessons for this course.</p>
                <div className="space-y-3">
                  {sortModules(course.modules).map((module, idx) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Module {idx + 1}</p>
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
              </Card>
            )}

            {activeTab === 'members' && isEnrolled && <MembersList members={members || []} />}

            {activeTab === 'leaderboards' && isEnrolled && (
              <Leaderboard entries={leaderboardLoading ? [] : leaderboard || []} />
            )}

            {activeTab === 'about' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Course</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {course.community?.description || course.description || 'No description provided yet.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Members</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{members?.length || 0}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Posts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{course.community?._count?.posts || 0}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Modules</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{course.modules?.length || 0}</p>
                  </div>
                </div>
              </Card>
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
    </div>
  );
}
