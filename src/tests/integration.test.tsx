import { describe, test, expect, beforeEach } from "vitest";
import { render, queryByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("Integration Tests - App Functionality", () => {
  beforeEach(() => {
    localStorage.clear(); // Reset storage before each test
  });

  test("Filters by price and updates displayed cards", async () => {
    render(<App />);

    // Find the textarea using the correct placeholder text
    const textarea = screen.getByPlaceholderText(/1 Evolving Wilds \(INR\)/i);
    await userEvent.type(textarea, "1 Evolving Wilds (INR)\n2 Delighted Halfling (XYZ)");

    // Click "Group Cards by Set"
    const groupButton = screen.getByText(/Group Cards by Set/i);
    await userEvent.click(groupButton);

    // Get the card results section
    const resultsSection = screen.getByTestId("card-results");

    // Wait for multiple "Evolving Wilds" instances to appear
    const evolvingWildsElements = await screen.findAllByText("Evolving Wilds");
    expect(evolvingWildsElements.length).toBeGreaterThan(0);

    // Uncheck "$$" filter
    const priceFilter = screen.getByLabelText("$$");
    await userEvent.click(priceFilter);

    // Expect "Delighted Halfling" (which is $$) to be removed
    await waitFor(() => {
      expect(queryByText(resultsSection, "Delighted Halfling")).toBeNull();
    });
  });

  test("Deselecting a card removes it from all sets", async () => {
    render(<App />);

    // Find the textarea using the correct placeholder text
    const textarea = screen.getByPlaceholderText(/1 Evolving Wilds \(INR\)/i);
    await userEvent.type(textarea, "1 Evolving Wilds (INR)\n1 Banishing Light (ABC)");

    // Click "Group Cards by Set"
    const groupButton = screen.getByText(/Group Cards by Set/i);
    await userEvent.click(groupButton);

    // Wait for multiple "Evolving Wilds" instances
    const evolvingWildsElements = await screen.findAllByText("Evolving Wilds");
    expect(evolvingWildsElements.length).toBeGreaterThan(1);

    // Click the first instance of "Evolving Wilds"
    const checkboxes = screen.getAllByRole("checkbox", { name: /Evolving Wilds/i });
    await userEvent.click(checkboxes[0]);

    // Expect all instances of "Evolving Wilds" to be removed
    expect(screen.queryByText("Evolving Wilds")).toBeNull();
  });

  test("Clicking a card name displays its image", async () => {
    render(<App />);

    // Find the textarea using the correct placeholder text
    const textarea = screen.getByPlaceholderText(/1 Evolving Wilds \(INR\)/i);
    await userEvent.type(textarea, "1 Evolving Wilds (INR)");

    // Click "Group Cards by Set"
    const groupButton = screen.getByText(/Group Cards by Set/i);
    await userEvent.click(groupButton);

    // Wait for multiple instances of "Evolving Wilds"
    const evolvingWildsElements = await screen.findAllByText("Evolving Wilds");

    // Click the first instance to open the image
    await userEvent.click(evolvingWildsElements[0]);

    // Expect an image to be displayed
    const cardImage = screen.getByRole("img");
    expect(cardImage).toBeTruthy();
  });

  test("Clicking outside the image closes it", async () => {
    render(<App />);

    // Find the textarea using the correct placeholder text
    const textarea = screen.getByPlaceholderText(/1 Evolving Wilds \(INR\)/i);
    await userEvent.type(textarea, "1 Evolving Wilds (INR)");

    // Click "Group Cards by Set"
    const groupButton = screen.getByText(/Group Cards by Set/i);
    await userEvent.click(groupButton);

    // Wait for multiple instances of "Evolving Wilds"
    const evolvingWildsElements = await screen.findAllByText("Evolving Wilds");

    // Click the first instance to open the image
    await userEvent.click(evolvingWildsElements[0]);

    // Expect image to be displayed
    const cardImage = screen.getByRole("img");
    expect(cardImage).toBeTruthy();

    // Click outside image to close it
    await userEvent.click(screen.getByTestId("modal-backdrop"));

    // Expect image to be removed
    expect(screen.queryByRole("img")).toBeNull();
  });
});
