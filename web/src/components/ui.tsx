import type { ReactNode } from 'react';
import type { Priority } from '../api/types';
import { PRIORITIES } from '../data/meta';

const AVATAR_COLORS = ['#2DD4BF', '#60A5FA', '#FBBF24', '#F472B6', '#A78BFA', '#FB923C', '#34D399'];

export function Avatar({ name, id, size = 28 }: { name: string; id: number; size?: number }) {
  return (
    <span
      className="avatar"
      title={name}
      style={{ width: size, height: size, background: AVATAR_COLORS[id % AVATAR_COLORS.length], fontSize: size * 0.46 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = PRIORITIES.find((p) => p.value === priority)?.label ?? priority;
  return <span className={`badge badge-${priority}`}>{label}</span>;
}

export function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: color }} />
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="center-note">
      <span className="spinner" aria-hidden /> {label}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{'>_'}</div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon danger">!</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
