import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CheckCircle2,
  Link2,
  Lock,
  MessageCircle,
  Search,
  Tag,
  UserRound,
  Users,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSpinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { PostCard } from '../components/course-community/PostCard';
import { PostComposer } from '../components/course-community/PostComposer';
import { Leaderboard } from '../components/course-community/Leaderboard';
import { MembersList } from '../components/course-community/MembersList';
import { CalendarMonthView } from '../components/course-community/CalendarMonthView';
import { POST_CATEGORIES } from '../components/course-community/mockData';
import { PaginationNavigation } from '../components/ui/PaginationNavigation';
import { isRichTextEmpty } from '../lib/richText';

const PAGE_SIZE = 10;

const TABS = [
  { id: 'community', label: 'Community' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'members', label: 'Members' },
  { id: 'leaderboards', label: 'Leaderboards' },
  { id: 'about', label: 'About' },
];
const PUBLIC_TAB_IDS = new Set(['about']);

function getAvailableTabs(isMember) {
  if (isMember) return TABS;
  return TABS.filter((tab) => PUBLIC_TAB_IDS.has(tab.id));
}

function formatPrice(value) {
  const amount = Number(value);
  if (!amount) return 'Free';
  return `$${amount}/month`;
}


export function CommunityPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const feedTopRef = useRef(null);
  const requestedTab = searchParams.get('tab');

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
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['membership', communityId, user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/membership`);
      return data.membership ?? null;
    },
    enabled: !!communityId && !!user,
    retry: false,
  });

  const isMember = membership?.status ? membership.status === 'ACTIVE' : Boolean(membership);
  const memberRole = membership?.role;
  const availableTabs = useMemo(() => getAvailableTabs(isMember), [isMember]);
  const defaultTab = availableTabs[0]?.id || 'about';
  const activeTab = availableTabs.some((tab) => tab.id === requestedTab) ? requestedTab : defaultTab;

  // Members
  const { data: members } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data.members;
    },
    enabled: !!communityId && isMember,
  });

  const { data: postsData, isLoading: postsLoading, isFetching: postsFetching } = useQuery({
    queryKey: ['community-posts', communityId, activeCategory, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (activeCategory !== 'ALL') params.set('category', activeCategory);
      const { data } = await api.get(`/posts/community/${communityId}?${params}`);
      return data;
    },
    enabled: !!communityId && isMember && activeTab === 'community',
    placeholderData: keepPreviousData,
  });

  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 0;
  const isPageTransitioning = postsFetching && !postsLoading;

  // Leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['community-leaderboard', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${communityId}`);
      return data.leaderboard;
    },
    enabled: !!communityId && isMember,
  });

  // Courses
  const { data: courses } = useQuery({
    queryKey: ['community-courses', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/community/${communityId}`);
      return data.courses;
    },
    enabled: !!communityId && (activeTab === 'about' || (isMember && activeTab === 'classroom')),
  });

  const featuredCourse = courses?.[0] ?? null;
  const featuredCoverImage = featuredCourse?.coverImage || community?.coverImage || null;
  const featuredTitle = featuredCourse?.title || community?.name || 'Community';
  const featuredDescription =
    featuredCourse?.description ||
    community?.description ||
    'Learn with this community and unlock the full member experience.';
  const featuredCreator = featuredCourse?.creator?.name || community?.creator?.name || 'Community creator';
  const featuredPrice = featuredCourse?.price ?? community?.price ?? 0;
  const memberCount = community?.memberCount || community?._count?.members || 0;
  const moduleCount = featuredCourse?._count?.modules || 0;
  const adminCount = members?.filter((member) => ['OWNER', 'ADMIN'].includes(member.role)).length || 1;
  const onlineCount = Math.max(
    1,
    isMember
      ? Math.round((members?.length || memberCount) * 0.08)
      : Math.round((memberCount || 1) * 0.02)
  );
  const descriptionParagraphs = featuredDescription
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  useEffect(() => {
    if (requestedTab !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, requestedTab, searchParams, setSearchParams]);

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
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      setPostTitle('');
      setPostContent('');
      setPostCategory('');
      feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  function handleTabChange(tabId) {
    const nextTab = availableTabs.some((tab) => tab.id === tabId) ? tabId : defaultTab;
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    setSearchParams(next);
  }

  function handleCreatePost() {
    if (!isMember) { toast.error('Join the community to post.'); return; }
    if (!postTitle.trim() || isRichTextEmpty(postContent)) return;
    createPostMutation.mutate({
      communityId,
      title: postTitle.trim(),
      content: postContent,
      type: 'DISCUSSION',
      category: postCategory || undefined,
    });
  }

  function handleCategoryChange(nextCategory) {
    setActiveCategory(nextCategory);
    setPage(1);
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleLike(postId) {
    if (!user) { toast.error('Sign in to like posts.'); return; }
    if (!isMember) { toast.error('Join the community to interact.'); return; }
    likeMutation.mutate(postId);
  }

  function handleAboutPrimaryAction() {
    if (isMember) {
      handleTabChange('community');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    joinMutation.mutate();
  }

  if (communityLoading || (user && membershipLoading)) return <PageSpinner />;
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
        <div className="appContainer py-6">
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
      </div>

      {/* Content */}
      <div className="appContainer py-6">
        {activeTab === 'community' && (
          <div className="space-y-4">
            {isMember && user && (
              <div className="lg:pr-[384px]">
                <PostComposer
                  user={user}
                  contextName={community.name}
                  title={postTitle}
                  content={postContent}
                  category={postCategory}
                  onTitleChange={setPostTitle}
                  onContentChange={setPostContent}
                  onCategoryChange={setPostCategory}
                  onSubmit={handleCreatePost}
                  isSubmitting={createPostMutation.isPending}
                />
              </div>
            )}

            <div className="communityGrid">
              <div className="space-y-4 min-w-0">
                <div ref={feedTopRef} className="scroll-mt-24" />

                {/* Category Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {POST_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryChange(cat.value)}
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

                {isPageTransitioning && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    <span>Loading posts...</span>
                  </div>
                )}

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
                        currentUserId={user?.id}
                        memberRole={memberRole}
                      />
                    ))}

                    <PaginationNavigation
                      page={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
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
              <aside className="space-y-4 communitySidebar">
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
                          onClick={() => handleTabChange('members')}
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
                          onClick={() => handleTabChange('leaderboards')}
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
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{community.name}</h2>
              <p className="text-base sm:text-lg text-gray-600 mt-1">{featuredTitle}</p>

              <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-black aspect-[16/9]">
                {featuredCoverImage ? (
                  <img src={featuredCoverImage} alt={featuredTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700" />
                )}
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(courses && courses.length > 0 ? courses.slice(0, 6) : [featuredCourse]).map((course, index) => (
                  <div
                    key={course?.id || `preview-${index}`}
                    className="min-w-[128px] rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
                  >
                    <div className="h-16 bg-gray-100">
                      {course?.coverImage ? (
                        <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                      )}
                    </div>
                    <p className="px-2 py-1.5 text-[11px] font-medium text-gray-600 truncate">
                      {course?.title || `Preview ${index + 1}`}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-gray-200 pt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-gray-400" />
                  {community.visibility === 'PRIVATE' ? 'Private' : 'Public'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  {memberCount.toLocaleString()} members
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {formatPrice(featuredPrice)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="w-4 h-4 text-gray-400" />
                  By {featuredCreator}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
                ) : (
                  <p>Join this community to access courses, members, and all learning resources.</p>
                )}
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900">What You Get</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                    <span>{courses?.length || 0} published courses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                    <span>{moduleCount} modules in the featured course</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                    <span>Private discussions, members list, and leaderboard access</span>
                  </li>
                </ul>
              </div>
            </Card>

            <aside className="lg:sticky lg:top-[84px] self-start space-y-4">
              <Card className="overflow-hidden">
                <div className="h-36 bg-black">
                  {featuredCoverImage ? (
                    <img src={featuredCoverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-2xl font-semibold text-gray-900">{community.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {community.slug ? `makteb.com/${community.slug}` : `makteb.com/community/${community.id}`}
                  </p>
                  <p className="text-sm text-gray-700 mt-4 leading-relaxed line-clamp-4">
                    {featuredDescription}
                  </p>

                  <div className="mt-4 space-y-1.5 text-sm text-gray-500">
                    <p className="inline-flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5" />
                      Community updates
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5" />
                      Coaching resources
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5" />
                      Partner offers
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-semibold text-gray-900">{memberCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Members</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-gray-900">{onlineCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-gray-900">{adminCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Admins</p>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 bg-[#e6c66e] text-gray-900 hover:bg-[#d8b963] focus-visible:ring-yellow-500 font-semibold"
                    onClick={handleAboutPrimaryAction}
                    isLoading={joinMutation.isPending}
                  >
                    {isMember ? 'OPEN COMMUNITY' : 'START FREE TRIAL'}
                  </Button>
                </div>
              </Card>

              <p className="text-center text-xs text-gray-400">
                Powered by <span className="font-semibold text-gray-500">makteb</span>
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
