import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useState } from 'react';
import { HiMenu, HiX, HiBell } from 'react-icons/hi';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-primary-600 tracking-tight">
              makteb
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/discover" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Discover
              </Link>
              {user && (
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <button className="relative text-gray-500 hover:text-gray-700">
                  <HiBell className="w-5 h-5" />
                </button>
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block">
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Settings
                    </Link>
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                      Log out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
                <Button onClick={() => navigate('/register')}>Sign up</Button>
              </>
            )}
          </div>

          <button className="md:hidden flex items-center" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <Link to="/discover" className="block text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Discover</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/settings" className="block text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Settings</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="block text-red-600">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/register" className="block text-primary-600 font-medium" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
