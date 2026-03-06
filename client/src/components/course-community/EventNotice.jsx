import { Calendar } from 'lucide-react';

function getHoursUntil(startAt) {
  const diff = new Date(startAt).getTime() - Date.now();
  return Math.max(1, Math.round(diff / 3_600_000));
}

export function EventNotice({ event }) {
  if (!event) return null;

  const hoursUntil = event.hoursUntil ?? getHoursUntil(event.startAt);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
      <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
        <Calendar className="w-4 h-4 text-white" />
      </div>
      <div className="text-sm">
        <span className="font-semibold text-gray-900">{event.title}</span>
        <span className="text-gray-500"> starts in {hoursUntil}h</span>
      </div>
    </div>
  );
}
