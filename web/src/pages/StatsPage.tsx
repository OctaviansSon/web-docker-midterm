import { useEffect, useState } from 'react';
import { api } from '../api/api';
import type { Stats } from '../api/types';
import { ErrorState, ProgressBar, Spinner } from '../components/ui';
import { CATEGORIES, STATUSES } from '../data/meta';
import { useTeamContext } from './teamContext';

const STATUS_COLOR = { backlog: '#94A3B8', in_progress: '#FBBF24', done: '#2DD4BF' } as const;

export default function StatsPage() {
  const { team } = useTeamContext();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .stats(team.id)
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, [team.id]);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <Spinner />;

  const maxCat = Math.max(1, ...Object.values(stats.by_category));
  const activeCategories = CATEGORIES.filter((c) => stats.by_category[c.value] > 0);

  return (
    <div className="stats">
      <section className="hero">
        <div>
          <div className="hero-caption">$ devops-study --status</div>
          <div className="hero-number">{Math.round(stats.progress_percent)}%</div>
          <div className="muted">
            {stats.done_tasks} of {stats.total_tasks} tasks shipped
          </div>
        </div>
        <div className="hero-side">
          <div className={`stat-chip${stats.overdue_tasks > 0 ? ' danger' : ''}`}>
            <strong>{stats.overdue_tasks}</strong> overdue
          </div>
        </div>
        <div className="hero-bar">
          <ProgressBar percent={stats.progress_percent} />
        </div>
      </section>

      <section className="panel">
        <h2>Pipeline</h2>
        <div className="pipeline">
          {STATUSES.map((s, i) => (
            <div key={s.value} className="pipeline-step">
              <div className="stage" style={{ borderColor: STATUS_COLOR[s.value] }}>
                <strong>{stats.by_status[s.value]}</strong>
                <span>{s.label}</span>
              </div>
              {i < STATUSES.length - 1 && <span className="arrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Certification goals</h2>
        {stats.certifications.map((c) => (
          <div key={c.name} className="stat-row">
            <div className="stat-row-head">
              <strong>{c.name}</strong>
              <span className="muted">
                {c.done} / {c.total} tasks
              </span>
            </div>
            <ProgressBar percent={c.progress_percent} />
          </div>
        ))}
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>By topic</h2>
          {activeCategories.length === 0 && <p className="muted">No tasks yet.</p>}
          {activeCategories.map((c) => (
            <div key={c.value} className="bar-row">
              <span className="bar-label" style={{ color: c.color }}>
                {c.label}
              </span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(stats.by_category[c.value] / maxCat) * 100}%`, background: c.color }} />
              </div>
              <span className="bar-value">{stats.by_category[c.value]}</span>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2>By member</h2>
          {stats.by_member.map((m) => (
            <div key={m.user_id} className="stat-row">
              <div className="stat-row-head">
                <strong>{m.username}</strong>
                <span className="muted">
                  {m.done} / {m.assigned} done
                </span>
              </div>
              <ProgressBar percent={m.assigned ? (m.done / m.assigned) * 100 : 0} color="var(--secondary)" />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
