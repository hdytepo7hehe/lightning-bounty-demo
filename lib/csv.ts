import type { Task, Project } from "./types";

// Generate a simple UUID without external deps
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function escapeCell(value: string | null | undefined): string {
  const s = value ?? "";
  // Wrap in quotes if contains comma, quote, or newline
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(cells: string[]): string {
  return cells.map(escapeCell).join(",");
}

export function tasksToCSV(tasks: Task[], projects: Project[]): string {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const headers = [
    "id",
    "project",
    "title",
    "description",
    "status",
    "priority",
    "assignee",
    "tags",
    "dueDate",
    "createdAt",
    "updatedAt",
  ];
  const lines = [headers.join(",")];

  for (const task of tasks) {
    lines.push(
      row([
        task.id,
        projectMap.get(task.projectId) ?? task.projectId,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.assignee,
        task.tags.map((t) => t.name).join(";"),
        task.dueDate ?? "",
        task.createdAt,
        task.updatedAt,
      ])
    );
  }

  return lines.join("\n");
}

export function projectsToCSV(projects: Project[]): string {
  const headers = ["id", "name", "description", "status", "tags", "createdAt", "updatedAt"];
  const lines = [headers.join(",")];

  for (const p of projects) {
    lines.push(
      row([
        p.id,
        p.name,
        p.description,
        p.status,
        p.tags.map((t) => t.name).join(";"),
        p.createdAt,
        p.updatedAt,
      ])
    );
  }

  return lines.join("\n");
}

// CSV Import Parsers
function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export function parseTasksCSV(csv: string): { tasks: Partial<Task>[]; errors: string[] } {
  const lines = csv.trim().split("\n");
  const errors: string[] = [];
  const tasks: Partial<Task>[] = [];

  if (lines.length === 0) {
    errors.push("Empty CSV file");
    return { tasks, errors };
  }

  const headers = parseCSVLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length === 0 || (cells.length === 1 && cells[0] === "")) continue;

    try {
      const obj: Record<string, string> = {};
      for (let j = 0; j < Math.min(cells.length, headers.length); j++) {
        obj[headers[j]] = cells[j] || "";
      }

      // Validate required fields
      if (!obj.title?.trim()) {
        errors.push(`Row ${i + 1}: Missing title`);
        continue;
      }
      if (!obj.project?.trim()) {
        errors.push(`Row ${i + 1}: Missing project`);
        continue;
      }

      tasks.push({
        id: obj.id || generateId(),
        projectId: obj.project,
        title: obj.title,
        description: obj.description || "",
        status: (obj.status || "todo") as any,
        priority: (obj.priority || "medium") as any,
        assignee: obj.assignee || "",
        tags: obj.tags
          ? obj.tags.split(";").map((name) => ({
              id: generateId(),
              name: name.trim(),
              color: "#999",
            }))
          : [],
        dueDate: obj.dueDate || null,
        createdAt: obj.createdAt || new Date().toISOString(),
        updatedAt: obj.updatedAt || new Date().toISOString(),
      });
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Invalid data"}`);
    }
  }

  return { tasks, errors };
}

export function parseProjectsCSV(csv: string): { projects: Partial<Project>[]; errors: string[] } {
  const lines = csv.trim().split("\n");
  const errors: string[] = [];
  const projects: Partial<Project>[] = [];

  if (lines.length === 0) {
    errors.push("Empty CSV file");
    return { projects, errors };
  }

  const headers = parseCSVLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length === 0 || (cells.length === 1 && cells[0] === "")) continue;

    try {
      const obj: Record<string, string> = {};
      for (let j = 0; j < Math.min(cells.length, headers.length); j++) {
        obj[headers[j]] = cells[j] || "";
      }

      // Validate required fields
      if (!obj.name?.trim()) {
        errors.push(`Row ${i + 1}: Missing name`);
        continue;
      }

      projects.push({
        id: obj.id || generateId(),
        name: obj.name,
        description: obj.description || "",
        status: (obj.status || "active") as any,
        tags: obj.tags
          ? obj.tags.split(";").map((name) => ({
              id: generateId(),
              name: name.trim(),
              color: "#999",
            }))
          : [],
        createdAt: obj.createdAt || new Date().toISOString(),
        updatedAt: obj.updatedAt || new Date().toISOString(),
      });
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Invalid data"}`);
    }
  }

  return { projects, errors };
}
