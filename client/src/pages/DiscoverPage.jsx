import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Check,
  Palette,
  Music2,
  Coins,
  Sparkles,
  Cpu,
  HeartPulse,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { PaginationNavigation } from '../components/ui/PaginationNavigation';

const RESULTS_PER_PAGE = 9;

const CATEGORIES = [
  { name: 'All', value: '', icon: null },
  {
    name: 'Hobbies',
    value: 'hobbies',
    icon: Palette,
    iconSurfaceClassName: 'bg-rose-100',
    iconClassName: 'text-rose-600',
  },
  {
    name: 'Music',
    value: 'music',
    icon: Music2,
    iconSurfaceClassName: 'bg-fuchsia-100',
    iconClassName: 'text-fuchsia-600',
  },
  {
    name: 'Money',
    value: 'money',
    icon: Coins,
    iconSurfaceClassName: 'bg-emerald-100',
    iconClassName: 'text-emerald-600',
  },
  {
    name: 'Spirituality',
    value: 'spirituality',
    icon: Sparkles,
    iconSurfaceClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
  },
  {
    name: 'Tech',
    value: 'tech',
    icon: Cpu,
    iconSurfaceClassName: 'bg-sky-100',
    iconClassName: 'text-sky-600',
  },
  {
    name: 'Health',
    value: 'health',
    icon: HeartPulse,
    iconSurfaceClassName: 'bg-red-100',
    iconClassName: 'text-red-500',
  },
  {
    name: 'Sports',
    value: 'sports',
    icon: Trophy,
    iconSurfaceClassName: 'bg-orange-100',
    iconClassName: 'text-orange-500',
  },
  {
    name: 'Self-improvement',
    value: 'self-improvement',
    icon: BookOpen,
    iconSurfaceClassName: 'bg-indigo-100',
    iconClassName: 'text-indigo-600',
  },
];

const PRIMARY_CATEGORIES = CATEGORIES.slice(0, 6);
const OVERFLOW_CATEGORIES = CATEGORIES.slice(6);

export function DiscoverPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState(() => CATEGORIES[0]);
  const [page, setPage] = useState(1);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const deferredSearchInput = useDeferredValue(searchInput);
  const searchQuery = deferredSearchInput.trim();
  const moreMenuRef = useRef(null);
  const resultsRef = useRef(null);
  const isOverflowCategorySelected = OVERFLOW_CATEGORIES.some((category) => category.name === activeCategory.name);

  useEffect(() => {
    if (!isMoreMenuOpen) return;

    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsMoreMenuOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMoreMenuOpen]);

  const { data: communitiesData, isLoading } = useQuery({
    queryKey: ['communities', 'discover', searchQuery, activeCategory.value, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(RESULTS_PER_PAGE),
      });

      if (searchQuery) params.set('search', searchQuery);
      if (activeCategory.value) params.set('category', activeCategory.value);

      const { data } = await api.get(`/communities?${params}`);
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const communities = communitiesData?.communities ?? [];
  const totalPages = communitiesData?.totalPages ?? 0;

  function handleCategoryChange(category) {
    setActiveCategory(category);
    setPage(1);
    setIsMoreMenuOpen(false);
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages) || nextPage === page) return;
    setPage(nextPage);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-12">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Discover communities
          </h1>
          <p className="text-base text-gray-500">
            Find your next learning community or{' '}
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              create your own
            </button>
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-[640px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
              placeholder="Search for communities..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm shadow-card transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {PRIMARY_CATEGORIES.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                activeCategory.name === category.name
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.icon && (
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${category.iconSurfaceClassName}`}>
                  <category.icon className={`h-3.5 w-3.5 ${category.iconClassName}`} />
                </span>
              )}
              {category.name}
            </button>
          ))}

          <div ref={moreMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((open) => !open)}
              aria-expanded={isMoreMenuOpen}
              className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                isMoreMenuOpen || isOverflowCategorySelected
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isOverflowCategorySelected ? activeCategory.name : 'More'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute left-1/2 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-dropdown sm:left-auto sm:right-0 sm:translate-x-0">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    More Categories
                  </p>
                </div>
                <div className="p-2">
                  {OVERFLOW_CATEGORIES.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => handleCategoryChange(category)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        activeCategory.name === category.name
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${category.iconSurfaceClassName}`}>
                        <category.icon className={`h-4 w-4 ${category.iconClassName}`} />
                      </span>
                      <span className="flex-1 font-medium">{category.name}</span>
                      {activeCategory.name === category.name && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} variant="card" />
            ))}
          </div>
        ) : communities.length > 0 ? (
          <>
            <div ref={resultsRef} />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {communities.map((community, index) => (
                <Link
                  key={community.id}
                  to={`/community/${community.slug || community.id}?tab=about`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card transition-all duration-300 hover:border-gray-300 hover:shadow-card-hover"
                >
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    {community.coverImage ? (
                      <img
                        src={community.coverImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                        <span className="text-4xl font-bold text-primary-400">
                          {(community.name || 'C').charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <Badge variant="default" className="border-0 bg-gray-800 text-white">
                        #{(page - 1) * RESULTS_PER_PAGE + index + 1}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white shadow-sm">
                        {(community.name || 'C').charAt(0)}
                      </div>
                      <h3 className="line-clamp-1 text-base font-bold leading-tight text-gray-900">
                        {community.name}
                      </h3>
                    </div>

                    <p className="mb-4 flex-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {community.description || 'A community for learning and growing together.'}
                    </p>

                    <div className="flex items-center gap-3 border-t border-gray-100 pt-3 text-xs font-medium text-gray-400">
                      <span>{community.memberCount || community._count?.members || 0} members</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{community.price ? `$${community.price}` : 'Free'}</span>
                      {community.visibility === 'PRIVATE' && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <Badge variant="outline" className="text-[10px]">
                            Private
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <PaginationNavigation page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No communities found"
            description="Try adjusting your search or category filter."
          />
        )}
      </div>
    </div>
  );
}
