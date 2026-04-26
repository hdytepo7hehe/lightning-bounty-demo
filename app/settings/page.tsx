"use client";

import Link from "next/link";

export default function SettingsPage() {
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
        <p className="text-sm opacity-70">
          Theme preferences will appear here.
        </p>
        {/* TODO: add a dark mode toggle that uses useTheme() from components/ThemeProvider */}
      </section>
    </div>
  );
}
