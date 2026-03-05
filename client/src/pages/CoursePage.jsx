import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSpinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
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
  const queryClient = useQueryClient();

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const requestedTab = searchParams.get('tab') || 'community';

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-shell', id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${id}`);
      return data.course;
    },
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ['course-progress', id, user?.id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/courses/${id}/progress`);
        return data.enrollment;
      } catch (err) {
        if (axios.isAxiosError(err) && [401, 404].includes(err.response?.status || 0)) return null;
        throw err;
      }
    },
    enabled: !!id && !!user,
    retry: false,
  });

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
    queryKey: ['course-community-posts', communityId, activeCategory],
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

  const { data: members } = useQuery({
    queryKey: ['course-community-members', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data.members;
    },
    enabled: !!communityId,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['course-community-leaderboard', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${communityId}`);
      return data.leaderboard;
    },
    enabled: !!communityId,
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

  if (courseLoading || !course) return <PageSpinner />;

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
                {!isEnrolled && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Lock className="w-4 h-4" />
                      Enroll to unlock all tabs and features.
                    </div>
                    <Button onClick={handleEnroll} isLoading={enrollMutation.isPending}>
                      Enroll to unlock
                    </Button>
                  </Card>
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
