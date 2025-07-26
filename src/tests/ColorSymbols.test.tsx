import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ColorSymbols from "../components/ColorSymbols";

describe("ColorSymbols", () => {
  describe("Basic rendering", () => {
    test("renders single color symbol", () => {
      render(<ColorSymbols colors={["W"]} />);

      const whiteSymbol = screen.getByAltText("W Mana");
      expect(whiteSymbol).toBeInTheDocument();
      expect(whiteSymbol).toHaveAttribute("src", "mana/W.svg");
      expect(whiteSymbol).toHaveClass("mana-symbol");
      expect(whiteSymbol).toHaveAttribute("loading", "lazy");
    });

    test("renders multiple color symbols", () => {
      render(<ColorSymbols colors={["W", "U", "B"]} />);

      expect(screen.getByAltText("W Mana")).toHaveAttribute("src", "mana/W.svg");
      expect(screen.getByAltText("U Mana")).toHaveAttribute("src", "mana/U.svg");
      expect(screen.getByAltText("B Mana")).toHaveAttribute("src", "mana/B.svg");
    });

    test("renders all MTG colors correctly", () => {
      const allColors = ["W", "U", "B", "R", "G", "C"];
      render(<ColorSymbols colors={allColors} />);

      expect(screen.getByAltText("W Mana")).toHaveAttribute("src", "mana/W.svg");
      expect(screen.getByAltText("U Mana")).toHaveAttribute("src", "mana/U.svg");
      expect(screen.getByAltText("B Mana")).toHaveAttribute("src", "mana/B.svg");
      expect(screen.getByAltText("R Mana")).toHaveAttribute("src", "mana/R.svg");
      expect(screen.getByAltText("G Mana")).toHaveAttribute("src", "mana/G.svg");
      expect(screen.getByAltText("C Mana")).toHaveAttribute("src", "mana/C.svg");
    });
  });

  describe("Edge cases", () => {
    test("renders nothing when colors array is empty", () => {
      render(<ColorSymbols colors={[]} />);

      const container = screen.getByText("", { selector: ".mana-symbols" }); // Find by CSS class instead
      expect(container).toHaveClass("mana-symbols");
      expect(container).toBeEmptyDOMElement();
    });

    test("handles unknown color gracefully", () => {
      render(<ColorSymbols colors={["X"]} />);

      const unknownSymbol = screen.getByAltText("X Mana");
      expect(unknownSymbol).toBeInTheDocument();
      expect(unknownSymbol).not.toHaveAttribute("src"); // undefined maps are not rendered as src attribute
    });

    test("renders duplicate colors", () => {
      render(<ColorSymbols colors={["W", "W", "U"]} />);

      const whiteSymbols = screen.getAllByAltText("W Mana");
      const blueSymbols = screen.getAllByAltText("U Mana");

      expect(whiteSymbols).toHaveLength(2);
      expect(blueSymbols).toHaveLength(1);
    });

    test("maintains order of colors", () => {
      render(<ColorSymbols colors={["R", "G", "W", "U", "B"]} />);

      const symbols = screen.getAllByRole("img");
      expect(symbols[0]).toHaveAttribute("src", "mana/R.svg");
      expect(symbols[1]).toHaveAttribute("src", "mana/G.svg");
      expect(symbols[2]).toHaveAttribute("src", "mana/W.svg");
      expect(symbols[3]).toHaveAttribute("src", "mana/U.svg");
      expect(symbols[4]).toHaveAttribute("src", "mana/B.svg");
    });
  });

  describe("Accessibility", () => {
    test("provides meaningful alt text for screen readers", () => {
      render(<ColorSymbols colors={["W", "U"]} />);

      expect(screen.getByAltText("W Mana")).toBeInTheDocument();
      expect(screen.getByAltText("U Mana")).toBeInTheDocument();
    });

    test("images have lazy loading attribute", () => {
      render(<ColorSymbols colors={["R", "G"]} />);

      const symbols = screen.getAllByRole("img");
      symbols.forEach(symbol => {
        expect(symbol).toHaveAttribute("loading", "lazy");
      });
    });
  });

  describe("CSS classes", () => {
    test("container has correct CSS class", () => {
      render(<ColorSymbols colors={["W"]} />);

      const container = document.querySelector(".mana-symbols");
      expect(container).toHaveClass("mana-symbols");
    });

    test("each symbol has correct CSS class", () => {
      render(<ColorSymbols colors={["W", "U"]} />);

      const symbols = screen.getAllByRole("img");
      symbols.forEach(symbol => {
        expect(symbol).toHaveClass("mana-symbol");
      });
    });
  });

  describe("Common MTG card scenarios", () => {
    test("renders monocolor card (Red)", () => {
      render(<ColorSymbols colors={["R"]} />);

      expect(screen.getByAltText("R Mana")).toBeInTheDocument();
      expect(screen.getAllByRole("img")).toHaveLength(1);
    });

    test("renders multicolor card (Boros - Red/White)", () => {
      render(<ColorSymbols colors={["R", "W"]} />);

      expect(screen.getByAltText("R Mana")).toBeInTheDocument();
      expect(screen.getByAltText("W Mana")).toBeInTheDocument();
      expect(screen.getAllByRole("img")).toHaveLength(2);
    });

    test("renders five-color card (WUBRG)", () => {
      render(<ColorSymbols colors={["W", "U", "B", "R", "G"]} />);

      expect(screen.getAllByRole("img")).toHaveLength(5);
      expect(screen.getByAltText("W Mana")).toBeInTheDocument();
      expect(screen.getByAltText("U Mana")).toBeInTheDocument();
      expect(screen.getByAltText("B Mana")).toBeInTheDocument();
      expect(screen.getByAltText("R Mana")).toBeInTheDocument();
      expect(screen.getByAltText("G Mana")).toBeInTheDocument();
    });

    test("renders colorless card", () => {
      render(<ColorSymbols colors={["C"]} />);

      expect(screen.getByAltText("C Mana")).toBeInTheDocument();
      expect(screen.getByAltText("C Mana")).toHaveAttribute("src", "mana/C.svg");
    });

    test("renders artifact card (no colors)", () => {
      render(<ColorSymbols colors={[]} />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });
});