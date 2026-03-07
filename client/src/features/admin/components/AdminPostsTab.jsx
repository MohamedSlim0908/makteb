import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAdminPosts, useAdminDeletePost } from '../useAdmin';
import { AdminPagination } from './AdminPagination';

export function AdminPostsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = useAdminPosts({ page, search });
  const deleteMutation = useAdminDeletePost();

  const posts = data?.posts ?? [];

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
          placeholder="Search posts..."
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Author</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Community</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      <Link to={`/post/${post.id}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{post.author?.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {post.community ? (
                        <Link to={`/community/${post.community.slug}`} className="hover:underline">
                          {post.community.name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() =>
                          deleteMutation.mutate(post.id, {
                            onSuccess: () => toast.success('Post deleted'),
                            onError: () => toast.error('Failed to delete post'),
                          })
                        }
                        isLoading={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No posts found
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
