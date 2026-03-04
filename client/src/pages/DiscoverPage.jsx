import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HiSearch, HiPlus, HiLockClosed, HiGlobeAlt } from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['communities', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '12');
      const { data } = await api.get(`/communities?${params}`);
      return data;
    },
  });

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'hobbies', label: 'Hobbies', icon: '🎨' },
    { id: 'music', label: 'Music', icon: '🎸' },
    { id: 'money', label: 'Money', icon: '💰' },
    { id: 'spirituality', label: 'Spirituality', icon: '🧘' },
    { id: 'tech', label: 'Tech', icon: '💻' },
    { id: 'health', label: 'Health', icon: '🥕' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Discover communities</h1>
          <p className="text-gray-500 dark:text-gray-400">or <button onClick={() => user ? navigate('/dashboard') : navigate('/login')} className="text-primary-600 hover:underline">create your own</button></p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for anything"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-gray-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
            />
          </form>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cat.id === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {cat.icon && <span className="mr-2">{cat.icon}</span>}
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse h-80" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.communities?.map((community) => (
                <Link
                  key={community.id}
                  to={`/community/${community.slug}`}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col h-full"
                >
                  <div className="h-32 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {community.coverImage ? (
                      <img
                        src={community.coverImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-800" />
                    )}
                  </div>
                  
                  <div className="px-5 pb-5 flex-1 flex flex-col relative">
                    <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-gray-900 shadow-sm dark:shadow-gray-900/30 bg-white dark:bg-gray-800 -mt-8 mb-3 overflow-hidden flex items-center justify-center">
                       <div className="w-full h-full bg-black text-white flex items-center justify-center font-bold text-xl">
                         {community.name.charAt(0)}
                       </div>
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-primary-600 transition-colors">
                      {community.name}
                    </h3>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                      {community.description || 'No description available for this community.'}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {community.visibility === 'PRIVATE' ? (
                          <span className="flex items-center gap-1"><HiLockClosed className="w-3 h-3" /> Private</span>
                        ) : (
                          <span className="flex items-center gap-1"><HiGlobeAlt className="w-3 h-3" /> Public</span>
                        )}
                        <span>{community.memberCount} members</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {community.price && Number(community.price) > 0 ? `$${community.price}/mo` : 'Free'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
