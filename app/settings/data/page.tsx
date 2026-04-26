"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { exportRaw, clearAll, saveTask, saveProject, getTasks, getProjects } from "@/lib/storage";
import { tasksToCSV, projectsToCSV, parseTasksCSV, parseProjectsCSV } from "@/lib/csv";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DataPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [importing, setImporting] = useState(false);
  const tasksFileRef = useRef<HTMLInputElement>(null);
  const projectsFileRef = useRef<HTMLInputElement>(null);

  function handleExportTasks() {
    const { projects, tasks } = exportRaw();
    downloadCSV(tasksToCSV(tasks, projects), "project-tracker-tasks.csv");
    showToast("Tasks exported as CSV", "success");
  }

  function handleExportProjects() {
    const { projects } = exportRaw();
    downloadCSV(projectsToCSV(projects), "project-tracker-projects.csv");
    showToast("Projects exported as CSV", "success");
  }

  function handleImportTasks() {
    const file = tasksFileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const { tasks, errors } = parseTasksCSV(csv);

        if (errors.length > 0) {
          // Show toast with first error, but still import valid rows
          showToast(`Skipped ${errors.length} malformed row(s)`, "warning");
        }

        // Import valid tasks
        let imported = 0;
        for (const task of tasks) {
          if (task.id && task.projectId && task.title) {
            saveTask(task as any);
            imported++;
          }
        }

        if (imported > 0) {
          showToast(`Imported ${imported} task(s)`, "success");
          setTimeout(() => router.refresh(), 500);
        } else {
          showToast("No valid tasks to import", "warning");
        }
      } catch (error) {
        showToast("Failed to parse CSV file", "error");
      } finally {
        setImporting(false);
        if (tasksFileRef.current) tasksFileRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function handleImportProjects() {
    const file = projectsFileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const { projects, errors } = parseProjectsCSV(csv);

        if (errors.length > 0) {
          showToast(`Skipped ${errors.length} malformed row(s)`, "warning");
        }

        // Import valid projects
        let imported = 0;
        for (const project of projects) {
          if (project.id && project.name) {
            saveProject(project as any);
            imported++;
          }
        }

        if (imported > 0) {
          showToast(`Imported ${imported} project(s)`, "success");
          setTimeout(() => router.refresh(), 500);
        } else {
          showToast("No valid projects to import", "warning");
        }
      } catch (error) {
        showToast("Failed to parse CSV file", "error");
      } finally {
        setImporting(false);
        if (projectsFileRef.current) projectsFileRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function handleClear() {
    if (!confirm("Clear all data? This cannot be undone.")) return;
    setClearing(true);
    clearAll();
    showToast("All data cleared", "info");
    // Reload to reseed
    setTimeout(() => { router.push("/"); }, 500);
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-[--text] mb-6">Data</h1>

      <section className="mb-8">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[--text-muted] mb-3">Export</h2>
        <div className="border border-[--border] bg-[--surface] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[--text]">Export tasks as CSV</p>
              <p className="text-xs text-[--text-muted]">All tasks with project names, status, priority</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportTasks} aria-label="Export tasks CSV">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between border-t border-[--border] pt-3">
            <div>
              <p className="text-sm font-medium text-[--text]">Export projects as CSV</p>
              <p className="text-xs text-[--text-muted]">All projects with metadata</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportProjects} aria-label="Export projects CSV">
              Export
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[--text-muted] mb-3">Import</h2>
        <div className="border border-[--border] bg-[--surface] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[--text]">Import tasks from CSV</p>
              <p className="text-xs text-[--text-muted]">Matches export format; malformed rows are skipped</p>
            </div>
            <div className="flex gap-2 items-center">
              <input
                ref={tasksFileRef}
                type="file"
                accept=".csv"
                onChange={handleImportTasks}
                disabled={importing}
                className="hidden"
                aria-label="Select tasks CSV file"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => tasksFileRef.current?.click()}
                disabled={importing}
                aria-label="Import tasks CSV"
              >
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[--border] pt-3">
            <div>
              <p className="text-sm font-medium text-[--text]">Import projects from CSV</p>
              <p className="text-xs text-[--text-muted]">Matches export format; malformed rows are skipped</p>
            </div>
            <div className="flex gap-2 items-center">
              <input
                ref={projectsFileRef}
                type="file"
                accept=".csv"
                onChange={handleImportProjects}
                disabled={importing}
                className="hidden"
                aria-label="Select projects CSV file"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => projectsFileRef.current?.click()}
                disabled={importing}
                aria-label="Import projects CSV"
              >
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-[--text-muted] mb-3">Danger Zone</h2>
        <div className="border border-red-200 dark:border-red-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[--text]">Clear all data</p>
              <p className="text-xs text-[--text-muted]">Removes all projects and tasks. Seed data will reload.</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClear}
              disabled={clearing}
              aria-label="Clear all data"
            >
              Clear
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
