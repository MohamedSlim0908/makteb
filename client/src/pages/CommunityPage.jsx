import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  MessageCircle,
  Search,
  Users,
  Settings,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSpinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { PostCard } from '../components/course-community/PostCard';
import { PostComposer } from '../components/course-community/PostComposer';
import { CategoryFilters } from '../components/course-community/CategoryFilters';
import { CommunitySidebar } from '../components/course-community/CommunitySidebar';
import { Leaderboard } from '../components/course-community/Leaderboard';
import { MembersList } from '../components/course-community/MembersList';
import { MapView } from '../components/course-community/MapView';
import { CalendarMonthView } from '../components/course-community/CalendarMonthView';
import { EventNotice } from '../components/course-community/EventNotice';

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
  { value: 'WINS', label: 'Newsletter' },
  { value: 'WORKFLOW_PRODUCTIVITY', label: 'Resources' },
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
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('community');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const observerRef = useRef(null);

  // Fetch community
  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${slug}`);
      return data.community;
    },
    enabled: !!slug,
  });

  const communityId = community?.id;

  // Membership
  const { data: membership } = useQuery({
    queryKey: ['membership', communityId, user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/membership`);
      return data;
    },
    enabled: !!communityId && !!user,
    retry: false,
  });

  const isMember = membership?.isMember ?? false;
  const memberRole = membership?.role;

  // Members
  const { data: members } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data.members;
    },
    enabled: !!communityId,
  });

  // Posts (infinite)
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = useInfiniteQuery({
    queryKey: ['community-posts', communityId, activeCategory],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set('page', String(pageParam));
      params.set('limit', String(PAGE_SIZE));
      if (activeCategory !== 'ALL') params.set('category', activeCategory);
      const { data } = await api.get(`/posts/community/${communityId}?${params}`);
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + (p.posts?.length || 0), 0);
      return loaded < (lastPage.total || 0) ? allPages.length + 1 : undefined;
    },
    enabled: !!communityId && activeTab === 'community',
  });

  const posts = useMemo(
    () => postsData?.pages.flatMap((p) => p.posts || []) ?? [],
    [postsData]
  );

  // Leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['community-leaderboard', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${communityId}`);
      return data.leaderboard;
    },
    enabled: !!communityId,
  });

  // Courses
  const { data: courses } = useQuery({
    queryKey: ['community-courses', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/community/${communityId}`);
      return data.courses;
    },
    enabled: !!communityId && activeTab === 'classroom',
  });

  // Infinite scroll observer
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

  // Mutations
  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      toast.success('Welcome to the community!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to join'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${communityId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      toast.success('You left the community.');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to leave'),
  });

  const createPostMutation = useMutation({
    mutationFn: (payload) => api.post('/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
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
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to like'),
  });

  function handleCreatePost(e) {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    createPostMutation.mutate({
      communityId,
      title: postTitle.trim(),
      content: postContent.trim(),
      type: 'DISCUSSION',
      category: postCategory,
    });
  }

  function handleLike(postId) {
    if (!user) { toast.error('Sign in to like posts.'); return; }
    likeMutation.mutate(postId);
  }

  if (communityLoading) return <PageSpinner />;
  if (!community) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5] flex items-center justify-center">
        <EmptyState icon={Users} title="Community not found" description="This community doesn't exist or has been removed." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  {(community.name || 'C').charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {community.memberCount || community._count?.members || 0} members
                    </span>
                    {community.visibility === 'PRIVATE' && <Badge variant="outline">Private</Badge>}
                    {community.price > 0 && <Badge variant="warning">${community.price}</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user && isMember ? (
                  <>
                    {(memberRole === 'OWNER' || memberRole === 'ADMIN') && (
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => leaveMutation.mutate()} isLoading={leaveMutation.isPending}>
                      Leave
                    </Button>
                  </>
                ) : user ? (
                  <Button onClick={() => joinMutation.mutate()} isLoading={joinMutation.isPending}>
                    Join Community
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
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              {/* Post Composer */}
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Posts */}
              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="post" />)}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onToggleLike={handleLike}
                      likePending={likeMutation.isPending}
                    />
                  ))}
                  <div ref={observerRef} className="h-4" />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <EmptyState
                    icon={MessageCircle}
                    title="No posts yet"
                    description={isMember ? 'Be the first to start a discussion!' : 'Join the community to participate.'}
                  />
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 hidden lg:block">
              {/* About */}
              <Card>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">About</h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-4">
                    {community.description || 'No description yet.'}
                  </p>
                </div>
              </Card>

              {/* Members preview */}
              {members && members.length > 0 && (
                <Card>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">Members</h3>
                      <button
                        onClick={() => setActiveTab('members')}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View all
                      </button>
                    </div>
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
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white">
                          +{members.length - 8}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Leaderboard preview */}
              {leaderboard && leaderboard.length > 0 && (
                <Card>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">Leaderboard</h3>
                      <button
                        onClick={() => setActiveTab('leaderboards')}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {leaderboard.slice(0, 5).map((entry, idx) => (
                        <div key={entry.user?.id || idx} className="flex items-center gap-2">
                          <span className="w-5 text-xs font-bold text-gray-400 text-center">{idx + 1}</span>
                          <Avatar src={entry.user?.avatar} name={entry.user?.name} size="sm" />
                          <span className="text-sm text-gray-700 truncate flex-1">{entry.user?.name}</span>
                          <span className="text-xs font-medium text-primary-600">{entry.totalPoints} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </aside>
          </div>
        )}

        {activeTab === 'classroom' && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Courses</h2>
            {courses && courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-card-hover hover:border-gray-300 transition-all"
                  >
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{course.modules?.length || 0} modules</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{course.price ? `$${course.price}` : 'Free'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState icon={Search} title="No courses yet" description="Courses will appear here once they're created." />
              </Card>
            )}
          </div>
        )}

        {activeTab === 'calendar' && <CalendarMonthView />}

        {activeTab === 'members' && <MembersList members={members || []} />}

        {activeTab === 'leaderboards' && (
          <Leaderboard entries={leaderboardLoading ? [] : leaderboard || []} />
        )}

        {activeTab === 'about' && (
          <div className="max-w-3xl">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About {community.name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {community.description || 'No description provided yet.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Members</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {community.memberCount || community._count?.members || 0}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Posts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{community._count?.posts || 0}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatDate(community.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
