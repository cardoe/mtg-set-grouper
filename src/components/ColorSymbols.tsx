import React from "react";

const colorIcons: { [key: string]: string } = {
  W: "⚪", // White
  U: "🔵", // Blue
  B: "⚫", // Black
  R: "🔴", // Red
  G: "🟢", // Green
  C: "🟤", // Colorless
};

const ColorSymbols: React.FC<{ colors: string[] }> = ({ colors }) => {
  return <span>{colors.map((color) => colorIcons[color] || "🟤").join(" ")}</span>;
};

export default ColorSymbols;
