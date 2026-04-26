"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Link href="/" className="text-sm text-accent hover:underline">
          back
        </Link>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-70">Current theme: {theme}</span>
          <button
            data-testid="dark-mode-toggle"
            onClick={toggleTheme}
            className="rounded px-4 py-2 text-sm font-medium border border-current hover:opacity-80 transition-opacity"
          >
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </button>
        </div>
      </section>
    </div>
  );
}
