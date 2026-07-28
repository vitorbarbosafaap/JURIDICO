import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DeadlineBanner } from './DeadlineBanner';
import { ALL_ITEMS } from '../../nav';

function currentTitle(pathname: string): string {
  const match = ALL_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );
  return match?.label ?? 'Jurídico Pitzi';
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="main-col">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Abrir menu">
            <Menu size={18} />
          </button>
          <div>
            <h1>{currentTitle(location.pathname)}</h1>
          </div>
          <div className="spacer" />
        </header>
        <main className="content">
          <DeadlineBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
