import { describe, test, expect, beforeEach } from "vitest";
import { deselectCardFromSets, Card } from "../services/cardService";

describe("Card Service - Deselecting and Filtering", () => {
  let testSetGroups: [string, Card[]][];

  beforeEach(() => {
    testSetGroups = [
      [
        "Set A",
        [
          { name: "Evolving Wilds", colors: ["G"], imageUrl: "img1.jpg", priceCategory: "$" },
          { name: "Delighted Halfling", colors: ["W"], imageUrl: "img2.jpg", priceCategory: "$$" },
        ],
      ],
      [
        "Set B",
        [
          { name: "Evolving Wilds", colors: ["G"], imageUrl: "img1.jpg", priceCategory: "$" },
          { name: "Banishing Light", colors: ["W"], imageUrl: "img3.jpg", priceCategory: "$$$" },
        ],
      ],
    ];
  });

  test("Deselecting a card removes it from all sets", () => {
    const updatedSetGroups = deselectCardFromSets(testSetGroups, "Evolving Wilds");

    expect(updatedSetGroups.length).toBe(2); // Both sets should still exist
    expect(updatedSetGroups[0][1]).toHaveLength(1); // "Set A" should have 1 card left
    expect(updatedSetGroups[1][1]).toHaveLength(1); // "Set B" should have 1 card left
    expect(updatedSetGroups.some(([_, cards]) => cards.some((c) => c.name === "Evolving Wilds"))).toBe(false);
  });

  test("Deselecting a card that is not in any set has no effect", () => {
    const updatedSetGroups = deselectCardFromSets(testSetGroups, "Nonexistent Card");

    expect(updatedSetGroups).toEqual(testSetGroups);
  });

  test("Filtering by price only shows correct price categories", () => {
    const priceFilters = { "$": true, "$$": false, "$$$": true };
    const filteredSets = testSetGroups.map(([setName, cards]) => [
      setName,
      cards.filter((card) => priceFilters[card.priceCategory]),
    ]);

    expect(filteredSets[0][1]).toHaveLength(1); // "Set A" should only have 1 card (Evolving Wilds - $)
    expect(filteredSets[1][1]).toHaveLength(2); // "Set B" should only have 2 cards (Evolving Wilds - $ and Banishing Light - $$$)
  });

  test("If all price filters are off, no cards should be shown", () => {
    const priceFilters = { "$": false, "$$": false, "$$$": false };
    const filteredSets = testSetGroups.map(([setName, cards]) => [
      setName,
      cards.filter((card) => priceFilters[card.priceCategory]),
    ]);

    expect(filteredSets.every(([_, cards]) => cards.length === 0)).toBe(true);
  });
});
