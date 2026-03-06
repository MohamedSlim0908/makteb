import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  Pencil,
  Plus,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { useCommunities } from '../features/community/useCommunities';
import { useCreateCommunity } from '../features/community/useCreateCommunity';
import { useCourses } from '../features/courses/useCourses';
import { useCreateCourse } from '../features/courses/useCreateCourse';
import { useCreateModule } from '../features/courses/useCreateModule';
import { useCreateLesson } from '../features/courses/useCreateLesson';
import { useEarnings } from '../features/payments/useEarnings';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Private' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'No category' },
  { value: 'hobbies', label: 'Hobbies' },
  { value: 'music', label: 'Music' },
  { value: 'money', label: 'Money' },
  { value: 'spirituality', label: 'Spirituality' },
  { value: 'tech', label: 'Tech' },
  { value: 'health', label: 'Health' },
  { value: 'sports', label: 'Sports' },
  { value: 'self-improvement', label: 'Self-improvement' },
];

function CourseModules({ courseId, isExpanded, showAddLesson, setShowAddLesson, lessonForm, setLessonForm, createLessonMutation }) {
  const { data: courseData } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}`);
      return data;
    },
    enabled: isExpanded,
  });

  const modules = courseData?.course?.modules ?? [];

  if (!isExpanded) return null;

  return (
    <div className="p-4 border-t border-gray-100 space-y-3">
      {modules.length === 0 ? (
        <p className="text-sm text-gray-400">No modules yet.</p>
      ) : (
        modules
          .sort((a, b) => a.order - b.order)
          .map((mod) => (
            <div key={mod.id} className="pl-4 border-l-2 border-gray-200">
              <div className="font-medium text-gray-700 text-sm mb-2">{mod.title}</div>
              {showAddLesson === mod.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (lessonForm.title.trim()) {
                      createLessonMutation.mutate(
                        {
                          moduleId: mod.id,
                          title: lessonForm.title.trim(),
                          content: lessonForm.content || undefined,
                          videoUrl: lessonForm.videoUrl || undefined,
                        },
                        {
                          onSuccess: () => {
                            setShowAddLesson(null);
                            setLessonForm({ title: '', content: '', videoUrl: '' });
                            toast.success('Lesson added!');
                          },
                        }
                      );
                    }
                  }}
                  className="space-y-2 mb-2"
                >
                  <Input placeholder="Lesson title" value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} />
                  <Input placeholder="Video URL (optional)" value={lessonForm.videoUrl} onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" isLoading={createLessonMutation.isPending}>Add</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddLesson(null)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setShowAddLesson(mod.id)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Lesson
                </Button>
              )}
            </div>
          ))
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(null);
  const [showAddModule, setShowAddModule] = useState(null);
  const [showAddLesson, setShowAddLesson] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  const [communityForm, setCommunityForm] = useState({ name: '', description: '', visibility: 'PUBLIC', category: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: 0 });
  const [moduleForm, setModuleForm] = useState({ title: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', videoUrl: '' });

  const { data: communitiesData, isLoading: communitiesLoading } = useCommunities();

  const myCommunities = communitiesData?.communities?.filter(
    (c) => (c.creatorId ?? c.creator?.id) === user?.id
  ) ?? [];
  const hasCommunities = myCommunities.length > 0;
  const activeCommunityId = selectedCommunity || myCommunities[0]?.id;

  const { data: courses = [], isLoading: coursesLoading } = useCourses(activeCommunityId);

  const { data: earnings } = useEarnings(activeCommunityId);

  const createCommunityMutation = useCreateCommunity();
  const createCourseMutation = useCreateCourse(activeCommunityId);
  const createModuleMutation = useCreateModule(activeCommunityId);
  const createLessonMutation = useCreateLesson(activeCommunityId);

  if (communitiesLoading) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="h-8 bg-gray-100 rounded w-40 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg w-36 animate-pulse" />)}
          </div>
          <Skeleton variant="dashboard" />
          <Skeleton variant="dashboard" />
        </div>
      </div>
    );
  }

  if (!hasCommunities) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
        <div className="max-w-xl mx-auto px-4 py-16">
          <EmptyState
            icon={Users}
            title="Create your first community"
            description="Communities let you organize courses and connect with learners."
            action={
              showCreateCommunity ? null : (
                <Button onClick={() => setShowCreateCommunity(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Community
                </Button>
              )
            }
          />

          {showCreateCommunity && (
            <form
              onSubmit={(e) => { e.preventDefault(); createCommunityMutation.mutate(communityForm, {
                onSuccess: () => {
                  setShowCreateCommunity(false);
                  setCommunityForm({ name: '', description: '', visibility: 'PUBLIC', category: '' });
                  toast.success('Community created!');
                },
              }); }}
              className="mt-8 space-y-4 max-w-sm mx-auto"
            >
              <Input label="Name" value={communityForm.name} onChange={(e) => setCommunityForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Community" required />
              <Input label="Description" value={communityForm.description} onChange={(e) => setCommunityForm((f) => ({ ...f, description: e.target.value }))} placeholder="A brief description..." />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
                <select
                  value={communityForm.visibility}
                  onChange={(e) => setCommunityForm((f) => ({ ...f, visibility: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 transition-colors"
                >
                  {VISIBILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={communityForm.category}
                  onChange={(e) => setCommunityForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 transition-colors"
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" isLoading={createCommunityMutation.isPending}>Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateCommunity(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Community Selector */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Your Communities</p>
          <div className="flex flex-wrap gap-2">
            {myCommunities.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCommunity(c.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  activeCommunityId === c.id
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c.name}
                <span className={`text-xs ${activeCommunityId === c.id ? 'text-gray-300' : 'text-gray-400'}`}>
                  {c.memberCount || c._count?.members || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Courses */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Courses</h2>
              <Button size="sm" onClick={() => setShowAddCourse(activeCommunityId)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Course
              </Button>
            </div>
            <div className="p-5 space-y-4">
              {showAddCourse === activeCommunityId && (
                <form
                  onSubmit={(e) => { e.preventDefault(); createCourseMutation.mutate(courseForm, {
                    onSuccess: () => {
                      setShowAddCourse(null);
                      setCourseForm({ title: '', description: '', price: 0 });
                      toast.success('Course added!');
                    },
                  }); }}
                  className="p-4 bg-gray-50 rounded-xl space-y-3"
                >
                  <Input label="Course title" value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} placeholder="Introduction to..." required />
                  <Input label="Description" value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
                  <Input label="Price ($)" type="number" min={0} value={courseForm.price || ''} onChange={(e) => setCourseForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" isLoading={createCourseMutation.isPending}>Add</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCourse(null)}>Cancel</Button>
                  </div>
                </form>
              )}

              {coursesLoading && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="h-4 bg-gray-100 rounded w-48" />
                        <div className="h-3 bg-gray-100 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!coursesLoading && courses.length === 0 && !showAddCourse && (
                <p className="text-sm text-gray-400 py-4 text-center">No courses yet.</p>
              )}

              {courses.map((course) => {
                const isExpanded = expandedCourses[course.id] ?? false;
                return (
                  <div key={course.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedCourses((prev) => ({ ...prev, [course.id]: !prev[course.id] }))}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <span className="font-semibold text-gray-900 text-sm">{course.title}</span>
                        <span className="text-xs text-gray-400">{course._count?.modules ?? 0} modules</span>
                      </div>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => setShowAddModule(showAddModule === course.id ? null : course.id)}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Module
                        </Button>
                        <Link to={`/course/${course.id}`}>
                          <Button size="sm" variant="ghost" type="button">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {showAddModule === course.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (moduleForm.title.trim()) createModuleMutation.mutate({ courseId: course.id, title: moduleForm.title.trim() }, {
                            onSuccess: () => {
                              setShowAddModule(null);
                              setModuleForm({ title: '' });
                              toast.success('Module added!');
                            },
                          });
                        }}
                        className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2"
                      >
                        <Input placeholder="Module title" value={moduleForm.title} onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))} className="flex-1" />
                        <Button type="submit" size="sm" isLoading={createModuleMutation.isPending}>Add</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModule(null)}>Cancel</Button>
                      </form>
                    )}

                    <CourseModules
                      courseId={course.id}
                      isExpanded={isExpanded}
                      showAddLesson={showAddLesson}
                      setShowAddLesson={setShowAddLesson}
                      lessonForm={lessonForm}
                      setLessonForm={setLessonForm}
                      createLessonMutation={createLessonMutation}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Earnings */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                Earnings
              </h2>
            </div>
            <div className="p-5">
              {earnings ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</div>
                      <div className="text-xl font-bold text-gray-900 mt-1">{Number(earnings.totalEarnings).toFixed(2)} TND</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fees</div>
                      <div className="text-xl font-bold text-gray-900 mt-1">{Number(earnings.platformFee).toFixed(2)} TND</div>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Net</div>
                      <div className="text-xl font-bold text-white mt-1">{Number(earnings.netEarnings).toFixed(2)} TND</div>
                    </div>
                  </div>

                  {earnings.payments?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase">Date</th>
                            <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase">Amount</th>
                            <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase">Type</th>
                            <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnings.payments.map((p) => (
                            <tr key={p.id} className="border-b border-gray-50">
                              <td className="py-2.5 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td className="py-2.5 text-gray-900">{Number(p.amount).toFixed(2)} TND</td>
                              <td className="py-2.5 text-gray-500">{p.type}</td>
                              <td className="py-2.5 font-semibold text-gray-900">{p.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Loading earnings...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
