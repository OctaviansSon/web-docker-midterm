import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { api } from '../api/api';
import type { TeamDetail } from '../api/types';
import { Avatar, ErrorState, Spinner } from '../components/ui';
import type { TeamContextValue } from './teamContext';

export default function TeamLayout() {
  const id = Number(useParams().teamId);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setTeam(await api.getTeam(id));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    }
  }, [id]);

  useEffect(() => {
    setTeam(null);
    void load();
  }, [load]);

  if (error && !team) {
    return (
      <main className="page">
        <ErrorState message={error} action={<Link to="/teams" className="btn btn-ghost">← Back to teams</Link>} />
      </main>
    );
  }
  if (!team) return <Spinner />;

  const context: TeamContextValue = { team, reload: load };
  return (
    <main className="page page-wide">
      <div className="team-head">
        <div>
          <Link to="/teams" className="crumb">
            ← Teams
          </Link>
          <h1>{team.name}</h1>
          {team.description && <p className="muted">{team.description}</p>}
        </div>
        <div className="avatars" title={team.members.map((m) => m.username).join(', ')}>
          {team.members.slice(0, 6).map((m) => (
            <Avatar key={m.user_id} name={m.username} id={m.user_id} />
          ))}
          {team.members.length > 6 && <span className="avatar more">+{team.members.length - 6}</span>}
        </div>
      </div>
      <nav className="tabs">
        <NavLink to="" end>
          Board
        </NavLink>
        <NavLink to="members">Members</NavLink>
        <NavLink to="stats">Stats</NavLink>
      </nav>
      <Outlet context={context} />
    </main>
  );
}
