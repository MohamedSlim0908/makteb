import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Compass,
  MessageCircle,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';

const CHAT_NAMES = [
  'Abdelhak Houamria',
  'Omar Yaqobi',
  'Sayeef Ahmed',
  'Arnold Benson',
  'Oyin Akinyoola',
  'Liquid Edits',
];

const CHAT_SNIPPETS = [
  'awesome here is my discord handle...',
  'itsomro',
  'Sorry for quitting the call unexpectedly...',
  'Sure bro',
  'How are you?',
  'Yes, you can add me',
];

const CHAT_TIMES = ['9h', '14d', "Oct '25", "Sep '25", "Jul '25", "Jul '25"];

export function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const courseRouteMatch = useMatch('/course/:id') || useMatch('/course/:id/*');
  const communityRouteMatch = useMatch('/community/:slug') || useMatch('/community/:slug/*');
  const courseId = courseRouteMatch?.params?.id || null;
  const communitySlug = communityRouteMatch?.params?.slug || null;

  const isCourseRoute = pathname.startsWith('/course/');
  const isCommunityRoute = pathname.startsWith('/community/');
  const isCommunityShellRoute = isCourseRoute || isCommunityRoute;
  const isDiscoverRoute = pathname === '/' || pathname === '/discover';

  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [brandMenuSearch, setBrandMenuSearch] = useState('');
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isSlideDownAnimating, setIsSlideDownAnimating] = useState(false);

  const [shellSearch, setShellSearch] = useState('');
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [messagesSearch, setMessagesSearch] = useState('');

  const brandMenuRef = useRef(null);
  const messagesRef = useRef(null);
  const notificationsRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const stopScrollTimerRef = useRef(null);
  const slideDownTimerRef = useRef(null);
  const wasScrollingDownRef = useRef(false);

  const { data: courseBrand } = useQuery({
    queryKey: ['navbar-course-brand', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}`);
      return data.course;
    },
    enabled: Boolean(courseId),
    staleTime: 120_000,
  });

  const { data: communityBrand } = useQuery({
    queryKey: ['navbar-community-brand', communitySlug],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communitySlug}`);
      return data.community;
    },
    enabled: Boolean(communitySlug),
    staleTime: 120_000,
  });

  const { data: enrolledCourses = [], isLoading: enrolledCoursesLoading } = useQuery({
    queryKey: ['navbar-enrolled-courses', user?.id],
    queryFn: async () => {
      const { data } = await api.get('/courses/enrolled/me');
      return data.enrolledCourses ?? [];
    },
    enabled: Boolean(user) && !isCommunityShellRoute,
    staleTime: 120_000,
  });

  useEffect(() => {
    function handleOutsideClick(event) {
      if (brandMenuRef.current && !brandMenuRef.current.contains(event.target)) {
        setIsBrandMenuOpen(false);
        setBrandMenuSearch('');
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsBrandMenuOpen(false);
        setBrandMenuSearch('');
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isMessagesOpen && !isNotificationsOpen) return;

    function handleOutsideClick(event) {
      const target = event.target;
      if (isMessagesOpen && messagesRef.current && !messagesRef.current.contains(target)) {
        setIsMessagesOpen(false);
      }
      if (isNotificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsMessagesOpen(false);
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMessagesOpen, isNotificationsOpen]);

  useEffect(() => {
    setIsBrandMenuOpen(false);
    setBrandMenuSearch('');
    setIsMessagesOpen(false);
    setIsNotificationsOpen(false);
    setMessagesSearch('');
  }, [pathname]);

  useEffect(() => {
    if (!isDiscoverRoute || isCommunityShellRoute) {
      setHasScrolled(false);
      setIsNavHidden(false);
      return;
    }

    lastScrollYRef.current = window.scrollY;

    function handleScroll() {
      const scrollY = window.scrollY;
      const hasPassedTop = scrollY > 8;
      const isScrollingDown = scrollY > lastScrollYRef.current && hasPassedTop;
      const isScrollingUp = scrollY < lastScrollYRef.current;

      setHasScrolled((prev) => (prev === hasPassedTop ? prev : hasPassedTop));

      if (isScrollingDown) {
        wasScrollingDownRef.current = true;
        setIsNavHidden((prev) => (prev ? prev : true));
      } else if (isScrollingUp) {
        wasScrollingDownRef.current = false;
        setIsNavHidden((prev) => (prev ? false : prev));
      }

      if (stopScrollTimerRef.current) {
        window.clearTimeout(stopScrollTimerRef.current);
      }

      stopScrollTimerRef.current = window.setTimeout(() => {
        if (wasScrollingDownRef.current) {
          setIsNavHidden(false);
          setIsSlideDownAnimating(false);
          window.requestAnimationFrame(() => {
            setIsSlideDownAnimating(true);
          });
          if (slideDownTimerRef.current) {
            window.clearTimeout(slideDownTimerRef.current);
          }
          slideDownTimerRef.current = window.setTimeout(() => {
            setIsSlideDownAnimating(false);
          }, 240);
          wasScrollingDownRef.current = false;
        }
      }, 170);

      lastScrollYRef.current = scrollY;
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (stopScrollTimerRef.current) {
        window.clearTimeout(stopScrollTimerRef.current);
      }
      if (slideDownTimerRef.current) {
        window.clearTimeout(slideDownTimerRef.current);
      }
    };
  }, [isDiscoverRoute, isCommunityShellRoute]);

  const brandLinks = [
    { to: user ? '/dashboard' : '/login', label: 'Create a Community', icon: Plus },
    { to: '/discover', label: 'Discover Courses', icon: Compass },
    { to: user ? '/settings' : '/login', label: 'Settings', icon: Settings },
  ];
  const normalizedMenuSearch = brandMenuSearch.trim().toLowerCase();
  const filteredBrandLinks = brandLinks.filter((item) =>
    item.label.toLowerCase().includes(normalizedMenuSearch)
  );
  const enrolledCourseLinks = (enrolledCourses ?? []).map((course) => ({
    id: course.id,
    to: `/course/${course.id}`,
    label: course.title,
    subtitle: course.community?.name || 'Course Community',
  }));
  const filteredEnrolledCourseLinks = enrolledCourseLinks.filter((course) =>
    `${course.label} ${course.subtitle}`.toLowerCase().includes(normalizedMenuSearch)
  );
  const hasNoBrandLinks = filteredBrandLinks.length === 0;
  const hasNoEnrolledLinks = filteredEnrolledCourseLinks.length === 0;
  const showNoResults = !user && hasNoBrandLinks;

  const brandName = isCourseRoute
    ? courseBrand?.community?.name || 'Course Community'
    : isCommunityRoute
      ? communityBrand?.name || 'Community'
      : 'Makteb';
  const brandInitial = (brandName || 'M').charAt(0).toUpperCase();
  const communityShellHome = isCourseRoute && courseId
    ? `/course/${courseId}`
    : isCommunityRoute && communitySlug
      ? `/community/${communitySlug}`
      : '/discover';

  const shellMessages = useMemo(() => {
    const normalized = messagesSearch.trim().toLowerCase();
    return CHAT_NAMES.map((name, index) => ({
      id: `chat-${index + 1}`,
      name,
      timeLabel: CHAT_TIMES[index % CHAT_TIMES.length],
      preview: CHAT_SNIPPETS[index % CHAT_SNIPPETS.length],
    })).filter((item) => {
      if (!normalized) return true;
      return `${item.name} ${item.preview}`.toLowerCase().includes(normalized);
    });
  }, [messagesSearch]);

  const shellNotifications = useMemo(
    () => [
      {
        id: 'notif-1',
        actorName: 'Sayeef Ahmed',
        actorAvatar: null,
        summary: '(following) new post',
        timeLabel: '22d',
        body: 'Updated Q&A Call Link Starting Now',
      },
      {
        id: 'notif-2',
        actorName: brandName,
        actorAvatar: null,
        summary: 'upcoming event',
        timeLabel: '2d',
        body: 'Live feedback call starts soon.',
      },
    ],
    [brandName]
  );

  if (isCommunityShellRoute) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
        <div className="max-w-[1220px] mx-auto px-4 h-full flex items-center gap-4">
          <Link to={communityShellHome} className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center text-white font-bold text-sm">
              {brandInitial}
            </div>
            <span className="font-semibold text-gray-900 truncate max-w-[220px]">{brandName}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Link>

          <div className="hidden md:block flex-1">
            <div className="relative max-w-[520px] mx-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={shellSearch}
                onChange={(e) => setShellSearch(e.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-100 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-gray-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <div ref={messagesRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMessagesOpen((value) => !value);
                      setIsNotificationsOpen(false);
                    }}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      isMessagesOpen
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  {isMessagesOpen && (
                    <div className="absolute right-0 top-12 w-[min(520px,calc(100vw-2rem))] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-[70]">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">Chats</h3>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          All
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            value={messagesSearch}
                            onChange={(e) => setMessagesSearch(e.target.value)}
                            placeholder="Search users"
                            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-100 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-gray-300 focus:bg-white"
                          />
                        </div>
                      </div>
                      <div className="max-h-[460px] overflow-y-auto">
                        {shellMessages.map((message) => (
                          <button
                            key={message.id}
                            type="button"
                            onClick={() => setIsMessagesOpen(false)}
                            className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-start gap-3"
                          >
                            <Avatar src={null} name={message.name} size="md" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {message.name}
                                <span className="font-normal text-gray-400"> - {message.timeLabel}</span>
                              </p>
                              <p className="text-sm text-gray-500 truncate">{message.preview}</p>
                            </div>
                          </button>
                        ))}
                        {!shellMessages.length && (
                          <div className="px-4 py-8 text-center text-sm text-gray-500">
                            No chats found for this search.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div ref={notificationsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen((value) => !value);
                      setIsMessagesOpen(false);
                    }}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      isNotificationsOpen
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-12 w-[min(520px,calc(100vw-2rem))] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-[70]">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">Notifications</h3>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                        >
                          All groups
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-[460px] overflow-y-auto">
                        {shellNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => setIsNotificationsOpen(false)}
                            className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-start gap-3"
                          >
                            <Avatar src={notification.actorAvatar} name={notification.actorName} size="md" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-600 truncate">
                                <span className="font-semibold text-gray-700">{notification.actorName}</span>{' '}
                                {notification.summary} - {notification.timeLabel}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{notification.body}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Avatar src={user.avatar} name={user.name} size="md" />
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 h-16 transition-[transform,background-color,box-shadow] duration-300 ${
        isDiscoverRoute && hasScrolled ? 'shadow-md' : ''
      } ${
        isDiscoverRoute && isNavHidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        isDiscoverRoute && !isNavHidden && isSlideDownAnimating ? 'animate-nav-slide-down' : ''
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-fit">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center text-white dark:text-gray-900 font-bold text-sm transition-colors">
              {brandInitial}
            </div>
          </Link>

          <div ref={brandMenuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsBrandMenuOpen((open) => !open)}
              aria-expanded={isBrandMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md px-1.5 py-1"
            >
              <span className="font-semibold">{brandName}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isBrandMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isBrandMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
                <div className="px-1 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={brandMenuSearch}
                      onChange={(e) => setBrandMenuSearch(e.target.value)}
                      placeholder="Search menu"
                      className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {filteredBrandLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.label}-${item.to}`}
                      to={item.to}
                      onClick={() => {
                        setIsBrandMenuOpen(false);
                        setBrandMenuSearch('');
                      }}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  );
                })}

                {user && (
                  <div className="px-1 pt-1">
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Enrolled courses
                    </p>
                    {enrolledCoursesLoading ? (
                      <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Loading courses...
                      </div>
                    ) : hasNoEnrolledLinks ? (
                      <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {normalizedMenuSearch
                          ? 'No enrolled courses found.'
                          : 'You are not enrolled in any courses yet.'}
                      </div>
                    ) : (
                      filteredEnrolledCourseLinks.map((course) => (
                        <Link
                          key={course.id}
                          to={course.to}
                          onClick={() => {
                            setIsBrandMenuOpen(false);
                            setBrandMenuSearch('');
                          }}
                          className={`flex items-start gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-200 transition-colors ${
                            pathname.startsWith(`/course/${course.id}`)
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{course.label}</span>
                            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                              {course.subtitle}
                            </span>
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                )}

                {showNoResults && (
                  <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No menu items found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 min-w-fit">
          {user ? (
            <>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
              </button>

              <div className="relative group ml-1">
                <button className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full">
                  <Avatar src={user.avatar} name={user.name} size="md" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 hidden group-hover:block">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Settings
                  </Link>
                  <Link to="/discover" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Discover
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 rounded-none transition-colors"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
