import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import CardSets from "../components/CardSets";
import { Card } from "../services/cardService";

describe("CardSets", () => {
  const mockProcessCards = vi.fn();
  const mockDownloadCSV = vi.fn();
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
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

      const textarea = screen.getByPlaceholderText(/1 Evolving Wilds \(INR\)/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue("");
    });

    test("loads saved input from localStorage on mount", () => {
      const savedInput = "1 Lightning Bolt\n2 Counterspell";
      localStorage.setItem("cardListInput", savedInput);

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue(savedInput);
    });

    test("saves input to localStorage when typing", async () => {
      const user = userEvent.setup();
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

      const textarea = screen.getByRole("textbox");
      const inputText = "1 Birds of Paradise";

      await user.type(textarea, inputText);

      expect(localStorage.getItem("cardListInput")).toBe(inputText);
      expect(textarea).toHaveValue(inputText);
    });

    test("updates input value correctly", async () => {
      const user = userEvent.setup();
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

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

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

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

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

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

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} />);

      const downloadButton = screen.getByText("Download CSV");
      await user.click(downloadButton);

      expect(mockDownloadCSV).toHaveBeenCalledTimes(1);
    });

    test("Download CSV button only appears when setGroups has data", () => {
      const { rerender } = render(
        <CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />
      );

      expect(screen.queryByText("Download CSV")).not.toBeInTheDocument();

      rerender(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} />);

      expect(screen.getByText("Download CSV")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    test("handles empty input gracefully", async () => {
      const user = userEvent.setup();

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

      const groupButton = screen.getByText("Group Cards by Set");
      await user.click(groupButton);

      expect(mockProcessCards).toHaveBeenCalledWith("");
    });

    test("handles very long input text", async () => {
      const user = userEvent.setup();
      const longInput = Array(100).fill("1 Lightning Bolt").join("\n");

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

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

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, specialInput);

      expect(textarea).toHaveValue(specialInput);
      expect(localStorage.getItem("cardListInput")).toBe(specialInput);
    });

    test("handles corrupted localStorage gracefully", () => {
      localStorage.setItem("cardListInput", "{invalid json}");

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("{invalid json}"); // Should still load the string value
    });
  });

  describe("Component integration", () => {
    test("renders CardList component with correct props", () => {
      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={mockSetGroups} />);

      // CardList should render the set names from mockSetGroups (they appear in accordion headers)
      expect(screen.getByText(/Test Set A/)).toBeInTheDocument();
      expect(screen.getByText(/Test Set B/)).toBeInTheDocument();
    });

    test("maintains input state after processing cards", async () => {
      const user = userEvent.setup();
      const inputText = "1 Lightning Bolt";

      render(<CardSets processCards={mockProcessCards} downloadCSV={mockDownloadCSV} setGroups={[]} />);

      const textarea = screen.getByRole("textbox");
      const groupButton = screen.getByText("Group Cards by Set");

      await user.type(textarea, inputText);
      await user.click(groupButton);

      expect(textarea).toHaveValue(inputText); // Input should persist after processing
    });
  });
});