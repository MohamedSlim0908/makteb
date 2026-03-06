import { Calendar, CalendarDays, ChevronLeft, ChevronRight, Link2, List, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getMockCalendarEvents } from './mockData';

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

function formatDateWithWeekday(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatGoogleCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function getGoogleCalendarUrl(event) {
  const startAt = event.startAt || event.date;
  const endAt = event.endAt || event.date;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleCalendarDate(startAt)}/${formatGoogleCalendarDate(endAt)}`,
    details: event.description || '',
  });

  if (event.link) params.set('location', event.link);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function CalendarMonthView() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const events = useMemo(() => getMockCalendarEvents(visibleMonth), [visibleMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = toDateKey(event.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });

    map.forEach((dayEvents) => {
      dayEvents.sort((a, b) => (a.startAt || a.date).getTime() - (b.startAt || b.date).getTime());
    });

    return map;
  }, [events]);

  const cells = useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);
  const monthTitle = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const timeLabel = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  useEffect(() => {
    if (!selectedEvent) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedEvent]);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date())}
            className="h-9 px-4 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Today
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-3xl font-semibold text-gray-900">{monthTitle}</h3>
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">{timeLabel} local time</p>
          </div>

          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button type="button" className="px-3 py-2 text-gray-500 bg-gray-50">
              <List className="w-4 h-4" />
            </button>
            <button type="button" className="px-3 py-2 text-gray-500">
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0 border-gray-200"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, index) => {
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
            const key = toDateKey(date);
            const dayEvents = eventsByDay.get(key) || [];

            return (
              <div
                key={`${key}-${index}`}
                className="min-h-[130px] border-r border-b border-gray-200 p-2 last:border-r-0"
              >
                <p className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {date.getDate()}
                </p>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="w-full rounded px-1 py-0.5 text-left text-xs text-blue-700 truncate hover:bg-blue-50 hover:text-blue-800 transition-colors"
                    >
                      {event.time} - {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[11px] text-gray-500 px-1">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEvent(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedEvent.title} details`}
            className="w-full max-w-[420px] rounded-xl border border-gray-200 bg-white shadow-modal overflow-hidden animate-scale-in"
          >
            <div className="relative h-52 overflow-hidden">
              {selectedEvent.coverImage ? (
                <img
                  src={selectedEvent.coverImage}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cyan-500 via-primary-500 to-primary-700 flex items-end">
                  <div className="w-full p-4 bg-black/25">
                    <p className="text-xs font-medium text-white/90 uppercase tracking-wide">Live Event</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{selectedEvent.title}</h3>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/55"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center rounded-full bg-primary-50 px-2 text-xs font-semibold text-primary-700">
                  {selectedEvent.marker || 'EVENT'}
                </span>
                <h4 className="text-3xl font-semibold text-gray-900 leading-tight">{selectedEvent.title}</h4>
              </div>

              <div className="mt-4 flex items-start gap-2 text-gray-700">
                <Calendar className="w-4 h-4 mt-0.5 text-gray-500" />
                <div className="text-sm leading-relaxed">
                  <p>
                    {formatDateWithWeekday(selectedEvent.startAt || selectedEvent.date)} @{' '}
                    {formatTime(selectedEvent.startAt || selectedEvent.date)} -{' '}
                    {formatTime(selectedEvent.endAt || selectedEvent.date)}
                  </p>
                  <p className="text-gray-500">{selectedEvent.timezoneLabel || 'Local time'}</p>
                </div>
              </div>

              {selectedEvent.link && (
                <a
                  href={selectedEvent.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-start gap-2 text-sm text-primary-600 hover:text-primary-700 break-all"
                >
                  <Link2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{selectedEvent.link}</span>
                </a>
              )}

              {selectedEvent.description && (
                <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                  {selectedEvent.description}
                </p>
              )}

              <a
                href={getGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                ADD TO CALENDAR
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
