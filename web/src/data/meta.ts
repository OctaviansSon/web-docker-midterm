import type { Category, Priority, Status, Task } from '../api/types';

export const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'linux', label: 'Linux', color: '#FBBF24' },
  { value: 'networking', label: 'Networking', color: '#A78BFA' },
  { value: 'docker', label: 'Docker', color: '#38BDF8' },
  { value: 'kubernetes', label: 'Kubernetes', color: '#3B82F6' },
  { value: 'cicd', label: 'CI/CD', color: '#34D399' },
  { value: 'aws', label: 'AWS', color: '#FB923C' },
  { value: 'terraform', label: 'Terraform', color: '#C084FC' },
  { value: 'monitoring', label: 'Monitoring', color: '#F472B6' },
  { value: 'devsecops', label: 'DevSecOps', color: '#F87171' },
  { value: 'other', label: 'Other', color: '#94A3B8' },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export const categoryMeta = (c: Category) => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1];
export const statusLabel = (s: Status) => STATUSES.find((x) => x.value === s)?.label ?? s;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date as YYYY-MM-DD (the format the API uses for due_date). */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isOverdue(task: Pick<Task, 'due_date' | 'status'>, today: string = todayISO()): boolean {
  return !!task.due_date && task.status !== 'done' && task.due_date < today;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
