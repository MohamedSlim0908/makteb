import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HiInformationCircle,
  HiUserGroup,
  HiBookOpen,
  HiPlus,
  HiHeart,
  HiChat,
  HiX,
  HiCalendar,
  HiMap,
  HiChartBar,
  HiHome,
  HiDotsHorizontal,
  HiPaperClip,
  HiEmojiHappy,
  HiVideoCamera,
  HiLockClosed
} from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function CommunityPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('feed');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${slug}`);
      return data;
    },
    enabled: !!slug,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'community', community?.id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/community/${community.id}`);
      return data;
    },
    enabled: !!community?.id && activeTab === 'feed',
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'community', community?.id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/community/${community.id}`);
      return data;
    },
    enabled: !!community?.id && activeTab === 'classroom',
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', community?.id],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${community.id}`);
      return data;
    },
    enabled: !!community?.id && (activeTab === 'leaderboards' || activeTab === 'feed'),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['community-members', community?.id],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${community.id}/members`);
      return data;
    },
    enabled: !!community?.id && (activeTab === 'members' || activeTab === 'about'),
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${community.id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      toast.success('Joined community!');
    },
    onError: () => toast.error('Failed to join'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${community.id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      toast.success('Left community');
    },
    onError: () => toast.error('Failed to leave'),
  });

  const createPostMutation = useMutation({
    mutationFn: (payload) =>
      api.post(`/posts`, { ...payload, communityId: community.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'community', community?.id] });
      setShowNewPostModal(false);
      setNewPostTitle('');
      setNewPostContent('');
      toast.success('Post created!');
    },
    onError: () => toast.error('Failed to create post'),
  });

  function handleCreatePost(e) {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    createPostMutation.mutate({ title: newPostTitle, content: newPostContent });
  }

  const navTabs = [
    { id: 'feed', label: 'Community', icon: null },
    { id: 'classroom', label: 'Classroom', icon: null },
    { id: 'calendar', label: 'Calendar', icon: null },
    { id: 'members', label: 'Members', icon: null },
    { id: 'map', label: 'Map', icon: null },
    { id: 'leaderboards', label: 'Leaderboards', icon: null },
    { id: 'about', label: 'About', icon: null },
  ];

  if (communityLoading || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Secondary Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center gap-6 h-12 overflow-x-auto no-scrollbar">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-sm font-medium whitespace-nowrap h-full border-b-2 transition-colors px-1 ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            <button className="text-gray-400 hover:text-gray-600">
              <HiSearch className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* FEED TAB */}
            {activeTab === 'feed' && (
              <>
                {/* Write Something Input */}
                {community.isMember && user && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
                    <div className="flex gap-3 items-center">
                      <Avatar src={user.avatar} name={user.name} size="md" />
                      <div 
                        onClick={() => setShowNewPostModal(true)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2.5 text-gray-500 text-sm cursor-pointer"
                      >
                        Write something...
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 px-1">
                      <div className="flex gap-4">
                        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs font-medium">
                          <HiVideoCamera className="w-4 h-4 text-gray-400" />
                          Video
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs font-medium">
                          <HiPaperClip className="w-4 h-4 text-gray-400" />
                          Attachment
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs font-medium">
                          <HiChartBar className="w-4 h-4 text-gray-400" />
                          Poll
                        </button>
                      </div>
                      <div className="flex gap-2">
                         <button className="text-gray-400 hover:text-gray-600">
                            <HiEmojiHappy className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                  {['All', 'Wins', 'General', 'Question', 'Announcements'].map((filter, i) => (
                    <button 
                      key={filter}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        i === 0 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Posts List */}
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                        <div className="flex gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 rounded w-1/4" />
                          </div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts?.length ? (
                      posts.map((post) => (
                        <Link
                          key={post.id}
                          to={`/post/${post.id}`}
                          className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={post.author.avatar} name={post.author.name} size="md" />
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">{post.author.name}</h4>
                                <p className="text-xs text-gray-500">
                                  {new Date(post.createdAt).toLocaleDateString()} • General
                                </p>
                              </div>
                            </div>
                            {post.pinned && (
                              <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                <HiPaperClip className="w-3 h-3 transform rotate-45" /> Pinned
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                            {post.content}
                          </p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex gap-4">
                              <button className="flex items-center gap-1.5 text-gray-500 hover:text-pink-500 transition-colors text-sm">
                                <HiHeart className="w-5 h-5" />
                                <span className="font-medium">{post.likeCount}</span>
                              </button>
                              <button className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition-colors text-sm">
                                <HiChat className="w-5 h-5" />
                                <span className="font-medium">{post.commentCount}</span>
                                <span className="hidden sm:inline">comments</span>
                              </button>
                            </div>
                            {post.commentCount > 0 && (
                              <div className="flex -space-x-2">
                                {[...Array(Math.min(3, post.commentCount))].map((_, i) => (
                                  <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <HiChat className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
                        <p className="text-gray-500 mb-4">Be the first to start a conversation!</p>
                        <Button onClick={() => setShowNewPostModal(true)}>Create Post</Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* CLASSROOM TAB */}
            {activeTab === 'classroom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse h-64" />
                  ))
                ) : courses?.length ? (
                  courses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/course/${course.id}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full"
                    >
                      <div className="h-40 bg-gray-200 relative overflow-hidden">
                        {course.coverImage ? (
                          <img src={course.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <HiBookOpen className="w-12 h-12 text-white/20" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                          {course.modules?.length || 0} Modules
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                          {course.description || 'No description available'}
                        </p>
                        
                        <div className="mt-auto">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className="bg-green-500 h-1.5 rounded-full w-[0%]" />
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                            <span>0% complete</span>
                            <span>{course.price ? `$${course.price}` : 'Free'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <p className="text-gray-500">No courses available yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* LEADERBOARDS TAB */}
            {activeTab === 'leaderboards' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Leaderboard</h2>
                  <p className="text-sm text-gray-500">Top contributors this month</p>
                </div>
                {leaderboardLoading ? (
                  <div className="p-6 space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {leaderboard?.map((entry) => (
                        <tr key={entry.user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                              entry.rank === 2 ? 'bg-gray-100 text-gray-700' :
                              entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                              'text-gray-500'
                            }`}>
                              {entry.rank}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar src={entry.user.avatar} name={entry.user.name} size="sm" />
                              <span className="font-medium text-gray-900">{entry.user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-600">
                            {entry.points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                              {entry.levelName}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About {community.name}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {community.description || 'No description provided.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 mb-3 shadow-sm">
                      <HiUserGroup className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{community.memberCount}</div>
                    <div className="text-sm text-gray-500">Active Members</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 mb-3 shadow-sm">
                      <HiBookOpen className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{community.courseCount}</div>
                    <div className="text-sm text-gray-500">Learning Courses</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 mb-3 shadow-sm">
                      <HiChat className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">Active</div>
                    <div className="text-sm text-gray-500">Community Status</div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder Tabs */}
            {(activeTab === 'calendar' || activeTab === 'map' || activeTab === 'members') && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'calendar' && <HiCalendar className="w-8 h-8 text-gray-400" />}
                  {activeTab === 'map' && <HiMap className="w-8 h-8 text-gray-400" />}
                  {activeTab === 'members' && <HiUserGroup className="w-8 h-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 capitalize">{activeTab}</h3>
                <p className="text-gray-500">This feature is coming soon to Makteb.</p>
              </div>
            )}

          </div>

          {/* Right Sidebar (Sticky) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Community Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="h-24 bg-gray-200 relative">
                {community.coverImage ? (
                  <img src={community.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
                )}
              </div>
              <div className="px-6 pb-6 relative">
                <div className="w-20 h-20 bg-white rounded-xl border-4 border-white shadow-sm absolute -top-10 left-6 flex items-center justify-center overflow-hidden">
                   {/* Community Logo Placeholder if no avatar */}
                   <div className="w-full h-full bg-black text-white flex items-center justify-center font-bold text-2xl">
                     {community.name.charAt(0)}
                   </div>
                </div>
                <div className="mt-12">
                  <h3 className="text-xl font-bold text-gray-900">{community.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">makteb.com/{community.slug}</p>
                  
                  <p className="text-sm text-gray-600 mt-4 line-clamp-3">
                    {community.description || 'Welcome to our community! Join us to learn and grow together.'}
                  </p>
                  
                  <div className="flex gap-6 mt-6 border-t border-gray-100 pt-4">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{community.memberCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Members</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">1</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Online</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">1</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Admins</div>
                    </div>
                  </div>

                  {user && (
                    <div className="mt-6">
                      {community.isMember ? (
                        <Button 
                          className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                          onClick={() => {}}
                        >
                          INVITE PEOPLE
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => joinMutation.mutate()}
                          isLoading={joinMutation.isPending}
                        >
                          JOIN COMMUNITY
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mini Leaderboard */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Leaderboard (30-day)</h3>
                <button 
                  onClick={() => setActiveTab('leaderboards')}
                  className="text-xs text-primary-600 font-medium hover:text-primary-700"
                >
                  View all
                </button>
              </div>
              <div className="p-2">
                {leaderboardLoading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
                  </div>
                ) : leaderboard?.slice(0, 5).map((entry, i) => (
                  <div key={entry.user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-100 text-gray-700' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <Avatar src={entry.user.avatar} name={entry.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{entry.user.name}</div>
                    </div>
                    <div className="text-xs font-mono text-primary-600 font-medium">
                      +{entry.points}
                    </div>
                  </div>
                ))}
                {leaderboard?.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4">No data yet</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-400 text-center">
              <p>© 2026 Makteb Inc.</p>
              <div className="flex justify-center gap-3 mt-2">
                <a href="#" className="hover:text-gray-600">Privacy</a>
                <a href="#" className="hover:text-gray-600">Terms</a>
                <a href="#" className="hover:text-gray-600">Help</a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="p-4 space-y-4">
              <Input
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Post Title"
                className="text-lg font-bold border-none px-0 focus:ring-0 placeholder-gray-400"
                required
              />
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share something with the community..."
                rows={6}
                required
                className="w-full resize-none border-none px-0 focus:ring-0 text-gray-600 placeholder-gray-400 text-base"
              />
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2 text-gray-400">
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <HiVideoCamera className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <HiPaperClip className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <HiChartBar className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" type="button" onClick={() => setShowNewPostModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={createPostMutation.isPending}>
                    Post
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
