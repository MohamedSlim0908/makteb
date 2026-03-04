import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HiInformationCircle,
  HiUserGroup,
  HiBookOpen,
  HiPlus,
  HiHeart,
  HiChat,
  HiX,
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
    enabled: !!community?.id && activeTab === 'courses',
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', community?.id],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${community.id}`);
      return data;
    },
    enabled: !!community?.id && activeTab === 'leaderboard',
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['community-members', community?.id],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${community.id}/members`);
      return data;
    },
    enabled: !!community?.id && activeTab === 'about',
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

  const tabs = [
    { id: 'feed', label: 'Feed', icon: <HiChat className="w-4 h-4" /> },
    { id: 'courses', label: 'Courses', icon: <HiBookOpen className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <HiUserGroup className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <HiInformationCircle className="w-4 h-4" /> },
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
      {/* Banner */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        {community.coverImage ? (
          <img src={community.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-800" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">{community.name}</h1>
          <p className="text-white/90 text-sm md:text-base mt-1 line-clamp-2">
            {community.description || 'No description'}
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1">
              <HiUserGroup className="w-4 h-4" />
              {community.memberCount} members
            </span>
            <span className="flex items-center gap-1">
              <HiBookOpen className="w-4 h-4" />
              {community.courseCount} courses
            </span>
          </div>
          {user && (
            <div className="mt-4">
              {community.isMember ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white text-white hover:bg-white/30"
                  onClick={() => leaveMutation.mutate()}
                  isLoading={leaveMutation.isPending}
                >
                  Leave
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-white text-primary-600 hover:bg-white/90"
                  onClick={() => joinMutation.mutate()}
                  isLoading={joinMutation.isPending}
                >
                  Join
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border border-b-0 border-gray-200 text-primary-600 -mb-px'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed tab */}
        {activeTab === 'feed' && (
          <div>
            {community.isMember && user && (
              <Button
                onClick={() => setShowNewPostModal(true)}
                className="mb-6 inline-flex items-center gap-2"
              >
                <HiPlus className="w-5 h-5" />
                New Post
              </Button>
            )}
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
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
                      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex gap-3">
                        <Avatar src={post.author.avatar} name={post.author.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{post.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.content}</p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <HiHeart className="w-4 h-4" />
                              {post.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <HiChat className="w-4 h-4" />
                              {post.commentCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-12">No posts yet. Be the first!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Courses tab */}
        {activeTab === 'courses' && (
          <div>
            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses?.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{course.description}</p>
                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="text-gray-500">{course.enrollmentCount} enrolled</span>
                      <span className="font-medium">
                        {course.price != null ? `$${course.price}` : 'Free'}
                      </span>
                    </div>
                  </Link>
                ))}
                {courses?.length === 0 && (
                  <p className="text-gray-500 col-span-full text-center py-12">No courses yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {leaderboardLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Rank</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Member</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Points</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard?.map((entry) => (
                    <tr key={entry.user.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={entry.user.avatar} name={entry.user.name} size="sm" />
                          {entry.user.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.points}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.levelName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {leaderboard?.length === 0 && !leaderboardLoading && (
              <p className="text-gray-500 text-center py-12">No leaderboard data yet.</p>
            )}
          </div>
        )}

        {/* About tab */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {community.description || 'No description provided.'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Creator</h3>
              <div className="flex items-center gap-3">
                <Avatar src={community.creator.avatar} name={community.creator.name} size="lg" />
                <span className="font-medium">{community.creator.name}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Members</h3>
              {membersLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {members?.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Avatar src={m.avatar} name={m.name} size="sm" />
                      <span className="text-sm text-gray-600">{m.name}</span>
                    </div>
                  ))}
                  {members?.length === 0 && (
                    <p className="text-gray-500">No members yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">New Post</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Input
                label="Title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Post title"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your post..."
                  rows={5}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowNewPostModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createPostMutation.isPending}>
                  Create Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
