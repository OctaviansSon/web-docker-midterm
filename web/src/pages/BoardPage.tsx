import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/api';
import type { Category, Member, Priority, Status, Task } from '../api/types';
import { DraggableTaskCard, TaskCardView } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { useToast } from '../components/Toast';
import { ErrorState, Spinner } from '../components/ui';
import { CATEGORIES, PRIORITIES, STATUSES } from '../data/meta';
import { useTeamContext } from './teamContext';

function Column({
  status,
  label,
  tasks,
  members,
  onOpen,
  onAdd,
}: {
  status: Status;
  label: string;
  tasks: Task[];
  members: Map<number, Member>;
  onOpen: (t: Task) => void;
  onAdd: (s: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section className={`column col-${status}${isOver ? ' is-over' : ''}`} aria-label={label}>
      <header className="column-head">
        <span className="column-dot" />
        <h3>{label}</h3>
        <span className="count">{tasks.length}</span>
      </header>
      <div className="column-body" ref={setNodeRef}>
        {tasks.map((t) => (
          <DraggableTaskCard key={t.id} task={t} assignee={t.assignee_id ? members.get(t.assignee_id) : undefined} onOpen={onOpen} />
        ))}
        {tasks.length === 0 && <div className="column-empty">Drop tasks here</div>}
      </div>
      <button className="add-task" onClick={() => onAdd(status)}>
        + Add task
      </button>
    </section>
  );
}

export default function BoardPage() {
  const { team } = useTeamContext();
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [assignee, setAssignee] = useState<number | ''>('');

  const [modal, setModal] = useState<{ task: Task | null; status: Status } | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const members = useMemo(() => new Map(team.members.map((m) => [m.user_id, m])), [team.members]);
  const filtersActive = !!(q || category || priority || assignee);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // filters are applied by the API (query parameters)
  useEffect(() => {
    let cancelled = false;
    api
      .listTasks(team.id, { q, category, priority, assignee_id: assignee })
      .then((data) => {
        if (cancelled) return;
        setTasks(data);
        setError('');
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [team.id, q, category, priority, assignee]);

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const id = Number(e.active.id);
    const status = e.over.id as Status;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;

    const previous = task.status;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t))); // optimistic
    api.setStatus(id, status).catch((err: Error) => {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: previous } : t))); // rollback
      toast(err.message, 'error');
    });
  }

  function onSaved(saved: Task, created: boolean) {
    setTasks((ts) => (created ? [...ts, saved] : ts.map((t) => (t.id === saved.id ? saved : t))));
    setModal(null);
    toast(created ? 'Task created' : 'Task saved', 'success');
  }

  function onDeleted(id: number) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    setModal(null);
    toast('Task deleted', 'success');
  }

  function clearFilters() {
    setSearch('');
    setQ('');
    setCategory('');
    setPriority('');
    setAssignee('');
  }

  const activeTask = activeId !== null ? tasks.find((t) => t.id === activeId) : undefined;

  return (
    <>
      <div className="filters">
        <input className="input" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tasks" />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category | '')} aria-label="Filter by topic">
          <option value="">All topics</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')} aria-label="Filter by priority">
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value ? Number(e.target.value) : '')}
          aria-label="Filter by assignee"
        >
          <option value="">Anyone</option>
          {team.members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.username}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Clear filters
          </button>
        )}
        <span className="spacer" />
        <button className="btn btn-primary" onClick={() => setModal({ task: null, status: 'backlog' })}>
          + New task
        </button>
      </div>

      {error && <ErrorState message={error} />}
      {!error && !loaded && <Spinner />}
      {!error && loaded && (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveId(Number(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="board">
            {STATUSES.map((s) => (
              <Column
                key={s.value}
                status={s.value}
                label={s.label}
                tasks={tasks.filter((t) => t.status === s.value)}
                members={members}
                onOpen={(task) => setModal({ task, status: task.status })}
                onAdd={(status) => setModal({ task: null, status })}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCardView task={activeTask} overlay assignee={activeTask.assignee_id ? members.get(activeTask.assignee_id) : undefined} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {modal && (
        <TaskModal
          key={modal.task?.id ?? `new-${modal.status}`}
          teamId={team.id}
          members={team.members}
          task={modal.task}
          defaultStatus={modal.status}
          onClose={() => setModal(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
