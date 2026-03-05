import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Play, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import axios from 'axios';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function CourseLearnPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedModules, setExpandedModules] = useState({});
  const [currentLessonId, setCurrentLessonId] = useState(null);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${id}`);
      return data.course;
    },
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ['course-progress', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/courses/${id}/progress`);
        return data.enrollment;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!id,
    retry: false,
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId) => api.post(`/lessons/${lessonId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', id] });
      toast.success('Lesson completed!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to mark complete'),
  });

  if (!user) { navigate('/login'); return null; }
  if (courseLoading || !course) return <PageSpinner />;

  const isEnrolled = !!progress;
  const completedIds = new Set(progress?.completedLessons ?? []);
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  if (!isEnrolled) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <div className="p-8">
            <EmptyState
              title={course.title}
              description="You need to enroll from the course community page before accessing lessons."
              action={
                <Button onClick={() => navigate(`/course/${id}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Course Community
                </Button>
              }
            />
          </div>
        </Card>
      </div>
    );
  }

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const effectiveLessonId = currentLessonId || firstLessonId;
  const effectiveLesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === effectiveLessonId);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto hidden md:block">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 truncate text-sm">{course.title}</h2>
          <Link to={`/course/${id}`} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Back to Community
          </Link>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 transition-all rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <nav className="p-2">
          {course.modules
            .sort((a, b) => a.order - b.order)
            .map((mod) => {
              const isExpanded = expandedModules[mod.id] ?? true;
              const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
              return (
                <div key={mod.id} className="mb-1">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    <span className="truncate">{mod.title}</span>
                  </button>
                  {isExpanded && (
                    <ul className="ml-4 space-y-0.5">
                      {lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <button
                            onClick={() => setCurrentLessonId(lesson.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                              effectiveLessonId === lesson.id
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {completedIds.has(lesson.id) ? (
                              <Check className="w-4 h-4 text-success-600 flex-shrink-0" />
                            ) : (
                              <Play className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <Avatar src={course.creator?.avatar} name={course.creator?.name} size="sm" />
            <div className="flex-1">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
              {completedCount} / {totalLessons} lessons
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {effectiveLesson ? (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{effectiveLesson.title}</h2>

              {effectiveLesson.videoUrl && (
                <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
                  {effectiveLesson.videoUrl.includes('youtube.com') || effectiveLesson.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={
                        effectiveLesson.videoUrl.includes('youtu.be/')
                          ? `https://www.youtube.com/embed/${effectiveLesson.videoUrl.split('/').pop()}`
                          : effectiveLesson.videoUrl.replace('watch?v=', 'embed/')
                      }
                      title={effectiveLesson.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={effectiveLesson.videoUrl} controls className="w-full h-full" />
                  )}
                </div>
              )}

              {effectiveLesson.content && (
                <div className="max-w-none mb-6 whitespace-pre-wrap text-gray-600 leading-relaxed">
                  {effectiveLesson.content}
                </div>
              )}

              {!effectiveLesson.content && !effectiveLesson.videoUrl && (
                <p className="text-gray-400 mb-6">No content for this lesson yet.</p>
              )}

              <Button
                onClick={() => completeMutation.mutate(effectiveLesson.id)}
                disabled={completedIds.has(effectiveLesson.id)}
                isLoading={completeMutation.isPending}
                variant={completedIds.has(effectiveLesson.id) ? 'secondary' : 'primary'}
              >
                {completedIds.has(effectiveLesson.id) ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  'Mark Complete'
                )}
              </Button>
            </div>
          ) : (
            <EmptyState title="Select a lesson" description="Choose a lesson from the sidebar to start learning." />
          )}
        </div>
      </main>
    </div>
  );
}
