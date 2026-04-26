"use client";

import { useState } from "react";
import Link from "next/link";
import { TodoItem, type Todo } from "@/components/TodoItem";

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Read the bounty spec", done: true },
    { id: "2", text: "Add dark mode toggle", done: false },
  ]);
  const [input, setInput] = useState("");

  const add = () => {
    const text = input.trim();
    if (!text) return;
    setTodos([...todos, { id: crypto.randomUUID(), text, done: false }]);
    setInput("");
  };

  const toggle = (id: string) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: string) => setTodos(todos.filter((t) => t.id !== id));

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Todos</h1>
        <Link href="/settings" className="text-sm text-accent hover:underline">
          settings
        </Link>
      </header>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="What needs doing?"
          className="flex-1 rounded border border-fg/20 bg-transparent px-3 py-2"
        />
        <button
          onClick={add}
          className="rounded bg-accent px-4 py-2 font-medium text-bg"
        >
          add
        </button>
      </div>

      <ul>
        {todos.map((t) => (
          <TodoItem
            key={t.id}
            todo={t}
            onToggle={toggle}
            onDelete={remove}
          />
        ))}
      </ul>
    </div>
  );
}
