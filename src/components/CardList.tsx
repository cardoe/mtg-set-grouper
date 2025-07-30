import React, { useMemo, useState } from "react";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import { Card } from "../services/cardService";
import CardPrint from "./CardPrint";
import CardImageModal from "./CardImageModal";

interface CardListProps {
  setGroups: [string, Card[]][];
}

type PriceCategory = "$" | "$$" | "$$$";

const CardList: React.FC<CardListProps> = ({ setGroups }) => {
  const [deselectedCards, setDeselectedCards] = useState(new Set<string>());
  const [priceFilters, setPriceFilters] = useState<Record<PriceCategory, boolean>>({
    $: true,
    $$: true,
    $$$: true,
  });
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const toggleCardSelection = (cardName: string) => {
    setDeselectedCards((prev) => {
      const updated = new Set(prev);
      updated.has(cardName) ? updated.delete(cardName) : updated.add(cardName);
      return new Set(updated);
    });
  };

  const togglePriceFilter = (priceCategory: PriceCategory) => {
    setPriceFilters((prev) => ({
      ...prev,
      [priceCategory]: !prev[priceCategory],
    }));
  };

  const sortedFilteredGroups = useMemo(() => {
    return setGroups
      .map(([setName, cards]) => {
        // Apply price filter and deselected cards filter
        const filteredCards = cards
          .filter((card) => priceFilters[card.priceCategory] && !deselectedCards.has(card.name));

        return [setName, filteredCards] as [string, Card[]];
      })
      .filter(([_, cards]) => cards.length > 0)
      .sort((a, b) => b[1].length - a[1].length); // Resort by number of matching cards
  }, [setGroups, deselectedCards, priceFilters]);

  return (
    <div data-testid="card-results">
      {setGroups.length > 0 && (
        <div className="price-filters d-flex gap-2 mb-3">
          {Object.keys(priceFilters).map((price) => (
            <Button
              key={price}
              variant={priceFilters[price as "$" | "$$" | "$$$"] ? "primary" : "outline-secondary"}
              onClick={() => togglePriceFilter(price as "$" | "$$" | "$$$")}
            >
              {price}
            </Button>
          ))}
        </div>
      )}

      <Accordion className="mt-4">
        {sortedFilteredGroups.map(([setName, cards]) => (
          <Accordion.Item eventKey={setName} key={setName}>
            <Accordion.Header>{setName} ({cards.length} cards)</Accordion.Header>
            <Accordion.Body>
              {cards.map((card) => (
                <CardPrint
                  key={`${card.name}-${setName}`}
                  cardName={card.name}
                  setName={setName}
                  colors={card.colors}
                  price={card.price}
                  isSelected={!deselectedCards.has(card.name)}
                  onToggle={toggleCardSelection}
                  onShowImage={() => setSelectedCard(card)}
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
      {selectedCard && <CardImageModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </div>
  );
};

export default CardList;
