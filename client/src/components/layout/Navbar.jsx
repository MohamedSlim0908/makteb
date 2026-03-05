import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Compass,
  Globe,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';

export function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const courseMatch1 = useMatch('/course/:id');
  const courseMatch2 = useMatch('/course/:id/*');
  const communityMatch1 = useMatch('/community/:slug');
  const communityMatch2 = useMatch('/community/:slug/*');
  const courseRouteMatch = courseMatch1 || courseMatch2;
  const communityRouteMatch = communityMatch1 || communityMatch2;
  const courseId = courseRouteMatch?.params?.id || null;
  const communitySlug = communityRouteMatch?.params?.slug || null;

  const isCourseRoute = pathname.startsWith('/course/');
  const isCommunityRoute = pathname.startsWith('/community/');
  const isCommunityShellRoute = isCourseRoute || isCommunityRoute;
  const isLanding = pathname === '/';

  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [brandMenuSearch, setBrandMenuSearch] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shellSearch, setShellSearch] = useState('');

  const brandMenuRef = useRef(null);
  const userMenuRef = useRef(null);

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

  // Close all menus on outside click
  useEffect(() => {
    function handleClick(e) {
      if (brandMenuRef.current && !brandMenuRef.current.contains(e.target)) {
        setIsBrandMenuOpen(false);
        setBrandMenuSearch('');
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') {
        setIsBrandMenuOpen(false);
        setBrandMenuSearch('');
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close menus on navigation using key-based reset
  const [menuKey, setMenuKey] = useState(pathname);
  if (menuKey !== pathname) {
    setMenuKey(pathname);
    setIsBrandMenuOpen(false);
    setBrandMenuSearch('');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }

  const brandLinks = [
    { to: user ? '/dashboard' : '/login', label: 'Create a Community', icon: Plus },
    { to: '/discover', label: 'Discover', icon: Compass },
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
    subtitle: course.community?.name || 'Course',
  }));
  const filteredEnrolledCourseLinks = enrolledCourseLinks.filter((course) =>
    `${course.label} ${course.subtitle}`.toLowerCase().includes(normalizedMenuSearch)
  );

  const brandName = isCourseRoute
    ? courseBrand?.community?.name || 'Course'
    : isCommunityRoute
      ? communityBrand?.name || 'Community'
      : 'Makteb';

  const communityShellHome = isCourseRoute && courseId
    ? `/course/${courseId}`
    : isCommunityRoute && communitySlug
      ? `/community/${communitySlug}`
      : '/discover';

  // Community/Course shell navbar
  if (isCommunityShellRoute) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-14">
        <div className="max-w-[1220px] mx-auto px-4 h-full flex items-center gap-4">
          <Link to={communityShellHome} className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              <Globe className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900 truncate max-w-[200px] text-sm">{brandName}</span>
          </Link>

          <div className="hidden md:block flex-1">
            <div className="relative max-w-[480px] mx-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={shellSearch}
                onChange={(e) => setShellSearch(e.target.value)}
                placeholder="Search"
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-gray-300 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {user ? (
              <>
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                  <MessageCircle className="w-[18px] h-[18px]" />
                </button>
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors relative">
                  <Bell className="w-[18px] h-[18px]" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <Avatar src={user.avatar} name={user.name} size="sm" className="ml-1" />
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Default navbar
  return (
    <nav className={`sticky top-0 z-50 h-14 border-b transition-colors ${
      isLanding ? 'bg-white/80 backdrop-blur-lg border-gray-200/60' : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-fit">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
          </Link>

          <div ref={brandMenuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsBrandMenuOpen((open) => !open)}
              aria-expanded={isBrandMenuOpen}
              className="flex items-center gap-1 text-gray-900 hover:text-primary-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md px-1.5 py-1"
            >
              <span className="font-semibold text-sm">{brandName}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBrandMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBrandMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-dropdown border border-gray-200 p-2 z-50 animate-scale-in">
                <div className="px-1 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={brandMenuSearch}
                      onChange={(e) => setBrandMenuSearch(e.target.value)}
                      placeholder="Search menu"
                      className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    />
                  </div>
                </div>

                {filteredBrandLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => { setIsBrandMenuOpen(false); setBrandMenuSearch(''); }}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}

                {user && (
                  <div className="px-1 pt-1">
                    <div className="my-1 border-t border-gray-100" />
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Enrolled courses
                    </p>
                    {enrolledCoursesLoading ? (
                      <div className="px-2 py-2 text-sm text-gray-400">Loading...</div>
                    ) : filteredEnrolledCourseLinks.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-gray-400">
                        {normalizedMenuSearch ? 'No courses found.' : 'No enrolled courses yet.'}
                      </div>
                    ) : (
                      filteredEnrolledCourseLinks.map((course) => (
                        <Link
                          key={course.id}
                          to={course.to}
                          onClick={() => { setIsBrandMenuOpen(false); setBrandMenuSearch(''); }}
                          className={`flex items-start gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors ${
                            pathname.startsWith(`/course/${course.id}`) ? 'bg-gray-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{course.label}</span>
                            <span className="block truncate text-xs text-gray-400">{course.subtitle}</span>
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <Link
                to="/discover"
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname === '/discover' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Compass className="w-4 h-4" />
                Discover
              </Link>

              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <MessageCircle className="w-[18px] h-[18px]" />
              </button>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors relative">
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div ref={userMenuRef} className="relative ml-1">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full"
                >
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-gray-200 py-1 animate-scale-in z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900 truncate text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/settings" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Settings
                    </Link>
                    <Link to="/discover" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors md:hidden">
                      Discover
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-black rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 animate-slide-up">
          <div className="space-y-1">
            <Link to="/discover" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Discover
            </Link>
            <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Dashboard
            </Link>
            <Link to="/settings" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Settings
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
