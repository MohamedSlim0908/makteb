import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiCheck, HiChevronDown, HiChevronRight, HiPlay } from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import axios from 'axios';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  creator: {
    id: string;
    name: string;
    avatar: string | null;
  };
  modules: Module[];
}

interface Progress {
  completedLessonIds: string[];
  totalLessons: number;
}

export function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await api.get<Course>(`/courses/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ['course-progress', id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Progress>(`/courses/${id}/progress`);
        return data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!id,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/courses/${id}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', id] });
      toast.success('Enrolled successfully!');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => api.post(`/lessons/${lessonId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', id] });
      toast.success('Lesson marked complete');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to mark complete');
    },
  });

  const isEnrolled = !!progress;
  const completedIds = new Set(progress?.completedLessonIds ?? []);
  const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const completedCount = completedIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const currentLesson = course?.modules.flatMap((m) => m.lessons).find((l) => l.id === currentLessonId);
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
            <p className="text-gray-600 mb-6">{course.description || 'No description'}</p>
            <div className="flex items-center gap-2 mb-6">
              <Avatar src={course.creator.avatar} name={course.creator.name} size="sm" />
              <span className="text-sm text-gray-600">{course.creator.name}</span>
            </div>

            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">Course content</h2>
              <div className="space-y-2">
                {course.modules
                  .sort((a, b) => a.order - b.order)
                  .map((mod) => (
                    <div key={mod.id}>
                      <div className="text-sm font-medium text-gray-700 py-1">{mod.title}</div>
                      <ul className="ml-4 space-y-1 text-sm text-gray-500">
                        {mod.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((l) => (
                            <li key={l.id}>• {l.title}</li>
                          ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">
                {course.price === 0 ? 'Free' : `$${course.price}`}
              </span>
              <Button onClick={() => enrollMutation.mutate()} isLoading={enrollMutation.isPending}>
                Enroll
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const selectLesson = (lessonId: string) => {
    setCurrentLessonId(lessonId);
  };

  const effectiveLessonId = currentLessonId || firstLessonId;
  const effectiveLesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === effectiveLessonId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 truncate">{course.title}</h2>
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
                    {isExpanded ? (
                      <HiChevronDown className="w-4 h-4" />
                    ) : (
                      <HiChevronRight className="w-4 h-4" />
                    )}
                    {mod.title}
                  </button>
                  {isExpanded && (
                    <ul className="ml-4 space-y-0.5">
                      {lessons.map((l) => (
                        <li key={l.id}>
                          <button
                            onClick={() => selectLesson(l.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                              effectiveLessonId === l.id
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {completedIds.has(l.id) ? (
                              <HiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <HiPlay className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
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
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
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
                    <video
                      src={effectiveLesson.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>
              )}
              {effectiveLesson.content && (
                <div className="prose prose-gray max-w-none mb-6 whitespace-pre-wrap">
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
                    <HiCheck className="w-4 h-4 mr-2" />
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
