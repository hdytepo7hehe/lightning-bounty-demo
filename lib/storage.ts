import type { Project, Task } from "./types";
import { SEED_PROJECTS, SEED_TASKS } from "./seed";

const PROJECTS_KEY = "pt_projects";
const TASKS_KEY = "pt_tasks";
const MIGRATION_FLAG_KEY = "pt_migration_complete";
const DB_NAME = "pt-storage";
const DB_VERSION = 1;
const STORE_NAME = "data";

let db: IDBDatabase | null = null;
let useIndexedDB = true;
let indexedDBInitialized = false;
let initPromise: Promise<void> | null = null;

// In-memory cache for synchronous operations during initialization
const cache: Map<string, any> = new Map();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Initialize IndexedDB and perform migration from localStorage if needed
 */
function initIndexedDB(): Promise<void> {
  if (indexedDBInitialized) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    if (!isBrowser()) {
      indexedDBInitialized = true;
      resolve();
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn("IndexedDB not available, falling back to localStorage");
        useIndexedDB = false;
        indexedDBInitialized = true;
        resolve();
      };

      request.onsuccess = () => {
        db = request.result;
        performMigration();
        indexedDBInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const upgradeDB = (event.target as IDBOpenDBRequest).result;
        if (!upgradeDB.objectStoreNames.contains(STORE_NAME)) {
          upgradeDB.createObjectStore(STORE_NAME);
        }
      };
    } catch {
      console.warn("IndexedDB initialization failed, falling back to localStorage");
      useIndexedDB = false;
      indexedDBInitialized = true;
      resolve();
    }
  });

  return initPromise;
}

/**
 * Migrate data from localStorage to IndexedDB on first load
 */
function performMigration(): void {
  if (!db || !isBrowser()) return;

  const migrationFlag = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrationFlag === "true") return; // Already migrated

  try {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Migrate projects
    const projects = localStorage.getItem(PROJECTS_KEY);
    if (projects) {
      const parsed = JSON.parse(projects);
      store.put(parsed, PROJECTS_KEY);
      cache.set(PROJECTS_KEY, parsed);
    }

    // Migrate tasks
    const tasks = localStorage.getItem(TASKS_KEY);
    if (tasks) {
      const parsed = JSON.parse(tasks);
      store.put(parsed, TASKS_KEY);
      cache.set(TASKS_KEY, parsed);
    }

    transaction.oncomplete = () => {
      localStorage.setItem(MIGRATION_FLAG_KEY, "true");
    };
  } catch {
    console.warn("Migration failed, continuing with current storage");
  }
}

/**
 * Read JSON from storage (IndexedDB or localStorage)
 */
function readJSON<T>(key: string): T | null {
  if (!isBrowser()) return null;

  // Check cache first
  if (cache.has(key)) {
    return cache.get(key) as T;
  }

  // Fall back to localStorage (will be used until IndexedDB is ready)
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    cache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeJSON<T>(key: string, data: T): void {
  if (!isBrowser()) return;

  // Always update cache
  cache.set(key, data);

  // Always write to localStorage for fallback
  localStorage.setItem(key, JSON.stringify(data));

  // Also write to IndexedDB asynchronously if available
  if (useIndexedDB && db && indexedDBInitialized) {
    try {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put(data, key);
    } catch {
      // Silently fail if IndexedDB write fails, localStorage has it
    }
  }
}

// Seed on first load — runs once per browser session
function ensureSeeded(): void {
  if (!isBrowser()) return;

  // Initialize IndexedDB in the background (non-blocking)
  if (!indexedDBInitialized) {
    initIndexedDB();
  }

  if (localStorage.getItem(PROJECTS_KEY) === null) {
    writeJSON(PROJECTS_KEY, SEED_PROJECTS);
    writeJSON(TASKS_KEY, SEED_TASKS);
  }
}

// Projects
export function getProjects(): Project[] {
  ensureSeeded();
  return readJSON<Project[]>(PROJECTS_KEY) ?? [];
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  writeJSON(PROJECTS_KEY, projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  writeJSON(PROJECTS_KEY, projects);
  // Cascade delete tasks
  const tasks = getTasks().filter((t) => t.projectId !== id);
  writeJSON(TASKS_KEY, tasks);
}

// Tasks
export function getTasks(projectId?: string): Task[] {
  ensureSeeded();
  const all = readJSON<Task[]>(TASKS_KEY) ?? [];
  return projectId ? all.filter((t) => t.projectId === projectId) : all;
}

export function getTask(id: string): Task | null {
  return getTasks().find((t) => t.id === id) ?? null;
}

export function saveTask(task: Task): void {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.push(task);
  }
  writeJSON(TASKS_KEY, tasks);
}

export function deleteTask(id: string): void {
  const tasks = getTasks().filter((t) => t.id !== id);
  writeJSON(TASKS_KEY, tasks);
}

export function clearAll(): void {
  if (!isBrowser()) return;
  cache.clear();
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(TASKS_KEY);

  if (useIndexedDB && db && indexedDBInitialized) {
    try {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete(PROJECTS_KEY);
      store.delete(TASKS_KEY);
    } catch {
      // Silently fail
    }
  }
}

export function exportRaw(): { projects: Project[]; tasks: Task[] } {
  return { projects: getProjects(), tasks: getTasks() };
}
