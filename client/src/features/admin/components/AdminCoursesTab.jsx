import { useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAdminCourses, useToggleCoursePublish } from '../useAdmin';
import { AdminPagination } from './AdminPagination';

export function AdminCoursesTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = useAdminCourses({ page, search });
  const togglePublishMutation = useToggleCoursePublish();

  const courses = data?.courses ?? [];

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput);
          setPage(1);
        }}
        className="flex gap-2 max-w-md"
      >
        <Input
          placeholder="Search courses..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-400 py-4">Loading...</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Community</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Enrollments</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link to={`/course/${course.id}`} className="hover:underline">
                        {course.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{course.creator?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{course.community?.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          course.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {course.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{course._count?.enrollments || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          togglePublishMutation.mutate(course.id, {
                            onSuccess: () =>
                              toast.success(course.published ? 'Course unpublished' : 'Course published'),
                            onError: () => toast.error('Failed to toggle publish'),
                          })
                        }
                        isLoading={togglePublishMutation.isPending}
                      >
                        {course.published ? (
                          <EyeOff className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 mr-1" />
                        )}
                        {course.published ? 'Unpublish' : 'Publish'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <AdminPagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
    </div>
  );
}
