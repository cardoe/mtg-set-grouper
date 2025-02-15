import React from "react";

const manaSymbols: { [key: string]: string } = {
  W: "mana/W.svg", // White
  U: "mana/U.svg", // Blue
  B: "mana/B.svg", // Black
  R: "mana/R.svg", // Red
  G: "mana/G.svg", // Green
  C: "mana/C.svg", // Colorless
};

interface ColorSymbolsProps {
  colors: string[];
}

const ColorSymbols: React.FC<ColorSymbolsProps> = ({ colors }) => {
  return (
    <span className="mana-symbols">
      {colors.map((color) => (
        <img key={color} src={manaSymbols[color]} alt={`${color} Mana`} className="mana-symbol" loading="lazy" />
      ))}
    </span>
  );
};

export default ColorSymbols;
