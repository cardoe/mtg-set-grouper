import React from "react";
import Form from "react-bootstrap/Form";
import ColorSymbols from "./ColorSymbols";

interface CardPrintProps {
  cardName: string;
  setName: string;
  colors: string[];
  price: number;
  isSelected: boolean;
  onToggle: (cardName: string) => void;
  onShowImage: () => void;

}

const CardPrint: React.FC<CardPrintProps> = ({ cardName, setName, colors, price, isSelected, onToggle, onShowImage }) => {

  return (
    <span>
      <Form.Check
        key={`${cardName}-${setName}`}
        type="checkbox"
        role="checkbox"
        aria-label={cardName}
        checked={isSelected}
        onChange={() => onToggle(cardName)}
        label={
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              onClick={onShowImage}
              style={{ cursor: "pointer", textDecoration: "underline" }}
            >
              {cardName}
            </span>
            <ColorSymbols colors={colors} />
            <span>
              ${price.toFixed(2)}
            </span>
          </span>
        }
      />
    </span>
  );
};

export default CardPrint;
