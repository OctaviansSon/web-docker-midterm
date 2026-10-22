import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import { Topbar } from './components/Topbar';
import { Spinner } from './components/ui';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import BoardPage from './pages/BoardPage';
import CheatsPage from './pages/CheatsPage';
import MembersPage from './pages/MembersPage';
import StatsPage from './pages/StatsPage';
import TeamLayout from './pages/TeamLayout';
import TeamsPage from './pages/TeamsPage';

/** Everything behind the login: topbar + routed page. */
function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return (
    <>
      <Topbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamLayout />}>
              <Route index element={<BoardPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="stats" element={<StatsPage />} />
            </Route>
            <Route path="/cheats" element={<CheatsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/teams" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
