import { describe, expect, it } from 'vitest';
import { categoryMeta, isOverdue, todayISO } from '../data/meta';
import { CHEATSHEET } from '../data/cheatsheet';

describe('meta helpers', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 9, 5))).toBe('2026-10-05');
  });

  it('flags overdue tasks only when not done', () => {
    expect(isOverdue({ due_date: '2020-01-01', status: 'backlog' }, '2026-10-21')).toBe(true);
    expect(isOverdue({ due_date: '2020-01-01', status: 'done' }, '2026-10-21')).toBe(false);
    expect(isOverdue({ due_date: '2030-01-01', status: 'in_progress' }, '2026-10-21')).toBe(false);
    expect(isOverdue({ due_date: null, status: 'backlog' }, '2026-10-21')).toBe(false);
  });

  it('knows every cheatsheet topic', () => {
    expect(CHEATSHEET.length).toBeGreaterThan(20);
    CHEATSHEET.forEach((c) => expect(categoryMeta(c.topic).value).toBe(c.topic));
  });
});
