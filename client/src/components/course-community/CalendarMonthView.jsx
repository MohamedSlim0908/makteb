import { ChevronLeft, ChevronRight, CalendarDays, List } from 'lucide-react';
import { useMemo, useState } from 'react';
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

export function CalendarMonthView() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const events = useMemo(() => getMockCalendarEvents(visibleMonth), [visibleMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = toDateKey(event.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);
  const monthTitle = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const timeLabel = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
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
          <div key={day} className="py-2 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0 border-gray-200">
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
                  <p key={event.id} className="text-xs text-blue-600 truncate">
                    {event.time} · {event.title}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
