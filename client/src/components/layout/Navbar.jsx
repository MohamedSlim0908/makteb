import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useState } from 'react';
import { HiMenu, HiX, HiBell, HiChat, HiSearch, HiChevronDown } from 'react-icons/hi';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
      <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Left: Logo & Context */}
        <div className="flex items-center gap-4 min-w-fit">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <div className="hidden md:flex items-center gap-1">
              <span className="font-semibold text-gray-900">Makteb</span>
              <HiChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-100 border-none rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2 md:gap-4 min-w-fit">
          {user ? (
            <>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                <HiChat className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                <HiBell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="relative group ml-1">
                <button className="flex items-center gap-2">
                  <Avatar src={user.avatar} name={user.name} size="md" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden group-hover:block transform origin-top-right transition-all">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Dashboard
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Settings
                  </Link>
                  <Link to="/discover" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Discover
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
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
