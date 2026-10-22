import { request } from './client';
import type { Member, Stats, Status, Task, TaskFilters, TaskInput, Team, TeamDetail, User } from './types';

function query(params: Record<string, string | number | undefined | ''>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  // auth
  register: (b: { username: string; email: string; password: string }) =>
    request<User>('/api/auth/register', { method: 'POST', body: b, auth: false }),
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
  me: () => request<User>('/api/auth/me'),

  // teams
  listTeams: () => request<Team[]>('/api/teams'),
  createTeam: (b: { name: string; description: string }) => request<Team>('/api/teams', { method: 'POST', body: b }),
  getTeam: (id: number) => request<TeamDetail>(`/api/teams/${id}`),
  updateTeam: (id: number, b: { name?: string; description?: string }) =>
    request<Team>(`/api/teams/${id}`, { method: 'PUT', body: b }),
  deleteTeam: (id: number) => request<void>(`/api/teams/${id}`, { method: 'DELETE' }),
  addMember: (teamId: number, email: string) =>
    request<Member>(`/api/teams/${teamId}/members`, { method: 'POST', body: { email } }),
  removeMember: (teamId: number, userId: number) =>
    request<void>(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

  // tasks
  listTasks: (teamId: number, f: TaskFilters = {}) =>
    request<Task[]>(
      `/api/teams/${teamId}/tasks${query({
        q: f.q?.trim(),
        category: f.category,
        priority: f.priority,
        assignee_id: f.assignee_id,
      })}`,
    ),
  createTask: (teamId: number, b: TaskInput) =>
    request<Task>(`/api/teams/${teamId}/tasks`, { method: 'POST', body: b }),
  updateTask: (id: number, b: Partial<TaskInput>) => request<Task>(`/api/tasks/${id}`, { method: 'PUT', body: b }),
  setStatus: (id: number, status: Status) =>
    request<Task>(`/api/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteTask: (id: number) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),

  // stats
  stats: (teamId: number) => request<Stats>(`/api/teams/${teamId}/stats`),
};
