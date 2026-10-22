export type Category =
  | 'linux' | 'networking' | 'docker' | 'kubernetes' | 'cicd'
  | 'aws' | 'terraform' | 'monitoring' | 'devsecops' | 'other';
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'backlog' | 'in_progress' | 'done';
export type Role = 'owner' | 'member';

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
  members_count: number;
  my_role: Role;
}

export interface Member {
  user_id: number;
  username: string;
  email: string;
  role: Role;
  joined_at: string;
}

export interface TeamDetail extends Team {
  members: Member[];
  tasks_count: number;
}

export interface Task {
  id: number;
  team_id: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  due_date: string | null;
  assignee_id: number | null;
  created_by_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  due_date: string | null;
  assignee_id: number | null;
}

export interface TaskFilters {
  q?: string;
  category?: Category | '';
  priority?: Priority | '';
  assignee_id?: number | '';
}

export interface CertificationStat {
  name: string;
  done: number;
  total: number;
  progress_percent: number;
}

export interface Stats {
  team_id: number;
  total_tasks: number;
  done_tasks: number;
  progress_percent: number;
  overdue_tasks: number;
  by_status: Record<Status, number>;
  by_category: Record<Category, number>;
  certifications: CertificationStat[];
  by_member: { user_id: number; username: string; assigned: number; done: number }[];
}
