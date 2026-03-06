import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCommunities } from '../features/community/useCommunities';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const CATEGORIES = [
  { name: 'All', value: '', icon: null },
  { name: 'Hobbies', value: 'hobbies', icon: '🎨' },
  { name: 'Music', value: 'music', icon: '🎸' },
  { name: 'Money', value: 'money', icon: '💰' },
  { name: 'Spirituality', value: 'spirituality', icon: '🙏' },
  { name: 'Tech', value: 'tech', icon: '💻' },
  { name: 'Health', value: 'health', icon: '🥕' },
  { name: 'Sports', value: 'sports', icon: '⚽' },
  { name: 'Self-improvement', value: 'self-improvement', icon: '📚' },
];

export function DiscoverPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync from URL ?q= param when it changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchInput) {
      setSearchInput(q);
      setDebouncedSearch(q);
    }
    // Only react to URL changes, not searchInput changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const categoryValue = activeCategory !== 'All'
    ? CATEGORIES.find((c) => c.name === activeCategory)?.value || ''
    : '';

  const { data: communitiesData, isLoading } = useCommunities({
    search: debouncedSearch,
    category: categoryValue,
  });

  const communities = communitiesData?.communities ?? [];

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <div className="max-w-[1200px] mx-auto px-4 pt-10 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover communities
          </h1>
          <p className="text-gray-500">
            or{' '}
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="text-gray-900 underline underline-offset-2 font-medium hover:text-black"
            >
              create your own
            </button>
          </p>
        </div>

        {/* Search */}
        <div className="max-w-[600px] mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.name
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon && <span className="text-sm">{category.icon}</span>}
              {category.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => (
              <Link
                key={community.id}
                to={`/community/${community.slug || community.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-card-hover transition-all duration-200 flex flex-col group"
              >
                {/* Cover */}
                <div className="h-36 relative overflow-hidden bg-gray-100">
                  {community.coverImage ? (
                    <img
                      src={community.coverImage}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(community.name || 'C').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
                        {community.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {community.memberCount || community._count?.members || 0} Members
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">
                    {community.description || 'A community for learning and growing together.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{community.memberCount || community._count?.members || 0} members</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {community.price ? `$${community.price}/mo` : 'Free'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
