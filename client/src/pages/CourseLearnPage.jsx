import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
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
      toast.success('Lesson marked complete');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to mark complete');
    },
  });

  const isEnrolled = !!progress;
  const completedIds = new Set(progress?.completedLessons ?? []);
  const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const completedCount = completedIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const firstLessonId = course?.modules[0]?.lessons[0]?.id;

  if (!user) {
    navigate('/login');
    return null;
  }

  if (courseLoading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading course...</div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-6">
              You need to enroll from the course community page before accessing lessons.
            </p>
            <Button onClick={() => navigate(`/course/${id}`)}>Go to Course Community</Button>
          </div>
        </div>
      </div>
    );
  }

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const effectiveLessonId = currentLessonId || firstLessonId;
  const effectiveLesson = course.modules.flatMap((m) => m.lessons).find((lesson) => lesson.id === effectiveLessonId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 truncate">{course.title}</h2>
          <Link to={`/course/${id}`} className="text-xs text-primary-600 hover:underline">
            Back to Community
          </Link>
        </div>
        <nav className="p-2">
          {course.modules
            .sort((a, b) => a.order - b.order)
            .map((mod) => {
              const isExpanded = expandedModules[mod.id] ?? true;
              const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
              return (
                <div key={mod.id} className="mb-2">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {mod.title}
                  </button>
                  {isExpanded && (
                    <ul className="ml-4 space-y-0.5">
                      {lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <button
                            onClick={() => setCurrentLessonId(lesson.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                              effectiveLessonId === lesson.id
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {completedIds.has(lesson.id) ? (
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
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

      <main className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <Avatar src={course.creator?.avatar} name={course.creator?.name} size="sm" />
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {completedCount} / {totalLessons} lessons
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {effectiveLesson ? (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{effectiveLesson.title}</h2>
              {effectiveLesson.videoUrl && (
                <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video">
                  {effectiveLesson.videoUrl.includes('youtube.com') ||
                  effectiveLesson.videoUrl.includes('youtu.be') ? (
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
                <div className="max-w-none mb-6 whitespace-pre-wrap text-gray-700">
                  {effectiveLesson.content}
                </div>
              )}
              {!effectiveLesson.content && !effectiveLesson.videoUrl && (
                <p className="text-gray-500 mb-6">No content for this lesson yet.</p>
              )}
              <Button
                onClick={() => completeMutation.mutate(effectiveLesson.id)}
                disabled={completedIds.has(effectiveLesson.id)}
                isLoading={completeMutation.isPending}
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
            <p className="text-gray-500">Select a lesson to start.</p>
          )}
        </div>
      </main>
    </div>
  );
}
