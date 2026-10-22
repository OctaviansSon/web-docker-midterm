import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const me = { id: 1, username: 'dior', email: 'dior@example.com', created_at: '2026-10-01T00:00:00Z' };
const team = { id: 7, name: 'CKA squad', description: 'Weekly mocks', owner_id: 1, created_at: '2026-10-01T00:00:00Z', members_count: 1, my_role: 'owner' };
const detail = { ...team, tasks_count: 2, members: [{ user_id: 1, username: 'dior', email: 'dior@example.com', role: 'owner', joined_at: '2026-10-01T00:00:00Z' }] };
const task = (id: number, title: string, status: string) => ({
  id, team_id: 7, title, description: '', category: 'kubernetes', priority: 'high', status,
  due_date: null, assignee_id: null, created_by_id: 1, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
});
const tasks = [task(1, 'etcd backup and restore', 'backlog'), task(2, 'Deploy an app', 'in_progress')];

const reply = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockApi() {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      calls.push(`${method} ${url}`);
      if (url === '/api/auth/login') {
        const { password } = JSON.parse(String(init!.body));
        return password === 'secret123' ? reply({ access_token: 'tok', token_type: 'bearer' }) : reply({ detail: 'Invalid email or password' }, 401);
      }
      if (url === '/api/auth/me') return reply(me);
      if (url === '/api/teams' && method === 'GET') return reply([team]);
      if (url === '/api/teams/7') return reply(detail);
      if (url.startsWith('/api/teams/7/tasks') && method === 'GET') return reply(tasks);
      if (url === '/api/teams/7/tasks' && method === 'POST') return reply({ ...task(3, JSON.parse(String(init!.body)).title, 'backlog') }, 201);
      if (url === '/api/teams/7/stats')
        return reply({
          team_id: 7, total_tasks: 2, done_tasks: 1, progress_percent: 50, overdue_tasks: 0,
          by_status: { backlog: 1, in_progress: 0, done: 1 },
          by_category: { linux: 0, networking: 0, docker: 0, kubernetes: 2, cicd: 0, aws: 0, terraform: 0, monitoring: 0, devsecops: 0, other: 0 },
          certifications: [{ name: 'CKA', done: 1, total: 2, progress_percent: 50 }],
          by_member: [{ user_id: 1, username: 'dior', assigned: 2, done: 1 }],
        });
      return reply({ detail: `unmocked ${method} ${url}` }, 404);
    }),
  );
  return calls;
}

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('web app', () => {
  beforeEach(() => mockApi());
  afterEach(() => vi.unstubAllGlobals());

  it('redirects anonymous users to the login page', async () => {
    renderApp('/teams');
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the server error for a wrong password', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(screen.getByLabelText('Email'), 'dior@example.com');
    await user.type(screen.getByLabelText('Password'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('logs in, lists teams, opens the board, creates a task and shows stats', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(screen.getByLabelText('Email'), 'dior@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // teams page
    expect(await screen.findByRole('heading', { name: 'My teams' })).toBeInTheDocument();
    await user.click(await screen.findByText('CKA squad'));

    // board with three columns, tasks in the right ones
    const backlog = await screen.findByRole('region', { name: 'Backlog' });
    expect(within(backlog).getByText('etcd backup and restore')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'In progress' })).getByText('Deploy an app')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Done' })).toBeInTheDocument();

    // create a task
    await user.click(screen.getByRole('button', { name: '+ New task' }));
    await user.type(screen.getByLabelText('Title'), 'Practice iptables');
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    expect(await screen.findByText('Practice iptables')).toBeInTheDocument();

    // stats tab
    await user.click(screen.getByRole('link', { name: 'Stats' }));
    await waitFor(() => expect(screen.getByText('50%')).toBeInTheDocument());
    expect(screen.getByText('CKA')).toBeInTheDocument();
  });

  it('filters the cheatsheet', async () => {
    const user = userEvent.setup();
    localStorage.setItem('planner_token', 'tok');
    renderApp('/cheats');
    const search = await screen.findByLabelText('Search commands');
    await user.type(search, 'terraform plan');
    expect(screen.getByText('terraform plan -out=tfplan')).toBeInTheDocument();
    expect(screen.queryByText('docker ps -a')).not.toBeInTheDocument();
  });
});
