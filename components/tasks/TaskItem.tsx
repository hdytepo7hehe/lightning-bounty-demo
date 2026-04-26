"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Task } from "@/lib/types";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TagBadge } from "@/components/tags/TagBadge";

interface TaskItemProps {
  task: Task;
  projectId: string;
  onDelete?: (id: string) => void;
  onReorder?: (fromId: string, toId: string) => void;
  index?: number;
  total?: number;
}

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-zinc-400",
};

export function TaskItem({ task, projectId, onDelete, onReorder, index = 0, total = 1 }: TaskItemProps) {
  const dragRef = useRef<HTMLDivElement>(null);
  const draggedTaskId = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    draggedTaskId.current = task.id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedTaskId.current && draggedTaskId.current !== task.id && onReorder) {
      onReorder(draggedTaskId.current, task.id);
      draggedTaskId.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.altKey || e.metaKey) && !onReorder) return;
    
    if (e.altKey) {
      if (e.key === "ArrowUp" && index > 0 && onReorder) {
        e.preventDefault();
        // Get the task above
        const siblings = dragRef.current?.parentElement?.children;
        if (siblings && index > 0) {
          const prevTask = (siblings[index - 1] as HTMLElement)?.querySelector('[data-task-id]');
          if (prevTask?.getAttribute('data-task-id')) {
            onReorder(task.id, prevTask.getAttribute('data-task-id')!);
          }
        }
      } else if (e.key === "ArrowDown" && index < total - 1 && onReorder) {
        e.preventDefault();
        // Get the task below
        const siblings = dragRef.current?.parentElement?.children;
        if (siblings && index < total - 1) {
          const nextTask = (siblings[index + 2] as HTMLElement)?.querySelector('[data-task-id]');
          if (nextTask?.getAttribute('data-task-id')) {
            onReorder(task.id, nextTask.getAttribute('data-task-id')!);
          }
        }
      }
    }
  };

  return (
    <div
      ref={dragRef}
      data-task-id={task.id}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="border border-[--border] bg-[--surface] px-4 py-3 flex items-start gap-3 group hover:border-[--accent] transition-colors cursor-grab active:cursor-grabbing focus:outline-none focus:border-[--accent]"
      role="button"
      aria-label={`Task: ${task.title}. Drag to reorder or use Alt+Up/Down for keyboard navigation.`}
    >
      {/* Priority indicator */}
      <span
        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${priorityDot[task.priority]}`}
        title={`Priority: ${task.priority}`}
        aria-label={`Priority: ${task.priority}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/projects/${projectId}/tasks/${task.id}`}
            className="font-medium text-sm text-[--text] hover:text-[--accent] transition-colors truncate"
          >
            {task.title}
          </Link>
          <TaskStatusBadge status={task.status} />
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-[--text-muted] line-clamp-1">{task.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {task.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          {task.assignee && (
            <span className="font-mono text-xs text-[--text-muted]">{task.assignee}</span>
          )}
          {task.dueDate && (
            <span className="font-mono text-xs text-[--text-muted]">due {task.dueDate}</span>
          )}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-[--text-muted] hover:text-red-500 text-xs transition-all"
          aria-label={`Delete task ${task.title}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
