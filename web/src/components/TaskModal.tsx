import { useState, type FormEvent } from 'react';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import type { Category, Member, Priority, Status, Task, TaskInput } from '../api/types';
import { CATEGORIES, PRIORITIES, STATUSES } from '../data/meta';
import { Modal } from './Modal';

interface Props {
  teamId: number;
  members: Member[];
  task: Task | null; // null = create
  defaultStatus?: Status;
  onClose: () => void;
  onSaved: (task: Task, created: boolean) => void;
  onDeleted: (id: number) => void;
}

export function TaskModal({ teamId, members, task, defaultStatus = 'backlog', onClose, onSaved, onDeleted }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [category, setCategory] = useState<Category>(task?.category ?? 'other');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [status, setStatus] = useState<Status>(task?.status ?? defaultStatus);
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [assignee, setAssignee] = useState<string>(task?.assignee_id ? String(task.assignee_id) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const body: TaskInput = {
      title: title.trim(),
      description,
      category,
      priority,
      status,
      due_date: dueDate || null,
      assignee_id: assignee ? Number(assignee) : null,
    };
    try {
      const saved = task ? await api.updateTask(task.id, body) : await api.createTask(teamId, body);
      onSaved(saved, !task);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unexpected error');
      setBusy(false);
    }
  }

  async function remove() {
    if (!task) return;
    setBusy(true);
    try {
      await api.deleteTask(task.id);
      onDeleted(task.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unexpected error');
      setBusy(false);
    }
  }

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>
          Title
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus />
        </label>
        <label>
          Description
          <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid-2">
          <label>
            Topic
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stage
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
        <label>
          Assignee
          <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.username}
              </option>
            ))}
          </select>
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          {task && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
            >
              {confirmDelete ? 'Click again to delete' : 'Delete'}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !title.trim()}>
            {task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
