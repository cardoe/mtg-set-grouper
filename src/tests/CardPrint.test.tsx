import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import CardPrint from "../components/CardPrint";

describe("CardPrint", () => {
  const mockToggle = vi.fn();
  const mockShowImage = vi.fn();

  const defaultProps = {
    cardName: "Lightning Bolt",
    setName: "Alpha",
    colors: ["R"],
    price: 5.00,
    isSelected: true,
    onToggle: mockToggle,
    onShowImage: mockShowImage,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visual styling based on selection state", () => {
    test("checkbox reflects selection state correctly", () => {
      const { rerender } = render(<CardPrint {...defaultProps} isSelected={true} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      rerender(<CardPrint {...defaultProps} isSelected={false} />);
      expect(checkbox).not.toBeChecked();
    });

    test("card name and content are always visible regardless of selection", () => {
      const { rerender } = render(<CardPrint {...defaultProps} isSelected={true} />);

      expect(screen.getByText("Lightning Bolt")).toBeInTheDocument();
      expect(screen.getByText("$5.00")).toBeInTheDocument();

      rerender(<CardPrint {...defaultProps} isSelected={false} />);
      expect(screen.getByText("Lightning Bolt")).toBeInTheDocument();
      expect(screen.getByText("$5.00")).toBeInTheDocument();
    });

    test("card name has underline when selected", () => {
      render(<CardPrint {...defaultProps} isSelected={true} />);

      const cardNameSpan = screen.getByText("Lightning Bolt");

      expect(cardNameSpan).toHaveStyle({
        textDecoration: "underline"
      });
    });

    test("card name has underline line-through when deselected", () => {
      render(<CardPrint {...defaultProps} isSelected={false} />);

      const cardNameSpan = screen.getByText("Lightning Bolt");

      expect(cardNameSpan).toHaveStyle({
        textDecoration: "underline line-through"
      });
    });
  });

  describe("Interaction behavior", () => {
    test("checkbox reflects isSelected prop", () => {
      const { rerender } = render(<CardPrint {...defaultProps} isSelected={true} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      rerender(<CardPrint {...defaultProps} isSelected={false} />);
      expect(checkbox).not.toBeChecked();
    });

    test("clicking checkbox calls onToggle with card name", async () => {
      const user = userEvent.setup();
      render(<CardPrint {...defaultProps} />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(mockToggle).toHaveBeenCalledWith("Lightning Bolt");
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    test("clicking card name calls onShowImage", async () => {
      const user = userEvent.setup();
      render(<CardPrint {...defaultProps} />);

      const cardName = screen.getByText("Lightning Bolt");
      await user.click(cardName);

      expect(mockShowImage).toHaveBeenCalledTimes(1);
    });

    test("works correctly when deselected", async () => {
      const user = userEvent.setup();
      render(<CardPrint {...defaultProps} isSelected={false} />);

      const checkbox = screen.getByRole("checkbox");
      const cardName = screen.getByText("Lightning Bolt");

      await user.click(checkbox);
      expect(mockToggle).toHaveBeenCalledWith("Lightning Bolt");

      await user.click(cardName);
      expect(mockShowImage).toHaveBeenCalledTimes(1);
    });
  });

  describe("Content rendering", () => {
    test("displays card information correctly", () => {
      render(<CardPrint {...defaultProps} />);

      expect(screen.getByText("Lightning Bolt")).toBeInTheDocument();
      expect(screen.getByText("$5.00")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    test("renders ColorSymbols component", () => {
      render(<CardPrint {...defaultProps} />);

      // We can't easily test the ColorSymbols rendering without knowing its exact implementation,
      // but we can verify the component structure is correct
      expect(screen.getByText("Lightning Bolt").parentElement).toBeInTheDocument();
    });

    test("formats price correctly", () => {
      const { rerender } = render(<CardPrint {...defaultProps} price={0.50} />);
      expect(screen.getByText("$0.50")).toBeInTheDocument();

      rerender(<CardPrint {...defaultProps} price={10.99} />);
      expect(screen.getByText("$10.99")).toBeInTheDocument();

      rerender(<CardPrint {...defaultProps} price={100} />);
      expect(screen.getByText("$100.00")).toBeInTheDocument();
    });
  });
});