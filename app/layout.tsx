import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata = {
  title: "Todo App",
  description: "Demo todo app for Lightning Bounty Marketplace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <main className="mx-auto max-w-xl px-6 py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
