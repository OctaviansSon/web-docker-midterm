import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './ui';

type Theme = 'dark' | 'light';
const THEME_KEY = 'planner_theme';

export function applyStoredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark';
}

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export function Topbar() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();

  return (
    <header className="topbar">
      <Link to="/teams" className="logo">
        <span className="logo-prompt">$</span> devops-planner
      </Link>
      <nav className="topnav">
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/cheats">Cheats</NavLink>
      </nav>
      <div className="topbar-right">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        {user && (
          <>
            <span className="who">
              <Avatar name={user.username} id={user.id} size={26} />
              <span className="who-name">{user.username}</span>
            </span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Log out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
