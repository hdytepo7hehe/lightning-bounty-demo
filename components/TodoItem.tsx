"use client";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 border-b border-fg/10 py-2">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        aria-label={`Toggle ${todo.text}`}
      />
      <span className={todo.done ? "line-through opacity-60" : ""}>
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="ml-auto text-sm text-accent hover:underline"
        aria-label={`Delete ${todo.text}`}
      >
        delete
      </button>
    </li>
  );
}
