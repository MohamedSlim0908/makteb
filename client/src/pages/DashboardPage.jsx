import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HiPlus,
  HiPencil,
  HiChevronDown,
  HiChevronRight,
  HiCurrencyDollar,
  HiUserGroup,
} from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Private' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(null);
  const [showAddModule, setShowAddModule] = useState(null);
  const [showAddLesson, setShowAddLesson] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  const [communityForm, setCommunityForm] = useState({ name: '', description: '', visibility: 'PUBLIC' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: 0 });
  const [moduleForm, setModuleForm] = useState({ title: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', videoUrl: '' });

  const { data: communitiesData } = useQuery({
    queryKey: ['communities', 'dashboard'],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      const { data } = await api.get(`/communities?${params}`);
      return data;
    },
  });

  const myCommunities =
    communitiesData?.communities?.filter(
      (c) => (c.creatorId ?? c.creator?.id) === user?.id
    ) ?? [];
  const hasCommunities = myCommunities.length > 0;
  const activeCommunityId = selectedCommunity || myCommunities[0]?.id;

  const { data: coursesData } = useQuery({
    queryKey: ['courses', activeCommunityId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/community/${activeCommunityId}`);
      return data;
    },
    enabled: !!activeCommunityId,
  });

  const courses = coursesData?.courses ?? [];

  const { data: earnings } = useQuery({
    queryKey: ['earnings', activeCommunityId],
    queryFn: async () => {
      const { data } = await api.get(`/payments/earnings/${activeCommunityId}`);
      return data;
    },
    enabled: !!activeCommunityId,
  });

  const createCommunityMutation = useMutation({
    mutationFn: (body) => api.post('/communities', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      setShowCreateCommunity(false);
      setCommunityForm({ name: '', description: '', visibility: 'PUBLIC' });
      toast.success('Community created!');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create community');
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (body) =>
      api.post(`/courses`, { ...body, communityId: activeCommunityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', activeCommunityId] });
      setShowAddCourse(null);
      setCourseForm({ title: '', description: '', price: 0 });
      toast.success('Course added!');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add course');
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: ({ courseId, title }) =>
      api.post(`/courses/${courseId}/modules`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', activeCommunityId] });
      setShowAddModule(null);
      setModuleForm({ title: '' });
      toast.success('Module added!');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add module');
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ moduleId, title, content, videoUrl }) =>
      api.post('/lessons', { moduleId, title, content, videoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', activeCommunityId] });
      setShowAddLesson(null);
      setLessonForm({ title: '', content: '', videoUrl: '' });
      toast.success('Lesson added!');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add lesson');
    },
  });

  if (!user) return null;

  if (!hasCommunities) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your first community</h1>
            <p className="text-gray-600 mb-6">
              Communities let you organize courses and connect with learners. Create one to get started.
            </p>

            {showCreateCommunity ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCommunityMutation.mutate(communityForm);
                }}
                className="space-y-4"
              >
                <Input
                  label="Name"
                  value={communityForm.name}
                  onChange={(e) => setCommunityForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="My Community"
                  required
                />
                <Input
                  label="Description"
                  value={communityForm.description}
                  onChange={(e) => setCommunityForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="A brief description..."
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                  <select
                    value={communityForm.visibility}
                    onChange={(e) =>
                      setCommunityForm((f) => ({ ...f, visibility: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {VISIBILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" isLoading={createCommunityMutation.isPending}>
                    Create Community
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateCommunity(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setShowCreateCommunity(true)}>
                <HiPlus className="w-5 h-5 mr-2" />
                Create Community
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Creator Dashboard</h1>

        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">Your Communities</h2>
          <div className="flex flex-wrap gap-2">
            {myCommunities.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCommunity(c.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  activeCommunityId === c.id
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HiUserGroup className="w-4 h-4" />
                {c.name}
                <span className="text-gray-500">({c.memberCount} members)</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Courses</h2>
              <Button
                size="sm"
                onClick={() => setShowAddCourse(activeCommunityId)}
              >
                <HiPlus className="w-4 h-4 mr-1" />
                Add Course
              </Button>
            </div>

            {showAddCourse === activeCommunityId && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCourseMutation.mutate(courseForm);
                }}
                className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3"
              >
                <Input
                  label="Course title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Introduction to..."
                  required
                />
                <Input
                  label="Description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                />
                <Input
                  label="Price ($)"
                  type="number"
                  min={0}
                  value={courseForm.price || ''}
                  onChange={(e) =>
                    setCourseForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))
                  }
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" isLoading={createCourseMutation.isPending}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCourse(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {courses.map((course) => {
                const isExpanded = expandedCourses[course.id] ?? false;
                const modules = course.modules ?? [];
                return (
                  <div
                    key={course.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                      onClick={() =>
                        setExpandedCourses((prev) => ({ ...prev, [course.id]: !prev[course.id] }))
                      }
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <HiChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <HiChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <span className="font-medium text-gray-900">{course.title}</span>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setShowAddModule(showAddModule === course.id ? null : course.id)
                          }
                        >
                          <HiPlus className="w-4 h-4 mr-1" />
                          Module
                        </Button>
                        <Link to={`/course/${course.id}`}>
                          <Button size="sm" variant="ghost" type="button">
                            <HiPencil className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {showAddModule === course.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (moduleForm.title.trim()) {
                            createModuleMutation.mutate({
                              courseId: course.id,
                              title: moduleForm.title.trim(),
                            });
                          }
                        }}
                        className="p-4 border-t border-gray-200 bg-white flex gap-2"
                      >
                        <Input
                          placeholder="Module title"
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
                          className="flex-1"
                        />
                        <Button type="submit" size="sm" isLoading={createModuleMutation.isPending}>
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddModule(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    )}

                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200 space-y-3">
                        {modules.length === 0 ? (
                          <p className="text-sm text-gray-500">No modules yet. Add one above.</p>
                        ) : (
                          modules
                            .sort((a, b) => a.order - b.order)
                            .map((mod) => (
                              <div
                                key={mod.id}
                                className="pl-4 border-l-2 border-gray-200"
                              >
                                <div className="font-medium text-gray-700 mb-2">{mod.title}</div>
                                {showAddLesson === mod.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (lessonForm.title.trim()) {
                                        createLessonMutation.mutate({
                                          moduleId: mod.id,
                                          title: lessonForm.title.trim(),
                                          content: lessonForm.content || undefined,
                                          videoUrl: lessonForm.videoUrl || undefined,
                                        });
                                      }
                                    }}
                                    className="space-y-2 mb-2"
                                  >
                                    <Input
                                      placeholder="Lesson title"
                                      value={lessonForm.title}
                                      onChange={(e) =>
                                        setLessonForm((f) => ({ ...f, title: e.target.value }))
                                      }
                                    />
                                    <Input
                                      placeholder="Video URL (optional)"
                                      value={lessonForm.videoUrl}
                                      onChange={(e) =>
                                        setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))
                                      }
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        type="submit"
                                        size="sm"
                                        isLoading={createLessonMutation.isPending}
                                      >
                                        Add
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAddLesson(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </form>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowAddLesson(mod.id)}
                                  >
                                    <HiPlus className="w-4 h-4 mr-1" />
                                    Add Lesson
                                  </Button>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiCurrencyDollar className="w-5 h-5" />
              Earnings
            </h2>
            {earnings ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-xl font-bold text-gray-900">
                      ${(earnings.totalEarnings / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Fees (10%)</div>
                    <div className="text-xl font-bold text-gray-900">
                      ${(earnings.totalFees / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <div className="text-sm text-primary-600">Net</div>
                    <div className="text-xl font-bold text-primary-700">
                      ${(earnings.netEarnings / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recent payments</h3>
                  {earnings.payments?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2">Amount</th>
                            <th className="text-left py-2">Fee</th>
                            <th className="text-left py-2">Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnings.payments.map((p) => (
                            <tr key={p.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2">${(p.amount / 100).toFixed(2)}</td>
                              <td className="py-2 text-gray-600">${(p.fee / 100).toFixed(2)}</td>
                              <td className="py-2 font-medium">${(p.netAmount / 100).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No payments yet.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500">Loading earnings...</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
