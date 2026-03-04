import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['discover-courses', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (search) params.set('search', search);
      const { data } = await api.get(`/courses?${params}`);
      return data;
    },
  });

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Discover courses</h1>
          <p className="text-gray-500">
            or{' '}
            <button
              onClick={() => (user ? navigate('/dashboard') : navigate('/login'))}
              className="text-primary-600 hover:underline"
            >
              create your own
            </button>
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search courses"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </form>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.courses?.map((course) => (
              <Link
                key={course.id}
                to={`/course/${course.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="h-44 bg-gray-100">
                  {course.coverImage ? (
                    <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white/30" />
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                    {course.community?.name || 'Course Community'}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 leading-6 line-clamp-3 mb-4 flex-1">
                    {course.description || 'No description available for this course yet.'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {course.memberCount || 0} members
                    </span>
                    <span className="font-semibold text-gray-900">
                      {course.price && Number(course.price) > 0 ? `$${course.price}/mo` : 'Free'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !data?.courses?.length && (
          <div className="text-center text-gray-500 py-16">No courses found for this search.</div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 px-3">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.min(data.totalPages, prev + 1))}
              disabled={page >= data.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
