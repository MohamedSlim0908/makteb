export const COURSE_TABS = [
  { id: 'community', label: 'Community' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'members', label: 'Members' },
  { id: 'map', label: 'Map' },
  { id: 'leaderboards', label: 'Leaderboards' },
  { id: 'about', label: 'About' },
];

export const POST_CATEGORIES = [
  { value: 'ALL', label: 'All' },
  { value: 'WINS', label: 'Wins' },
  { value: 'BRANDING_CLIENTS', label: 'Branding / Clients' },
  { value: 'WORKFLOW_PRODUCTIVITY', label: 'Workflow / Productivity' },
  { value: 'BANTER', label: 'Banter' },
  { value: 'INTRODUCE_YOURSELF', label: 'Introduce Yourself' },
];

const WORLD_COORDINATES = [
  { lat: 37.7749, lng: -122.4194, city: 'San Francisco, USA' },
  { lat: 40.7128, lng: -74.006, city: 'New York, USA' },
  { lat: 51.5072, lng: -0.1276, city: 'London, UK' },
  { lat: 48.8566, lng: 2.3522, city: 'Paris, France' },
  { lat: 52.52, lng: 13.405, city: 'Berlin, Germany' },
  { lat: 41.9028, lng: 12.4964, city: 'Rome, Italy' },
  { lat: 35.6762, lng: 139.6503, city: 'Tokyo, Japan' },
  { lat: 28.6139, lng: 77.209, city: 'Delhi, India' },
  { lat: -33.8688, lng: 151.2093, city: 'Sydney, Australia' },
  { lat: -23.5505, lng: -46.6333, city: 'Sao Paulo, Brazil' },
  { lat: 25.2048, lng: 55.2708, city: 'Dubai, UAE' },
  { lat: 30.0444, lng: 31.2357, city: 'Cairo, Egypt' },
  { lat: 36.8065, lng: 10.1815, city: 'Tunis, Tunisia' },
  { lat: 59.3293, lng: 18.0686, city: 'Stockholm, Sweden' },
  { lat: 55.7558, lng: 37.6173, city: 'Moscow, Russia' },
  { lat: 19.076, lng: 72.8777, city: 'Mumbai, India' },
  { lat: -34.6037, lng: -58.3816, city: 'Buenos Aires, Argentina' },
  { lat: 43.6532, lng: -79.3832, city: 'Toronto, Canada' },
];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getMemberPresence(seed) {
  const hash = hashString(seed || 'member');
  const isOnline = hash % 3 === 0;
  const lastSeenMinutes = (hash % 48) + 1;
  return { isOnline, lastSeenMinutes };
}

export function getMemberLocation(seed) {
  const hash = hashString(seed || 'member');
  return WORLD_COORDINATES[hash % WORLD_COORDINATES.length];
}

function formatHourLabel(hour) {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? 'pm' : 'am';
  const hour12 = normalized % 12 || 12;
  return `${hour12}${suffix}`;
}

function createCalendarEvent({
  id,
  date,
  startHour,
  durationHours = 1,
  title,
  description,
  link,
  marker = 'EVENT',
  timezoneLabel = 'Local time',
  coverImage = null,
}) {
  const startAt = new Date(date);
  startAt.setHours(startHour, 0, 0, 0);

  const endAt = new Date(startAt);
  endAt.setHours(startAt.getHours() + durationHours);

  return {
    id,
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    time: formatHourLabel(startHour),
    startAt,
    endAt,
    title,
    description,
    link,
    marker,
    timezoneLabel,
    coverImage,
  };
}

export function getMockCalendarEvents(referenceDate) {
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();
  const events = [];

  for (let day = 1; day <= 31; day += 1) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) continue;

    const weekDay = date.getDay();
    if (weekDay === 2) {
      const startHour = day % 2 === 0 ? 17 : 16;
      events.push(
        createCalendarEvent({
          id: `${year}-${month + 1}-${day}-qa`,
          date,
          startHour,
          durationHours: 1,
          title: 'LIVE Q&A',
          description:
            'Bring your latest questions and blockers. We will review member submissions live and share actionable next steps.',
          link: 'https://meet.google.com/',
          marker: 'Q&A',
        })
      );
    }

    if (weekDay === 4) {
      const startHour = day % 2 === 0 ? 17 : 16;
      events.push(
        createCalendarEvent({
          id: `${year}-${month + 1}-${day}-feedback`,
          date,
          startHour,
          durationHours: 1,
          title: 'Editing Feedback',
          description:
            'Submit your draft before the session to get practical, scene-by-scene feedback and improve your next cut.',
          link: 'https://meet.google.com/',
          marker: 'FEEDBACK',
        })
      );
    }
  }

  return events;
}

export function findUpcomingEvent(events, now = new Date()) {
  const upcoming = events
    .filter((event) => (event.startAt || event.date).getTime() > now.getTime())
    .sort((a, b) => (a.startAt || a.date).getTime() - (b.startAt || b.date).getTime())[0];

  if (!upcoming) return null;

  const eventStart = upcoming.startAt || upcoming.date;
  const hoursUntil = Math.max(1, Math.round((eventStart.getTime() - now.getTime()) / 3_600_000));
  return { ...upcoming, hoursUntil };
}
