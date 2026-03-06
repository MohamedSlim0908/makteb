import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

const CATEGORIES = [
  { name: 'All', icon: null },
  { name: 'Hobbies', icon: '🎨' },
  { name: 'Music', icon: '🎸' },
  { name: 'Money', icon: '💰' },
  { name: 'Spirituality', icon: '🙏' },
  { name: 'Tech', icon: '💻' },
  { name: 'Health', icon: '🥕' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Self-improvement', icon: '📚' },
];

const CATEGORY_KEYWORDS = {
  Hobbies: ['hobby', 'art', 'craft', 'diy', 'painting', 'photography', 'gaming', 'travel'],
  Music: ['music', 'song', 'guitar', 'piano', 'singer', 'producer', 'audio', 'beat'],
  Money: ['money', 'finance', 'investing', 'trading', 'business', 'entrepreneur', 'sales', 'marketing'],
  Spirituality: ['spiritual', 'mindfulness', 'meditation', 'faith', 'prayer', 'quran', 'islam', 'soul'],
  Tech: ['tech', 'software', 'code', 'coding', 'developer', 'programming', 'ai', 'data'],
  Health: ['health', 'fitness', 'wellness', 'nutrition', 'diet', 'mental health', 'workout', 'gym'],
  Sports: ['sport', 'football', 'soccer', 'basketball', 'tennis', 'pickleball', 'athlete', 'running'],
  'Self-improvement': ['self improvement', 'productivity', 'mindset', 'habits', 'growth', 'career', 'learning'],
};

function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

function extractCommunityCategories(community) {
  const rawCategoryValues = [
    community.category,
    ...(Array.isArray(community.categories) ? community.categories : []),
    ...(Array.isArray(community.tags) ? community.tags : []),
    ...(Array.isArray(community.topics) ? community.topics : []),
  ].filter(Boolean);

  return new Set(rawCategoryValues.map((value) => normalizeCategory(value)));
}

function matchesCategory(community, activeCategory) {
  if (activeCategory === 'All') return true;

  const normalizedActive = normalizeCategory(activeCategory);
  const explicitCategories = extractCommunityCategories(community);
  if (explicitCategories.has(normalizedActive)) return true;

  const text = `${community.name || ''} ${community.description || ''}`.toLowerCase();
  const keywords = CATEGORY_KEYWORDS[activeCategory] || [];
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

export function DiscoverPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: communitiesData, isLoading } = useQuery({
    queryKey: ['communities', 'discover'],
    queryFn: async () => {
      const { data } = await api.get('/communities?page=1&limit=50');
      return data;
    },
    staleTime: 30_000,
  });

  const communities = communitiesData?.communities ?? [];

  const filteredCommunities = communities.filter((community) => {
    const searchLower = searchInput.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      community.name?.toLowerCase().includes(searchLower) ||
      community.description?.toLowerCase().includes(searchLower);
    return matchesSearch && matchesCategory(community, activeCategory);
  });

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      <div className="max-w-[1200px] mx-auto px-4 pt-12 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Discover communities
          </h1>
          <p className="text-gray-500 text-base">
            Find your next learning community or{' '}
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              create your own
            </button>
          </p>
        </div>

        {/* Search */}
        <div className="max-w-[640px] mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for communities..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-card transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
          {CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.name
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.icon && <span className="text-sm">{category.icon}</span>}
              {category.name}
            </button>
          ))}
          <button className="flex items-center gap-1 px-3.5 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
            More
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommunities.map((community, index) => (
              <Link
                key={community.id}
                to={`/community/${community.slug || community.id}?tab=about`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover hover:border-gray-300 transition-all duration-300 flex flex-col group"
              >
                <div className="h-44 relative overflow-hidden bg-gray-100">
                  {community.coverImage ? (
                    <img
                      src={community.coverImage}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary-400">
                        {(community.name || 'C').charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="default" className="bg-black/40 backdrop-blur-sm text-white border-0">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                      {(community.name || 'C').charAt(0)}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1">
                      {community.name}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">
                    {community.description || 'A community for learning and growing together.'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium pt-3 border-t border-gray-100">
                    <span>{community.memberCount || community._count?.members || 0} members</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{community.price ? `$${community.price}` : 'Free'}</span>
                    {community.visibility === 'PRIVATE' && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <Badge variant="outline" className="text-[10px]">Private</Badge>
                      </>
                    )}
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
