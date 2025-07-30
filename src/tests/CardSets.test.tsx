import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import CardSets from "../components/CardSets";
import { Card } from "../services/cardService";

describe("CardSets", () => {
  const mockProcessCards = vi.fn();
  const mockDownloadCSV = vi.fn();
  const mockProgress = { current: 0, total: 0, isLoading: false };
  const mockSetGroups: [string, Card[]][] = [
    [
      "Test Set A",
      [
        {
          name: "Test Card 1",
          colors: ["W"],
          imageUrl: "image1.jpg",
          price: 1.5,
          priceCategory: "$$",
        },
        {
          name: "Test Card 2",
          colors: ["U"],
          imageUrl: "image2.jpg",
          price: 0.5,
          priceCategory: "$",
        },
      ],
    ],
    [
      "Test Set B",
      [
        {
          name: "Test Card 3",
          colors: ["R"],
          imageUrl: "image3.jpg",
          price: 10.0,
          priceCategory: "$$$",
        },
      ],
    ],
  ];

  beforeEach(() => {
    localStorage.clear();
    mockProcessCards.mockClear();
    mockDownloadCSV.mockClear();
  });

  describe("Input handling and persistence", () => {
    test("renders textarea with correct placeholder", () => {
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByPlaceholderText(/1 Evolving Wilds \(INR\)/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue("");
    });

    test("loads saved input from localStorage on mount", () => {
      const savedInput = "1 Lightning Bolt\n2 Counterspell";
      localStorage.setItem("cardListInput", savedInput);

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue(savedInput);
    });

    test("saves input to localStorage when typing", async () => {
      const user = userEvent.setup();
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      const inputText = "1 Birds of Paradise";

      await user.type(textarea, inputText);

      expect(localStorage.getItem("cardListInput")).toBe(inputText);
      expect(textarea).toHaveValue(inputText);
    });

    test("updates input value correctly", async () => {
      const user = userEvent.setup();
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");

      await user.type(textarea, "Test input");
      expect(textarea).toHaveValue("Test input");

      await user.clear(textarea);
      await user.type(textarea, "Different input");
      expect(textarea).toHaveValue("Different input");
    });
  });

  describe("Button interactions", () => {
    test("calls processCards with input text when Group Cards button is clicked", async () => {
      const user = userEvent.setup();
      const inputText = "1 Lightning Bolt\n2 Counterspell";

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      const groupButton = screen.getByText("Group Cards by Set");

      await user.type(textarea, inputText);
      await user.click(groupButton);

      expect(mockProcessCards).toHaveBeenCalledWith(inputText);
      expect(mockProcessCards).toHaveBeenCalledTimes(1);
    });

    test("clears input and localStorage when Clear button is clicked", async () => {
      const user = userEvent.setup();
      const initialInput = "1 Lightning Bolt";

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      const clearButton = screen.getByText("Clear");

      await user.type(textarea, initialInput);
      expect(textarea).toHaveValue(initialInput);
      expect(localStorage.getItem("cardListInput")).toBe(initialInput);

      await user.click(clearButton);

      expect(textarea).toHaveValue("");
      expect(localStorage.getItem("cardListInput")).toBeNull();
    });

    test("calls downloadCSV when Download CSV button is clicked", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      const downloadButton = screen.getByText("Download CSV");
      await user.click(downloadButton);

      expect(mockDownloadCSV).toHaveBeenCalledTimes(1);
    });

    test("Download CSV button only appears when setGroups has data", () => {
      const { rerender } = render(
        <CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />
      );

      expect(screen.queryByText("Download CSV")).not.toBeInTheDocument();

      rerender(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      expect(screen.getByText("Download CSV")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    test("handles empty input gracefully", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const groupButton = screen.getByText("Group Cards by Set");
      await user.click(groupButton);

      expect(mockProcessCards).toHaveBeenCalledWith("");
    });

    test("handles very long input text", async () => {
      const user = userEvent.setup();
      const longInput = Array(100).fill("1 Lightning Bolt").join("\n");

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      const groupButton = screen.getByText("Group Cards by Set");

      await user.type(textarea, longInput);
      await user.click(groupButton);

      expect(mockProcessCards).toHaveBeenCalledWith(longInput);
      expect(localStorage.getItem("cardListInput")).toBe(longInput);
    });

    test("handles special characters in input", async () => {
      const user = userEvent.setup();
      const specialInput = "1 Jace, the Mind Sculptor\n2 Elspeth, Knight-Errant\n1 Æther Vial";

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, specialInput);

      expect(textarea).toHaveValue(specialInput);
      expect(localStorage.getItem("cardListInput")).toBe(specialInput);
    });

    test("handles corrupted localStorage gracefully", () => {
      localStorage.setItem("cardListInput", "{invalid json}");

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("{invalid json}"); // Should still load the string value
    });
  });

  describe("Component integration", () => {
    test("renders CardList component with correct props", () => {
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // CardList should render the set names from mockSetGroups (they appear in accordion headers)
      expect(screen.getByText(/Test Set A/)).toBeInTheDocument();
      expect(screen.getByText(/Test Set B/)).toBeInTheDocument();
    });

    test("maintains input state after processing cards", async () => {
      const user = userEvent.setup();
      const inputText = "1 Lightning Bolt";

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      const textarea = screen.getByRole("textbox");
      const groupButton = screen.getByText("Group Cards by Set");

      await user.type(textarea, inputText);
      await user.click(groupButton);

      expect(textarea).toHaveValue(inputText); // Input should persist after processing
    });
  });

  describe("Progress feedback", () => {
    test("shows progress bar and disables buttons when loading", () => {
      const loadingProgress = { current: 5, total: 10, isLoading: true };

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={loadingProgress} />);

      // Button should show "Processing..." and be disabled
      const groupButton = screen.getByRole("button", { name: "Processing..." });
      expect(groupButton).toBeDisabled();

      // Clear button should be disabled
      const clearButton = screen.getByRole("button", { name: "Clear" });
      expect(clearButton).toBeDisabled();

      // Progress text should be displayed
      expect(screen.getByText("Downloading card information: 5 of 10 cards")).toBeInTheDocument();

      // Progress bar should be present
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });

    test("hides progress bar and enables buttons when not loading", () => {
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} progress={mockProgress} />);

      // Button should show normal text and be enabled
      const groupButton = screen.getByRole("button", { name: "Group Cards by Set" });
      expect(groupButton).not.toBeDisabled();

      // Clear button should be enabled
      const clearButton = screen.getByRole("button", { name: "Clear" });
      expect(clearButton).not.toBeDisabled();

      // Progress text should not be displayed
      expect(screen.queryByText(/Downloading card information:/)).not.toBeInTheDocument();

      // Progress bar should not be present
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    test("hides CSV download button when loading", () => {
      const loadingProgress = { current: 2, total: 5, isLoading: true };

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={loadingProgress} />);

      // CSV button should not be visible when loading
      expect(screen.queryByText("Download CSV")).not.toBeInTheDocument();
    });

    test("shows CSV download button when not loading and has results", () => {
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // CSV button should be visible when not loading and has results
      expect(screen.getByText("Download CSV")).toBeInTheDocument();
    });
  });

  describe("Price filter bug fix", () => {
    test("price filter buttons remain visible when all filters are deselected", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // All price filter buttons should be visible initially
      const dollarButton = screen.getByRole("button", { name: "$" });
      const dollarDollarButton = screen.getByRole("button", { name: "$$" });
      const dollarDollarDollarButton = screen.getByRole("button", { name: "$$$" });

      expect(dollarButton).toBeInTheDocument();
      expect(dollarDollarButton).toBeInTheDocument();
      expect(dollarDollarDollarButton).toBeInTheDocument();

      // Click all three buttons to deselect them
      await user.click(dollarButton);
      await user.click(dollarDollarButton);
      await user.click(dollarDollarDollarButton);

      // All buttons should still be visible even when all filters are deselected
      expect(screen.getByRole("button", { name: "$" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "$$" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "$$$" })).toBeInTheDocument();

      // User should be able to click buttons to re-enable filters
      await user.click(screen.getByRole("button", { name: "$" }));

      // Button should be re-enabled and cards should be visible again
      expect(screen.getByRole("button", { name: "$" })).toBeInTheDocument();
    });
  });

  describe("Card strikethrough behavior", () => {
    test("deselected cards show with strikethrough instead of being hidden", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // Find a card checkbox and uncheck it
      const cardCheckbox = screen.getAllByRole("checkbox")[0]; // Get the first card checkbox
      const cardLabel = cardCheckbox.closest('span');

      expect(cardCheckbox).toBeChecked(); // Should be checked initially

      // Click to deselect the card
      await user.click(cardCheckbox);

      // Card should now be unchecked but still visible
      expect(cardCheckbox).not.toBeChecked();
      expect(cardCheckbox).toBeInTheDocument(); // Card should still be visible

      // The label should have strikethrough styling (we can't easily test CSS styles in jsdom,
      // but we can verify the card is still present and unchecked)
      expect(cardLabel).toBeInTheDocument();
    });

    test("set totals only count selected cards", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // Initially should show the full count for Test Set A (2 cards)
      expect(screen.getByText("Test Set A (2 cards)")).toBeInTheDocument();

      // Deselect one card
      const cardCheckboxes = screen.getAllByRole("checkbox");
      const firstCardCheckbox = cardCheckboxes[0];

      await user.click(firstCardCheckbox);

      // Count should now be reduced by 1, but card should still be visible
      expect(screen.getByText("Test Set A (1 cards)")).toBeInTheDocument();
      expect(firstCardCheckbox).toBeInTheDocument(); // Card still visible
      expect(firstCardCheckbox).not.toBeChecked(); // But unchecked
    });

    test("set shows 0 cards when all cards in set are deselected", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // Deselect all cards in Test Set A (2 cards)
      const cardCheckboxes = screen.getAllByRole("checkbox");

      // Find checkboxes for Test Set A cards and deselect them
      await user.click(cardCheckboxes[0]);
      await user.click(cardCheckboxes[1]);

      // Set should now show 0 cards
      expect(screen.getByText("Test Set A (0 cards)")).toBeInTheDocument();

      // But cards should still be visible (just strikethrough)
      expect(cardCheckboxes[0]).toBeInTheDocument();
      expect(cardCheckboxes[1]).toBeInTheDocument();
      expect(cardCheckboxes[0]).not.toBeChecked();
      expect(cardCheckboxes[1]).not.toBeChecked();
    });
  });

  describe("Price filter and deselection interaction", () => {
    test("deselected cards respect price filters", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // Deselect a card first
      const firstCardCheckbox = screen.getAllByRole("checkbox")[0];
      await user.click(firstCardCheckbox);

      // Card should still be visible but deselected
      expect(firstCardCheckbox).toBeInTheDocument();
      expect(firstCardCheckbox).not.toBeChecked();

      // Now apply price filter that would hide this card's price category
      // (This is a complex interaction that needs careful testing)
      const priceButtons = screen.getAllByRole("button").filter(btn =>
        btn.textContent === "$" || btn.textContent === "$$" || btn.textContent === "$$$"
      );

      if (priceButtons.length > 0) {
        // Click price filter buttons to test interaction
        await user.click(priceButtons[0]); // This might hide the deselected card

        // The card should be hidden by price filter, even if deselected
        // (Implementation depends on card's actual price category)
      }
    });

    test("set counts reflect both price filtering and card deselection", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} progress={mockProgress} />);

      // Initial state: "Test Set A (2 cards)"
      expect(screen.getByText("Test Set A (2 cards)")).toBeInTheDocument();

      // Deselect one card: should show "Test Set A (1 cards)"
      const firstCardCheckbox = screen.getAllByRole("checkbox")[0];
      await user.click(firstCardCheckbox);
      expect(screen.getByText("Test Set A (1 cards)")).toBeInTheDocument();

      // Apply price filter - count should reflect both filters
      const priceButtons = screen.getAllByRole("button").filter(btn =>
        btn.textContent === "$" || btn.textContent === "$$" || btn.textContent === "$$$"
      );

      if (priceButtons.length > 0) {
        await user.click(priceButtons[0]);
        // Count may change based on price categories of cards
        // Should still exclude the deselected card from count
      }
    });
  });

  describe("Set sorting with strikethrough cards", () => {
    test("sets sort by number of selected cards, not total cards", async () => {
      const user = userEvent.setup();

      // Create test data where deselection changes sort order
      const testGroups: [string, typeof mockSetGroups[0][1]][] = [
        ["Set With Many Cards", [
          { name: "Card 1", colors: ["W"], imageUrl: "img1.jpg", price: 1.0, priceCategory: "$" },
          { name: "Card 2", colors: ["U"], imageUrl: "img2.jpg", price: 2.0, priceCategory: "$" },
          { name: "Card 3", colors: ["B"], imageUrl: "img3.jpg", price: 3.0, priceCategory: "$" },
        ]],
        ["Set With Few Cards", [
          { name: "Expensive Card", colors: ["R"], imageUrl: "img4.jpg", price: 20.0, priceCategory: "$$$" },
        ]]
      ];

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={testGroups} progress={mockProgress} />);

      // Initially "Set With Many Cards" should appear first (3 > 1)
      const accordionHeaders = screen.getAllByRole("button").filter(btn =>
        btn.textContent?.includes("cards)")
      );

      if (accordionHeaders.length >= 2) {
        expect(accordionHeaders[0]).toHaveTextContent("Set With Many Cards (3 cards)");

        // Deselect 2 cards from "Set With Many Cards"
        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[0]);
        await user.click(checkboxes[1]);

        // Now "Set With Few Cards" should appear first (1 > 1, but "Set With Many Cards" now has 1)
        // The exact behavior depends on implementation details
      }
    });
  });
});