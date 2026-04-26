import { describe, expect, test, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/ThemeProvider";
import SettingsPage from "@/app/settings/page";

describe("Settings page dark mode toggle", () => {
  beforeEach(() => {
    cleanup();
    document.documentElement.dataset.theme = "light";
    window.localStorage.clear();
  });

  test("renders a dark mode toggle button", () => {
    render(
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>
    );
    const toggle = screen.getByTestId("dark-mode-toggle");
    expect(toggle).toBeInTheDocument();
  });

  test("clicking the toggle switches to dark, then back to light", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>
    );

    const toggle = screen.getByTestId("dark-mode-toggle");

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
