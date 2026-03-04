import { Calendar } from 'lucide-react';

export function EventNotice({ event }) {
  if (!event) return null;

  return (
    <div className="text-sm text-gray-500 flex items-center gap-2">
      <Calendar className="w-4 h-4" />
      <span>
        {event.title} is happening in {event.hoursUntil} hours
      </span>
    </div>
  );
}
