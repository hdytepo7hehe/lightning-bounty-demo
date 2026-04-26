"use client";

import { useState, useMemo } from "react";
import type { Task, SortConfig, FilterConfig } from "@/lib/types";
import { TaskItem } from "./TaskItem";
import { searchTasks } from "@/lib/search";
import { filterTasks } from "@/lib/filters";
import { sortTasks } from "@/lib/sort";
import { saveTask } from "@/lib/storage";
import { SearchBar } from "@/components/ui/SearchBar";

interface TaskListProps {
  tasks: Task[];
  projectId: string;
  onDelete?: (id: string) => void;
}

export function TaskList({ tasks, projectId, onDelete }: TaskListProps) {
  const [search, setSearch] = useState("");
  const [sortConfig] = useState<SortConfig>({ field: "status", direction: "asc" });
  const [filterConfig] = useState<FilterConfig>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    let result = tasks;
    if (search) result = searchTasks(result, search);
    result = filterTasks(result, filterConfig);
    result = sortTasks(result, sortConfig);
    return result;
  }, [tasks, search, filterConfig, sortConfig]);

  const allVisibleSelected = visible.length > 0 && visible.every((t) => selectedIds.has(t.id));
  const hasSelection = selectedIds.size > 0;

  function handleToggleSelect(id: string, selected: boolean) {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  }

  function handleSelectAll(selected: boolean) {
    const newSelected = new Set<string>();
    if (selected) {
      visible.forEach((t) => newSelected.add(t.id));
    }
    setSelectedIds(newSelected);
  }

  function handleMarkAllDone() {
    const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));
    const now = new Date().toISOString();
    selectedTasks.forEach((task) => {
      const updated = { ...task, status: "done" as const, updatedAt: now };
      saveTask(updated);
    });
    setSelectedIds(new Set());
  }

  function handleDeleteSelected() {
    const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));
    selectedTasks.forEach((task) => {
      if (onDelete) onDelete(task.id);
    });
    setSelectedIds(new Set());
  }

  function handleAddTag() {
    const tagName = prompt("Enter tag name:");
    if (!tagName) return;
    const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));
    const now = new Date().toISOString();
    selectedTasks.forEach((task) => {
      const tagId = `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newTag = { id: tagId, name: tagName, color: "zinc" };
      const updated = { ...task, tags: [...task.tags, newTag], updatedAt: now };
      saveTask(updated);
    });
    setSelectedIds(new Set());
  }

  if (tasks.length === 0) {
    return (
      <div className="border border-dashed border-[--border] p-8 text-center">
        <p className="font-mono text-sm text-[--text-muted]">No tasks yet</p>
        <p className="mt-1 text-xs text-[--text-muted]">Create a task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search tasks..."
          className="max-w-xs flex-1"
        />
        {/* Select All Checkbox */}
        {visible.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 accent-[--accent]"
              aria-label="Select all tasks"
            />
            <span className="font-mono text-xs text-[--text-muted]">Select all</span>
          </label>
        )}
      </div>
      {visible.length === 0 ? (
        <p className="font-mono text-sm text-[--text-muted] py-4">No tasks match your search</p>
      ) : (
        <div className="space-y-1 stagger">
          {visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              projectId={projectId}
              onDelete={onDelete}
              isSelected={selectedIds.has(task.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[--text-muted]">
          {visible.length} of {tasks.length} tasks
        </p>
        {/* Bulk Action Bar */}
        {hasSelection && (
          <div className="flex items-center gap-2 p-2 rounded border border-[--accent] bg-[--accent] bg-opacity-5">
            <span className="font-mono text-xs text-[--text-muted]">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleMarkAllDone}
              className="px-2 py-1 text-xs font-medium text-[--text] bg-[--accent] hover:bg-opacity-90 rounded transition-colors"
              aria-label="Mark selected tasks as done"
            >
              ✓ Done
            </button>
            <button
              onClick={handleAddTag}
              className="px-2 py-1 text-xs font-medium text-[--text] bg-[--accent] hover:bg-opacity-90 rounded transition-colors"
              aria-label="Add tag to selected tasks"
            >
              + Tag
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
              aria-label="Delete selected tasks"
            >
              ✕ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
