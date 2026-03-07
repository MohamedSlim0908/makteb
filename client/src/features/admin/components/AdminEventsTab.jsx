import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { useAdminEvents, useAdminDeleteEvent } from '../useAdmin';
import { AdminPagination } from './AdminPagination';

export function AdminEventsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminEvents({ page });
  const deleteMutation = useAdminDeleteEvent();

  const events = data?.events ?? [];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-gray-400 py-4">Loading...</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Community</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Attendees</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{event.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {event.community ? (
                        <Link to={`/community/${event.community.slug}`} className="hover:underline">
                          {event.community.name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{event.creator?.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(event.startAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{event._count?.attendance || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() =>
                          deleteMutation.mutate(event.id, {
                            onSuccess: () => toast.success('Event deleted'),
                            onError: () => toast.error('Failed to delete event'),
                          })
                        }
                        isLoading={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No events found
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
