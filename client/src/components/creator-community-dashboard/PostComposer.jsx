import { Avatar } from '../ui/Avatar';

export function PostComposer() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
      <button type="button" className="flex w-full items-center gap-3 text-left">
        <Avatar name="Creator" size="sm" />
        <div className="h-11 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 flex items-center">
          Write something
        </div>
      </button>
    </section>
  );
}
