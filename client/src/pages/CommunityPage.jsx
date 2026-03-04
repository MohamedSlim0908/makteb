import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Heart,
  Link2,
  Map,
  MessageCircle,
  Paperclip,
  Pin,
  Smile,
  Search,
  Users,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

const PAGE_SIZE = 10;
const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'WINS', label: 'Wins' },
  { value: 'BRANDING_CLIENTS', label: 'Branding / Clients' },
  { value: 'WORKFLOW_PRODUCTIVITY', label: 'Workflow / Productivity' },
  { value: 'BANTER', label: 'Banter' },
  { value: 'INTRODUCE_YOURSELF', label: 'Introduce Yourself' },
  { value: 'GENERAL', label: 'General' },
];

const CATEGORY_LABELS = {
  GENERAL: 'General',
  WINS: 'Wins',
  BRANDING_CLIENTS: 'Branding / Clients',
  WORKFLOW_PRODUCTIVITY: 'Workflow / Productivity',
  BANTER: 'Banter',
  INTRODUCE_YOURSELF: 'Introduce Yourself',
};

const TABS = [
  { id: 'community', label: 'Community' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'members', label: 'Members' },
  { id: 'map', label: 'Map' },
  { id: 'leaderboards', label: 'Leaderboards' },
  { id: 'about', label: 'About' },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCategory(value) {
  return CATEGORY_LABELS[value] || 'General';
}

function hoursUntil(nextDate) {
  const diff = new Date(nextDate).getTime() - Date.now();
  return Math.max(1, Math.round(diff / 3_600_000));
}

function buildSupportEmail(slug) {
  if (!slug) return 'support@makteb.com';
  return `${slug.replace(/[^a-z0-9-]/gi, '').toLowerCase()}@gmail.com`;
}

export function CommunityPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('community');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const searchText = '';
  const [showComposer, setShowComposer] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('GENERAL');
  const loadMoreRef = useRef(null);

  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${slug}`);
      return data.community;
    },
    enabled: Boolean(slug),
  });

  const communityId = community?.id;

  const { data: membership } = useQuery({
    queryKey: ['community-membership', communityId, user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/membership`);
      return data.membership;
    },
    enabled: Boolean(communityId && user?.id),
    retry: false,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data.members;
    },
    enabled: Boolean(communityId),
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['community-courses', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/community/${communityId}`);
      return data.courses;
    },
    enabled: Boolean(communityId) && activeTab === 'classroom',
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['community-leaderboard', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${communityId}`);
      return data.leaderboard;
    },
    enabled: Boolean(communityId),
  });

  const {
    data: postsPages,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['community-posts', communityId, activeCategory],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(PAGE_SIZE),
      });
      if (activeCategory !== 'ALL') params.set('category', activeCategory);
      const { data } = await api.get(`/posts/community/${communityId}?${params}`);
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.totalPages || !lastPage?.page) return undefined;
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: Boolean(communityId) && activeTab === 'community',
  });

  useEffect(() => {
    if (activeTab !== 'community') return;
    if (!hasNextPage || isFetchingNextPage) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '320px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-membership', communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      toast.success('Joined community');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to join community');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${communityId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-membership', communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      toast.success('Left community');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to leave community');
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (payload) => api.post('/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId, activeCategory] });
      setShowComposer(false);
      setPostTitle('');
      setPostContent('');
      setPostCategory('GENERAL');
      toast.success('Post published');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to publish post');
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId) => api.post(`/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId, activeCategory] });
      queryClient.invalidateQueries({ queryKey: ['community-leaderboard', communityId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to like post');
    },
  });

  function closeComposer() {
    setShowComposer(false);
    setPostTitle('');
    setPostContent('');
    setPostCategory('GENERAL');
  }

  async function handlePostSubmit(event) {
    event.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    await createPostMutation.mutateAsync({
      communityId,
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      type: 'DISCUSSION',
    });
  }

  async function handleLike(postId) {
    if (!user) {
      toast.error('Sign in to interact with posts');
      return;
    }
    if (!isMember) {
      toast.error('Join community first');
      return;
    }
    await likeMutation.mutateAsync(postId);
  }

  const isMember = Boolean(membership && membership.status !== 'LEFT' && membership.status !== 'BANNED');
  const flattenedPosts = useMemo(
    () => postsPages?.pages?.flatMap((page) => page.posts || []) || [],
    [postsPages]
  );

  const filteredPosts = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const sorted = [...flattenedPosts].sort(
      (a, b) =>
        Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!normalized) return sorted;
    return sorted.filter((post) => {
      const raw = `${post.title || ''} ${post.content || ''} ${post.author?.name || ''}`;
      return raw.toLowerCase().includes(normalized);
    });
  }, [flattenedPosts, searchText]);

  const filteredMembers = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return members;
    return members.filter((member) =>
      `${member.user?.name || ''} ${member.user?.email || ''}`.toLowerCase().includes(normalized)
    );
  }, [members, searchText]);

  const memberCount = members.length || community?._count?.members || 0;
  const adminCount = members.filter((member) => ['OWNER', 'ADMIN'].includes(member.role)).length || 1;
  const onlineCount = Math.max(1, Math.min(9, Math.round(memberCount * 0.08)));

  const upcomingEventAt = useMemo(() => {
    const target = new Date();
    target.setHours(target.getHours() + 44);
    return target;
  }, []);

  const canSubmitPost = postTitle.trim().length > 0 && postContent.trim().length > 0;

  if (communityLoading || !community) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-gray-100 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#f5f5f5]">
      <div className="sticky top-16 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1220px] px-4">
          <div className="flex h-12 items-center gap-6 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-full border-b-2 text-base whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-black font-semibold text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,700px)_320px] lg:justify-between">
        <section className="space-y-4">
          {activeTab === 'community' && (
            <>
              <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${showComposer ? 'relative z-[60] p-4' : 'p-3'}`}>
                {showComposer ? (
                  <form onSubmit={handlePostSubmit} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={user?.avatar} name={user?.name || 'You'} size="sm" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{user?.name || 'You'}</span>{' '}
                        posting in{' '}
                        <span className="font-semibold text-gray-900">{community.name}</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <input
                        value={postTitle}
                        onChange={(event) => setPostTitle(event.target.value)}
                        placeholder="Title"
                        className="w-full border-0 p-0 text-4xl font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      />
                      <textarea
                        value={postContent}
                        onChange={(event) => setPostContent(event.target.value)}
                        placeholder="Write something..."
                        rows={4}
                        className="w-full resize-none border-0 p-0 text-3xl text-gray-800 placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Video className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Smile className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center justify-center rounded-full px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          GIF
                        </button>

                        <label className="relative ml-2 inline-flex h-8 items-center rounded-full px-3 text-sm text-gray-600 hover:bg-gray-100">
                          <select
                            value={postCategory}
                            onChange={(event) => setPostCategory(event.target.value)}
                            className="appearance-none bg-transparent pr-5 text-sm font-medium text-gray-600 outline-none"
                          >
                            {CATEGORY_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-gray-500" />
                        </label>
                      </div>

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={closeComposer}
                          className="h-9 rounded-lg px-4 text-sm font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <Button
                          type="submit"
                          variant="secondary"
                          size="sm"
                          isLoading={createPostMutation.isPending}
                          disabled={!canSubmitPost}
                          className="h-9 min-w-[92px] rounded-md border border-gray-200 bg-gray-200 px-4 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-300"
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        toast.error('Sign in to create posts');
                        return;
                      }
                      if (!isMember) {
                        toast.error('Join the community to post');
                        return;
                      }
                      setShowComposer(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors hover:bg-gray-50"
                  >
                    <Avatar src={user?.avatar} name={user?.name || 'You'} size="md" />
                    <span className="text-lg font-medium text-gray-500">Write something</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                <span>
                  Editing feedback is happening in {hoursUntil(upcomingEventAt)} hours
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActiveCategory(option.value)}
                    className={`h-9 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors ${
                      activeCategory === option.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((value) => (
                    <div
                      key={value}
                      className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white"
                    />
                  ))}
                </div>
              ) : filteredPosts.length ? (
                <div className="space-y-3">
                  {filteredPosts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar src={post.author?.avatar} name={post.author?.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-gray-900">
                              {post.author?.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {formatDate(post.createdAt)} - {formatCategory(post.category)}
                            </p>
                          </div>
                        </div>
                        {post.pinned && (
                          <div className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                            <Pin className="h-3.5 w-3.5" />
                            Pinned
                          </div>
                        )}
                      </div>

                      <Link to={`/post/${post.id}`} className="mt-3 block">
                        <h3 className="text-[30px] leading-tight font-bold text-gray-900 sm:text-[32px]">
                          {post.title}
                        </h3>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_120px] sm:items-start">
                          <p className="text-[18px] leading-8 text-gray-700 line-clamp-4">
                            {post.content}
                          </p>
                          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            {community.coverImage ? (
                              <img src={community.coverImage} alt="" className="h-24 w-full object-cover" />
                            ) : (
                              <div className="h-24 w-full bg-gradient-to-br from-gray-100 to-gray-200" />
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-5">
                          <button
                            type="button"
                            onClick={() => handleLike(post.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
                          >
                            <Heart
                              className="h-4 w-4"
                              fill={post.isLiked ? 'currentColor' : 'none'}
                            />
                            {post.likeCount || 0}
                          </button>
                          <Link
                            to={`/post/${post.id}`}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {post.commentCount || 0}
                          </Link>
                        </div>
                        {post.commentCount > 0 && (
                          <p className="text-xs font-medium text-blue-600">New comment activity</p>
                        )}
                      </div>
                    </article>
                  ))}

                  <div ref={loadMoreRef} className="h-5" />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-800 border-t-transparent" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                  <p className="text-lg font-semibold text-gray-900">No posts found</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Try another category or clear the search query.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'classroom' && (
            <div className="space-y-3">
              {coursesLoading ? (
                [1, 2, 3].map((value) => (
                  <div
                    key={value}
                    className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white"
                  />
                ))
              ) : courses.length ? (
                courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {course.description || 'No description available for this course yet.'}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {course.modules?.length || 0} modules
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  No courses available yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">Editing Feedback Session</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {upcomingEventAt.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">Weekly Live Q&A</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(upcomingEventAt.getTime() + 72 * 3_600_000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Members</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredMembers.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={entry.user?.avatar} name={entry.user?.name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{entry.user?.name}</p>
                        <p className="text-xs text-gray-500">{entry.role}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      Joined {formatDate(entry.joinedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <Map className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-lg font-semibold text-gray-900">Community Map</p>
              <p className="mt-1 text-sm text-gray-500">
                Map visualization can be plugged in here.
              </p>
            </div>
          )}

          {activeTab === 'leaderboards' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Leaderboard (30-day)</h3>
              </div>
              {leaderboardLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4].map((value) => (
                    <div key={value} className="h-10 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3 text-left">Rank</th>
                      <th className="px-5 py-3 text-left">Member</th>
                      <th className="px-5 py-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaderboard.map((entry) => (
                      <tr key={entry.user.id}>
                        <td className="px-5 py-3 text-sm text-gray-700">{entry.rank}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar src={entry.user.avatar} name={entry.user.name} size="sm" />
                            <span className="text-sm font-medium text-gray-900">{entry.user.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-semibold text-blue-600">
                          +{entry.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-2xl font-semibold text-gray-900">{community.name}</h3>
              <p className="mt-3 text-gray-700 leading-7">
                {community.description || 'No description provided yet.'}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{memberCount}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Members</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{onlineCount}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Online</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{adminCount}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Admins</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="h-28 bg-black">
              {community.coverImage && (
                <img src={community.coverImage} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-[32px] leading-tight font-semibold text-gray-900">
                {community.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">makteb.com/{community.slug}</p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {community.description || 'We help members learn and grow together.'}
              </p>
              <p className="mt-3 text-sm text-gray-700">Support: {buildSupportEmail(community.slug)}</p>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <a href="#" className="flex items-center gap-1 hover:text-gray-900">
                  <Users className="h-3.5 w-3.5" />
                  New? Start here
                </a>
                <a href="#" className="flex items-center gap-1 hover:text-gray-900">
                  <Search className="h-3.5 w-3.5" />
                  Results page
                </a>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-gray-100 py-3 text-center">
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

              <div className="mt-4 space-y-2">
                {isMember ? (
                  <button
                    type="button"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    INVITE PEOPLE
                  </button>
                ) : (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => joinMutation.mutate()}
                    isLoading={joinMutation.isPending}
                  >
                    JOIN COMMUNITY
                  </Button>
                )}

                {isMember && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => leaveMutation.mutate()}
                    isLoading={leaveMutation.isPending}
                  >
                    LEAVE COMMUNITY
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Leaderboard (30-day)</h4>
              <button
                type="button"
                onClick={() => setActiveTab('leaderboards')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            {leaderboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((value) => (
                  <div key={value} className="h-9 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 4).map((entry) => (
                  <div
                    key={entry.user.id}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-5 text-sm font-semibold text-gray-500">{entry.rank}</span>
                      <Avatar src={entry.user.avatar} name={entry.user.name} size="sm" />
                      <span className="truncate text-sm text-gray-900">{entry.user.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">+{entry.points}</span>
                  </div>
                ))}
                {!leaderboard.length && (
                  <p className="py-3 text-center text-sm text-gray-500">No leaderboard data yet.</p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {showComposer && (
        <button
          type="button"
          aria-label="Close post composer"
          onClick={closeComposer}
          className="fixed inset-0 z-[50] cursor-default bg-black/40"
        />
      )}
    </div>
  );
}
