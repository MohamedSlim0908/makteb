import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppLayout() {
  const { pathname } = useLocation();
  const [shellSearch, setShellSearch] = useState('');

  // Clear search when navigating to a different path
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setShellSearch('');
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <Navbar shellSearch={shellSearch} onShellSearchChange={setShellSearch} />
      <main className="flex-1">
        <Outlet context={{ shellSearch, setShellSearch }} />
      </main>
    </div>
  );
}
