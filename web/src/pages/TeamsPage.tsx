import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import type { Team } from '../api/types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorState, Spinner } from '../components/ui';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api
      .listTeams()
      .then(setTeams)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      const team = await api.createTeam({ name: name.trim(), description });
      toast('Team created', 'success');
      navigate(`/teams/${team.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unexpected error');
      setBusy(false);
    }
  }

  const newTeamButton = (
    <button className="btn btn-primary" onClick={() => setCreating(true)}>
      + New team
    </button>
  );

  return (
    <main className="page">
      <div className="page-head">
        <h1>My teams</h1>
        {teams && teams.length > 0 && newTeamButton}
      </div>

      {error && <ErrorState message={error} />}
      {!error && !teams && <Spinner />}
      {teams && teams.length === 0 && (
        <EmptyState title="No teams yet" hint="Create your first team to start a board and invite teammates." action={newTeamButton} />
      )}
      {teams && teams.length > 0 && (
        <div className="team-grid">
          {teams.map((t) => (
            <Link key={t.id} to={`/teams/${t.id}`} className="team-card">
              <div className="team-card-top">
                <h3>{t.name}</h3>
                <span className={`role role-${t.my_role}`}>{t.my_role}</span>
              </div>
              <p>{t.description || 'No description'}</p>
              <div className="team-card-foot">
                {t.members_count} member{t.members_count === 1 ? '' : 's'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <Modal title="New team" onClose={() => setCreating(false)}>
          <form onSubmit={create} className="form">
            <label>
              Name
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoFocus />
            </label>
            <label>
              Description
              <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            {formError && <div className="form-error">{formError}</div>}
            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy || !name.trim()}>
                Create team
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
