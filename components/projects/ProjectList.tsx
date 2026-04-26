"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project, Task } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { searchProjects } from "@/lib/search";

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
}

export function ProjectList({ projects, tasks }: ProjectListProps) {
  const [search, setSearch] = useState("");

  const tasksByProject = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const task of tasks) {
      const existing = map.get(task.projectId) ?? { total: 0, done: 0 };
      map.set(task.projectId, {
        total: existing.total + 1,
        done: existing.done + (task.status === "done" ? 1 : 0),
      });
    }
    return map;
  }, [tasks]);

  const visible = useMemo(() => {
    return search ? searchProjects(projects, search) : projects;
  }, [projects, search]);

  if (projects.length === 0) {
    return (
      <div className="border border-dashed border-[--border] p-12 text-center">
        {/* Inline SVG Empty State Illustration */}
        <div className="mb-8 flex justify-center" aria-hidden="true">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[--text-muted] opacity-50"
          >
            {/* Folder with documents illustration */}
            <rect x="30" y="50" width="140" height="100" rx="8" stroke="currentColor" strokeWidth="2" />
            <path d="M 30 50 Q 30 50 50 30 L 80 30 Q 85 30 85 35 L 85 50" stroke="currentColor" strokeWidth="2" />
            {/* Document 1 */}
            <rect x="50" y="70" width="35" height="50" rx="3" fill="currentColor" opacity="0.2" />
            <line x1="60" y1="85" x2="75" y2="85" stroke="currentColor" strokeWidth="2" />
            <line x1="60" y1="95" x2="75" y2="95" stroke="currentColor" strokeWidth="2" />
            <line x1="60" y1="105" x2="70" y2="105" stroke="currentColor" strokeWidth="2" />
            {/* Document 2 */}
            <rect x="115" y="70" width="35" height="50" rx="3" fill="currentColor" opacity="0.2" />
            <line x1="125" y1="85" x2="140" y2="85" stroke="currentColor" strokeWidth="2" />
            <line x1="125" y1="95" x2="140" y2="95" stroke="currentColor" strokeWidth="2" />
            <line x1="125" y1="105" x2="135" y2="105" stroke="currentColor" strokeWidth="2" />
            {/* Plus sign in center */}
            <g opacity="0.4">
              <line x1="95" y1="135" x2="105" y2="135" stroke="currentColor" strokeWidth="3" />
              <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="3" />
            </g>
          </svg>
        </div>

        <h2 className="font-display text-2xl font-bold text-[--text] mb-2">No projects yet</h2>
        <p className="text-sm text-[--text-muted] mb-6">Create your first project to get started</p>
        <Link href="/projects/new">
          <Button
            variant="primary"
            size="md"
            aria-label="Create your first project"
          >
            Create your first project
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Search projects..." />
      {visible.length === 0 ? (
        <p className="font-mono text-sm text-[--text-muted] py-4">No projects match your search</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {visible.map((project) => {
            const counts = tasksByProject.get(project.id) ?? { total: 0, done: 0 };
            return (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={counts.total}
                doneCount={counts.done}
              />
            );
          })}
        </div>
      )}
      <p className="font-mono text-xs text-[--text-muted]">
        {visible.length} of {projects.length} projects
      </p>
    </div>
  );
}
