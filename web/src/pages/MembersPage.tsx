import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/ui';
import { useTeamContext } from './teamContext';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Unexpected error');

export default function MembersPage() {
  const { team, reload } = useTeamContext();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isOwner = team.my_role === 'owner';

  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description);
  const [settingsError, setSettingsError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function invite(e: FormEvent) {
    e.preventDefault();
    setInviteError('');
    try {
      const m = await api.addMember(team.id, email.trim());
      setEmail('');
      await reload();
      toast(`${m.username} added to the team`, 'success');
    } catch (err) {
      setInviteError(msg(err));
    }
  }

  async function remove(userId: number, username: string) {
    try {
      await api.removeMember(team.id, userId);
      if (userId === user?.id) {
        toast('You left the team', 'success');
        navigate('/teams');
      } else {
        await reload();
        toast(`${username} removed`, 'success');
      }
    } catch (err) {
      toast(msg(err), 'error');
    }
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setSettingsError('');
    try {
      await api.updateTeam(team.id, { name: name.trim(), description });
      await reload();
      toast('Team updated', 'success');
    } catch (err) {
      setSettingsError(msg(err));
    }
  }

  async function deleteTeam() {
    try {
      await api.deleteTeam(team.id);
      toast('Team deleted', 'success');
      navigate('/teams');
    } catch (err) {
      toast(msg(err), 'error');
    }
  }

  return (
    <div className="two-col">
      <section className="panel">
        <h2>Members ({team.members.length})</h2>
        <ul className="member-list">
          {team.members.map((m) => (
            <li key={m.user_id}>
              <Avatar name={m.username} id={m.user_id} size={36} />
              <div className="member-info">
                <strong>{m.username}</strong>
                <span className="muted">{m.email}</span>
              </div>
              <span className={`role role-${m.role}`}>{m.role}</span>
              {m.role !== 'owner' && (isOwner || m.user_id === user?.id) && (
                <button className="btn btn-ghost btn-sm" onClick={() => remove(m.user_id, m.username)}>
                  {m.user_id === user?.id ? 'Leave' : 'Remove'}
                </button>
              )}
            </li>
          ))}
        </ul>

        {isOwner ? (
          <form onSubmit={invite} className="form inline-form">
            <label>
              Invite by e-mail
              <input className="input" type="email" placeholder="teammate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <button className="btn btn-primary">Add member</button>
            {inviteError && <div className="form-error">{inviteError}</div>}
          </form>
        ) : (
          <p className="muted">Only the team owner can invite members.</p>
        )}
      </section>

      {isOwner && (
        <section className="panel">
          <h2>Team settings</h2>
          <form onSubmit={saveSettings} className="form">
            <label>
              Name
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            </label>
            <label>
              Description
              <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            {settingsError && <div className="form-error">{settingsError}</div>}
            <button className="btn btn-primary" disabled={!name.trim()}>
              Save changes
            </button>
          </form>
          <div className="danger-zone">
            <h3>Danger zone</h3>
            <p className="muted">Deleting the team removes all its tasks for every member.</p>
            <button className="btn btn-danger" onClick={() => (confirmDelete ? deleteTeam() : setConfirmDelete(true))}>
              {confirmDelete ? 'Click again to delete team' : 'Delete team'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
