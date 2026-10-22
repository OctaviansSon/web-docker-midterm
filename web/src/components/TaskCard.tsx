import { useDraggable } from '@dnd-kit/core';
import type { Member, Task } from '../api/types';
import { categoryMeta, formatDate, isOverdue } from '../data/meta';
import { Avatar, PriorityBadge } from './ui';

interface Props {
  task: Task;
  assignee?: Member;
  onOpen?: (task: Task) => void;
  overlay?: boolean;
}

/** Visual card. Used both in the column (draggable) and in the drag overlay. */
export function TaskCardView({ task, assignee, overlay, dragging }: Props & { dragging?: boolean }) {
  const cat = categoryMeta(task.category);
  const overdue = isOverdue(task);
  return (
    <div
      className={`task-card${overlay ? ' is-overlay' : ''}${dragging ? ' is-dragging' : ''}${task.status === 'done' ? ' is-done' : ''}`}
      style={{ ['--c' as string]: cat.color }}
    >
      <div className="task-title">{task.title}</div>
      {task.description && <div className="task-desc">{task.description}</div>}
      <div className="task-meta">
        <span className="task-cat" style={{ color: cat.color }}>
          {cat.label}
        </span>
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className={`due${overdue ? ' overdue' : ''}`} title={overdue ? 'Overdue' : 'Due date'}>
            ⏱ {formatDate(task.due_date)}
          </span>
        )}
        <span className="spacer" />
        {assignee && <Avatar name={assignee.username} id={assignee.user_id} size={24} />}
      </div>
    </div>
  );
}

export function DraggableTaskCard({ task, assignee, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen?.(task)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(task)}
      className="task-wrap"
      data-testid={`task-${task.id}`}
    >
      <TaskCardView task={task} assignee={assignee} dragging={isDragging} />
    </div>
  );
}
