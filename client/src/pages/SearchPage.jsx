import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Users, BookOpen } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { EmptyState } from '../components/ui/EmptyState';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [input, setInput] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);

  const { communities, courses, isLoading, hasQuery } = useSearch(query);

  function handleSubmit(e) {
    e.preventDefault();
    setQuery(input);
    setSearchParams(input.trim() ? { q: input.trim() } : {});
  }

  const totalResults = communities.length + courses.length;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search communities and courses..."
              className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all"
              autoFocus
            />
          </div>
        </form>

        {isLoading && hasQuery && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && hasQuery && totalResults === 0 && (
          <EmptyState
            icon={Search}
            title="No results found"
            description={`No communities or courses match "${query}". Try a different search.`}
          />
        )}

        {!isLoading && hasQuery && communities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Communities ({communities.length})
            </h2>
            <div className="space-y-2">
              {communities.map((c) => (
                <Link
                  key={c.id}
                  to={`/community/${c.slug}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(c.name || 'C').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 group-hover:text-gray-700 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {c._count?.members || 0} members
                      {c.category && ` · ${c.category}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isLoading && hasQuery && courses.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Courses ({courses.length})
            </h2>
            <div className="space-y-2">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group"
                >
                  {course.coverImage ? (
                    <img src={course.coverImage} alt="" className="w-14 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 group-hover:text-gray-700 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {course.community?.name || 'Course'}
                      {course.price ? ` · $${course.price}` : ' · Free'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!hasQuery && (
          <div className="py-12 text-center text-gray-400 text-sm">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  );
}
