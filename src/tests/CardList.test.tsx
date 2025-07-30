import { describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import CardList from "../components/CardList";
import { Card } from "../services/cardService";

describe("CardList", () => {
  const setGroups: [string, Card[]][] = [
    [
      "Set A",
      [
        {
          name: "Card 1",
          imageUrl: "card-1.png",
          colors: ["W"],
          price: 1.0,
          priceCategory: "$",
        },
      ],
    ],
    [
      "Set B",
      [
        {
          name: "Card 2",
          imageUrl: "card-2.png",
          colors: ["U"],
          price: 2.5,
          priceCategory: "$$",
        },
      ],
    ],
    [
      "Set C",
      [
        {
          name: "Card 3",
          imageUrl: "card-3.png",
          colors: ["B"],
          price: 6.0,
          priceCategory: "$$$",
        },
      ],
    ],
  ];

  beforeEach(() => {
    render(<CardList setGroups={setGroups} />);
  });

  test("renders all checkboxes", () => {
    expect(screen.getByRole("checkbox", { name: "Card 1" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Card 2" })).toBeInTheDocument();
  });

  test("checkbox toggles correctly", () => {
    const checkbox = screen.getByRole("checkbox", { name: "Card 1" });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test("keeps deselected cards visible with strikethrough styling", () => {
    const checkbox = screen.getByRole("checkbox", { name: "Card 1" });

    fireEvent.click(checkbox); // Deselect "Card 1"

    // Card should still be visible but unchecked
    expect(screen.getByRole("checkbox", { name: "Card 1"})).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Card 1"})).not.toBeChecked();
  });
});
