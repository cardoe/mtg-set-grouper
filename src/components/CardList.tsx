import React from "react";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import { Card } from "../services/cardService";
import ColorSymbols from "./ColorSymbols";

interface CardListProps {
  setGroups: [string, Card[]][];
  toggleImage: (card: Card | null) => void;
  deselectCard: (cardName: string) => void;
  priceFilters: { [key: string]: boolean };
}

const CardList: React.FC<CardListProps> = ({ setGroups, toggleImage, deselectCard, priceFilters }) => {
  return (
    <Accordion className="mt-4" data-testid="card-results">
      {setGroups.map(([setName, cards], index) => {
        const filteredCards = cards.filter((card) => priceFilters[card.priceCategory]);
        if (filteredCards.length === 0) return null; // Hide empty sets

        return (
          <Accordion.Item eventKey={index.toString()} key={setName}>
            <Accordion.Header>{setName} ({filteredCards.length} cards)</Accordion.Header>
            <Accordion.Body>
              {filteredCards.map((card, i) => (
                <Form.Check
                  key={i}
                  type="checkbox"
                  role="checkbox"
                  aria-label={card.name}
                  onChange={() => deselectCard(card.name)}
                  label={
                    <>
                      <span onClick={() => toggleImage(card)} style={{ cursor: "pointer", textDecoration: "underline" }}>
                        {card.name}
                      </span>
                      <span>
                        <ColorSymbols colors={card.colors} />
                      </span>
                    </>
                  }
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export default CardList;
