import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAdminCommunities } from '../useAdmin';
import { AdminPagination } from './AdminPagination';

export function AdminCommunitiesTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = useAdminCommunities({ page, search });

  const communities = data?.communities ?? [];

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
          placeholder="Search communities..."
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Members</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Courses</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Posts</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {communities.map((community) => (
                  <tr key={community.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link to={`/community/${community.slug}`} className="hover:underline">
                        {community.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{community.creator?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{community._count?.members || 0}</td>
                    <td className="px-4 py-3 text-gray-500">{community._count?.courses || 0}</td>
                    <td className="px-4 py-3 text-gray-500">{community._count?.posts || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/community/${community.slug}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {communities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No communities found
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
