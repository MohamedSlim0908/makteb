import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { CourseTabs } from '../components/course-community/CourseTabs';
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
        if (axios.isAxiosError(err) && [401, 404].includes(err.response?.status || 0)) {
          return null;
        }
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
      toast.success('You are now enrolled in this course community.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll in course.');
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (payload) => api.post('/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-community-posts', communityId, activeCategory] });
      queryClient.invalidateQueries({ queryKey: ['course-community-leaderboard', communityId] });
      setPostTitle('');
      setPostContent('');
      setPostCategory('GENERAL');
      toast.success('Post created.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create post.');
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId) => api.post(`/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-community-posts', communityId, activeCategory] });
      queryClient.invalidateQueries({ queryKey: ['course-community-leaderboard', communityId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update like.');
    },
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

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!isEnrolled) {
      toast.error('Enroll in the course first.');
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) return;

    await createPostMutation.mutateAsync({
      communityId,
      title: postTitle.trim(),
      content: postContent.trim(),
      type: 'DISCUSSION',
      category: postCategory,
    });
  }

  async function handleLike(postId) {
    if (!user) {
      toast.error('Sign in to like posts.');
      return;
    }
    if (!isEnrolled) {
      toast.error('Enroll in the course to interact.');
      return;
    }
    await likeMutation.mutateAsync(postId);
  }

  function handleEnroll() {
    if (!user) {
      navigate('/login');
      return;
    }
    enrollMutation.mutate();
  }

  if (courseLoading || !course) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderCommunity = () => (
    <div className="space-y-4">
      {!isEnrolled && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Lock className="w-4 h-4" />
            Enroll in this course to unlock Classroom, Calendar, Members, Map, and Leaderboards.
          </div>
          <div>
            <Button onClick={handleEnroll} isLoading={enrollMutation.isPending}>
              Enroll to unlock course community
            </Button>
          </div>
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
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="h-36 rounded-xl border border-gray-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {posts?.length ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleLike={handleLike}
                likePending={likeMutation.isPending}
              />
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
              No posts yet. Be the first to start the discussion.
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderClassroom = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Classroom</h2>
      <p className="text-gray-600 mb-6">
        Learn from structured modules and lessons, then come back to discuss in the community.
      </p>

      <div className="space-y-3">
        {sortModules(course.modules).map((module, idx) => (
          <div key={module.id} className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Module {idx + 1}</p>
            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{module.lessons.length} lessons</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {isEnrolled ? (
          <Link to={`/course/${id}/learn`}>
            <Button>Start Learning</Button>
          </Link>
        ) : (
          <Button onClick={handleEnroll} isLoading={enrollMutation.isPending}>
            Enroll to access lessons
          </Button>
        )}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">About This Course Community</h2>
      <p className="text-gray-700 leading-7 whitespace-pre-wrap">
        {course.community?.description || course.description || 'No description provided yet.'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Members</p>
          <p className="text-2xl font-semibold text-gray-900">{members?.length || course.memberCount || 0}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Posts</p>
          <p className="text-2xl font-semibold text-gray-900">{course.community?._count?.posts || 0}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Courses</p>
          <p className="text-2xl font-semibold text-gray-900">{course.community?._count?.courses || 1}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gray-100">
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <CourseTabs tabs={availableTabs} activeTab={activeTab} onTabChange={handleTabChange} />
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
        <div className="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            {activeTab === 'community' && renderCommunity()}
            {activeTab === 'classroom' && isEnrolled && renderClassroom()}
            {activeTab === 'members' && isEnrolled && <MembersList members={members || []} />}
            {activeTab === 'leaderboards' && isEnrolled && (
              <Leaderboard entries={leaderboardLoading ? [] : leaderboard || []} />
            )}
            {activeTab === 'about' && renderAbout()}
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
