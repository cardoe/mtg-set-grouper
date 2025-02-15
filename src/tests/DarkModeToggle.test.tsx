import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DarkModeToggle from "../components/DarkModeToggle";

describe("Dark Mode Toggle (Default: Dark Mode)", () => {
  beforeEach(() => {
    localStorage.clear(); // ✅ Reset theme before each test
    document.documentElement.removeAttribute("data-bs-theme"); // ✅ Reset theme attribute
  });

  test("Starts in dark mode by default", () => {
    render(<DarkModeToggle />);
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
  });

  test("Switches to light mode when clicked", async () => {
    render(<DarkModeToggle />);
    const button = screen.getByRole("button");

    await userEvent.click(button);

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
    expect(localStorage.getItem("darkMode")).toBe("false"); // ✅ Ensure persistence
  });

  test("Persists light mode after reload", () => {
    localStorage.setItem("darkMode", "false");
    render(<DarkModeToggle />);

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
  });
});
