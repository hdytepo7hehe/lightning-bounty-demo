"use client";

import { useState, useMemo, useCallback } from "react";
import type { Task, SortConfig, FilterConfig } from "@/lib/types";
import { TaskItem } from "./TaskItem";
import { searchTasks } from "@/lib/search";
import { filterTasks } from "@/lib/filters";
import { sortTasks, reorderTasks } from "@/lib/sort";
import { SearchBar } from "@/components/ui/SearchBar";
import { saveTask, getTasks } from "@/lib/storage";

interface TaskListProps {
  tasks: Task[];
  projectId: string;
  onDelete?: (id: string) => void;
}

export function TaskList({ tasks, projectId, onDelete }: TaskListProps) {
  const [search, setSearch] = useState("");
  const [sortConfig] = useState<SortConfig>({ field: "status", direction: "asc" });
  const [filterConfig] = useState<FilterConfig>({});
  const [allTasks, setAllTasks] = useState<Task[]>(tasks);

  const handleReorder = useCallback((fromId: string, toId: string) => {
    const fromIndex = allTasks.findIndex(t => t.id === fromId);
    const toIndex = allTasks.findIndex(t => t.id === toId);
    
    if (fromIndex >= 0 && toIndex >= 0) {
      const reordered = reorderTasks(allTasks, fromIndex, toIndex);
      setAllTasks(reordered);
      
      // Persist to storage
      reordered.forEach(task => saveTask(task));
    }
  }, [allTasks]);

  const visible = useMemo(() => {
    let result = allTasks;
    if (search) result = searchTasks(result, search);
    result = filterTasks(result, filterConfig);
    result = sortTasks(result, sortConfig);
    return result;
  }, [allTasks, search, filterConfig, sortConfig]);

  if (allTasks.length === 0) {
    return (
      <div className="border border-dashed border-[--border] p-8 text-center">
        <p className="font-mono text-sm text-[--text-muted]">No tasks yet</p>
        <p className="mt-1 text-xs text-[--text-muted]">Create a task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search tasks..."
        className="max-w-xs"
      />
      {visible.length === 0 ? (
        <p className="font-mono text-sm text-[--text-muted] py-4">No tasks match your search</p>
      ) : (
        <div className="space-y-1 stagger">
          {visible.map((task, idx) => (
            <TaskItem
              key={task.id}
              task={task}
              projectId={projectId}
              onDelete={onDelete}
              onReorder={handleReorder}
              index={idx}
              total={visible.length}
            />
          ))}
        </div>
      )}
      <p className="font-mono text-xs text-[--text-muted]">
        {visible.length} of {allTasks.length} tasks
      </p>
    </div>
  );
}
