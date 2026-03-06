import { ChevronLeft, ChevronRight, CalendarDays, List, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useEvents } from '../../features/events/useEvents';
import { useCreateEvent } from '../../features/events/useCreateEvent';
import { EventForm } from './EventForm';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function startOfCalendarGrid(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - (day - 1));
  return start;
}

function buildCalendarCells(date) {
  const start = startOfCalendarGrid(date);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    cells.push(current);
  }
  return cells;
}

function isToday(date) {
  const now = new Date();
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function formatEventTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function CalendarMonthView({ communityId, isAdmin = false }) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);

  const month = visibleMonth.getMonth();
  const year = visibleMonth.getFullYear();

  const { data: events = [], isLoading } = useEvents(communityId, { month, year });
  const createEventMutation = useCreateEvent(communityId);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const d = new Date(event.startAt);
      const key = toDateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);
  const monthTitle = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function handleCreateEvent(body) {
    createEventMutation.mutate(body, {
      onSuccess: () => {
        setShowForm(false);
        toast.success('Event created!');
      },
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date())}
              className="h-8 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="h-8 px-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 min-w-[180px] text-center">{monthTitle}</h3>
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button type="button" className="px-3 py-1.5 text-gray-500 bg-gray-50 text-sm">
              <List className="w-4 h-4" />
            </button>
            <button type="button" className="px-3 py-1.5 text-gray-500 text-sm">
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-r last:border-r-0 border-gray-100">
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="min-h-[100px] border-r border-b border-gray-100 p-2 last:border-r-0">
                <div className="w-6 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((date, index) => {
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const key = toDateKey(date);
              const dayEvents = eventsByDay.get(key) || [];
              const today = isToday(date);
              return (
                <div
                  key={`${key}-${index}`}
                  className={`min-h-[100px] border-r border-b border-gray-100 p-2 last:border-r-0 ${
                    !isCurrentMonth ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    today ? 'w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center' :
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                  }`}>
                    {date.getDate()}
                  </p>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <p key={event.id} className="text-xs text-gray-900 bg-gray-100 rounded px-1.5 py-0.5 truncate font-medium">
                        {formatEventTime(event.startAt)} {event.title}
                      </p>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-xs text-gray-400 px-1.5">+{dayEvents.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <EventForm
          onSubmit={handleCreateEvent}
          onClose={() => setShowForm(false)}
          isSubmitting={createEventMutation.isPending}
        />
      )}
    </>
  );
}
