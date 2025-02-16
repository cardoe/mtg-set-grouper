import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import CardPrint from "../components/CardPrint";

describe("CardPrint", () => {
  test("renders correctly with given props", () => {
    const mockToggle = vi.fn();
    const mockShowImage = vi.fn();
    render(
      <CardPrint
        cardName="Evolving Wilds"
        setName="SET-001"
        colors={["G"]}
        price={0.56}
        isSelected={true}
        onToggle={mockToggle}
        onShowImage={mockShowImage}
      />
    );

    const checkbox = screen.getByRole("checkbox", { name: "Evolving Wilds" });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  test("toggles selection when clicked", () => {
    const mockToggle = vi.fn();
    const mockShowImage = vi.fn();
    render(
      <CardPrint
        cardName="Evolving Wilds"
        setName="SET-001"
        colors={["G"]}
        price={0.56}
        isSelected={true}
        onToggle={mockToggle}
        onShowImage={mockShowImage}
      />
    );

    const checkbox = screen.getByRole("checkbox", { name: "Evolving Wilds" });
    fireEvent.click(checkbox);
    expect(mockToggle).toHaveBeenCalledWith("Evolving Wilds");
  });
});
