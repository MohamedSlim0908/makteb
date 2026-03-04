import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../lib/theme.jsx';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useState } from 'react';
import { HiMenu, HiX, HiBell, HiChat, HiSearch, HiChevronDown, HiMoon, HiSun } from 'react-icons/hi';

export function Navbar() {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 h-16 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between gap-4">

        {/* Left: Logo */}
        <div className="flex items-center gap-4 min-w-fit">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center text-white dark:text-gray-900 font-bold text-sm transition-colors">
              M
            </div>
            <div className="hidden md:flex items-center gap-1">
              <span className="font-semibold text-gray-900 dark:text-white">Makteb</span>
              <HiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2 md:gap-3 min-w-fit">

          {/* Dark mode toggle */}
          <button
            onClick={toggleMode}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Toggle dark mode"
          >
            {mode === 'dark' ? (
              <HiSun className="w-5 h-5 text-yellow-400" />
            ) : (
              <HiMoon className="w-5 h-5" />
            )}
          </button>

          {user ? (
            <>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                <HiChat className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                <HiBell className="w-6 h-6" />
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
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Log in
              </Link>
              <Button onClick={() => navigate('/register')} size="sm">
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
