import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// Mock fetch responses for consistent testing
const mockEvolvingWildsResponse = {
  object: "list",
  data: [
    {
      name: "Evolving Wilds",
      set_name: "Khans of Tarkir",
      colors: [],
      prices: { usd: "0.25" },
      image_uris: { normal: "https://example.com/evolving-wilds-ktk.jpg" },
      promo: false,
      oversized: false,
    },
    {
      name: "Evolving Wilds",
      set_name: "Core Set 2021",
      colors: [],
      prices: { usd: "0.15" },
      image_uris: { normal: "https://example.com/evolving-wilds-m21.jpg" },
      promo: false,
      oversized: false,
    },
  ],
};

const mockDelightedHalflingResponse = {
  object: "list",
  data: [
    {
      name: "Delighted Halfling",
      set_name: "The Lord of the Rings: Tales of Middle-earth",
      colors: ["G"],
      prices: { usd: "9.50" },
      image_uris: { normal: "https://example.com/delighted-halfling.jpg" },
      promo: false,
      oversized: false,
    },
  ],
};

const mockBanishingLightResponse = {
  object: "list",
  data: [
    {
      name: "Banishing Light",
      set_name: "Theros",
      colors: ["W"],
      prices: { usd: "0.75" },
      image_uris: { normal: "https://example.com/banishing-light.jpg" },
      promo: false,
      oversized: false,
    },
  ],
};

describe("Integration Tests - App Functionality", () => {
  beforeEach(() => {
    localStorage.clear(); // Reset storage before each test
    vi.clearAllMocks();

    // Mock fetch to return our test data
    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = url.toString();

      if (urlString.includes("Evolving%20Wilds") || urlString.includes("Evolving Wilds")) {
        return Promise.resolve(new Response(JSON.stringify(mockEvolvingWildsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      } else if (urlString.includes("Delighted%20Halfling") || urlString.includes("Delighted Halfling")) {
        return Promise.resolve(new Response(JSON.stringify(mockDelightedHalflingResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      } else if (urlString.includes("Banishing%20Light") || urlString.includes("Banishing Light")) {
        return Promise.resolve(new Response(JSON.stringify(mockBanishingLightResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }

      console.log("Unmatched URL:", urlString);
      return Promise.reject(new Error(`Unknown card: ${urlString}`));
    });
  });

  test("Filters by price and updates displayed cards", async () => {
    render(<App />);

    // Find the textarea using the correct placeholder text
    const textarea = screen.getByPlaceholderText(/1 Evolving Wilds \(INR\)/i);
    await userEvent.type(textarea, "1 Evolving Wilds (INR)\n2 Delighted Halfling (XYZ)");

    // Click "Group Cards by Set"
    const groupButton = screen.getByText(/Group Cards by Set/i);
    await userEvent.click(groupButton);

    // Wait for multiple "Evolving Wilds" instances to appear
    const evolvingWildsElements = await screen.findAllByText("Evolving Wilds");
    expect(evolvingWildsElements.length).toBeGreaterThan(0);

    // Uncheck "$$$" filter
    const priceFilter = screen.getByRole("button", { name: "$$$" });
    await userEvent.click(priceFilter);

    // Expect "Delighted Halfling" (which is $$) to be removed
    await waitFor(() => {
      expect(screen.queryByText((_context, element) => {
        return element?.textContent === "Delighted Halfling";
      })).toBeNull();
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
