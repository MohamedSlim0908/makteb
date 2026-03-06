import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Play, ArrowLeft, CircleCheck, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { useCourse } from '../features/courses/useCourse';
import { useCourseProgress } from '../features/courses/useCourseProgress';
import { useCompleteLesson } from '../features/courses/useCompleteLesson';

export function CourseLearnPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedModules, setExpandedModules] = useState({});
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = useCourse(id);

  const { data: progress } = useCourseProgress(id, user?.id);

  const completeMutation = useCompleteLesson(id);

  if (courseLoading || !course) return <PageSpinner />;

  const isEnrolled = !!progress;
  const completedIds = new Set(progress?.completedLessons ?? []);
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  if (!isEnrolled) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <EmptyState
            title={course.title}
            description="You need to enroll from the course page before accessing lessons."
            action={
              <Button onClick={() => navigate(`/course/${id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Course
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const effectiveLessonId = currentLessonId || firstLessonId;
  const effectiveLesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === effectiveLessonId);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto hidden md:flex md:flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 truncate text-sm">{course.title}</h2>
          <Link to={`/course/${id}`} className="text-xs text-gray-500 hover:text-gray-900 font-medium mt-0.5 block">
            Back to Community
          </Link>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{completedCount}/{totalLessons} complete</span>
            <span className="font-semibold text-gray-900">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 transition-all rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <nav className="p-2 flex-1 overflow-y-auto">
          {course.modules
            .sort((a, b) => a.order - b.order)
            .map((mod) => {
              const isExpanded = expandedModules[mod.id] ?? true;
              const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
              return (
                <div key={mod.id} className="mb-1">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {completedIds.has(lesson.id) ? (
                              <CircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
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

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 truncate text-sm">{course.title}</h2>
                <Link to={`/course/${id}`} className="text-xs text-gray-500 hover:text-gray-900 font-medium mt-0.5 block">
                  Back to Community
                </Link>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>{completedCount}/{totalLessons} complete</span>
                <span className="font-semibold text-gray-900">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 transition-all rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <nav className="p-2 flex-1 overflow-y-auto">
              {course.modules.sort((a, b) => a.order - b.order).map((mod) => {
                const isExpanded = expandedModules[mod.id] ?? true;
                const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
                return (
                  <div key={mod.id} className="mb-1">
                    <button onClick={() => toggleModule(mod.id)} className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="truncate">{mod.title}</span>
                    </button>
                    {isExpanded && (
                      <ul className="ml-4 space-y-0.5">
                        {lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <button
                              onClick={() => { setCurrentLessonId(lesson.id); setIsMobileSidebarOpen(false); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${effectiveLessonId === lesson.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                              {completedIds.has(lesson.id) ? <CircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Play className="w-4 h-4 text-gray-400 flex-shrink-0" />}
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
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 transition-all rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
              {completedCount}/{totalLessons}
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
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
                <div className="mb-6 whitespace-pre-wrap text-gray-600 leading-relaxed">
                  {effectiveLesson.content}
                </div>
              )}

              {!effectiveLesson.content && !effectiveLesson.videoUrl && (
                <p className="text-gray-400 mb-6">No content for this lesson yet.</p>
              )}

              <Button
                onClick={() => completeMutation.mutate(effectiveLesson.id, {
                  onSuccess: () => toast.success('Lesson completed!'),
                })}
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
