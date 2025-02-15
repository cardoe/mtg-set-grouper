import { describe, test, expect, vi, beforeEach } from "vitest";
import { deselectCardFromSets, extractCardNames, fetchCardSets , Card } from "../services/cardService";

describe("extractCardNames", () => {
  test("Extracts card names without quantities or sets", () => {
    const input = `Evolving Wilds
Delighted Halfling`;
    expect(extractCardNames(input)).toEqual(["Evolving Wilds", "Delighted Halfling"]);
  });

  test("Extracts card names and ignores set names", () => {
    const input = `1 Evolving Wilds (XYZ)
2 Delighted Halfling (ABC)`;
    expect(extractCardNames(input)).toEqual(["Evolving Wilds", "Delighted Halfling"]);
  });

  test("Handles mixed formatting with spaces", () => {
    const input = ` 1 Banishing Light (SET)  
  2 Chasm Stalker  `;
    expect(extractCardNames(input)).toEqual(["Banishing Light", "Chasm Stalker"]);
  });

  test("Handles missing quantities", () => {
    const input = `Evolving Wilds (SET)
Delighted Halfling`;
    expect(extractCardNames(input)).toEqual(["Evolving Wilds", "Delighted Halfling"]);
  });

  test("Handles empty lines and comments", () => {
    const input = `
1 Evolving Wilds (SET)

/ This is a comment

2 Delighted Halfling
`;
    expect(extractCardNames(input)).toEqual(["Evolving Wilds", "Delighted Halfling"]);
  });

  test("Handles cards without set names", () => {
    const input = `3 Chasm Stalker
Banishing Light`;
    expect(extractCardNames(input)).toEqual(["Chasm Stalker", "Banishing Light"]);
  });

  test("Returns an empty array for invalid input", () => {
    const input = `

/ Just a comment

 / Another comment

`;
    expect(extractCardNames(input)).toEqual([]);
  });

  test("Throws an error when input is not a string", () => {
    expect(() => extractCardNames(123 as any)).toThrow(TypeError);
    expect(() => extractCardNames(null as any)).toThrow(TypeError);
    expect(() => extractCardNames(undefined as any)).toThrow(TypeError);
  });
});

describe("Card Service - Deselecting and Filtering", () => {
  let testSetGroups: [string, Card[]][];

  beforeEach(() => {
    testSetGroups = [
      [
        "Set A",
        [
          { name: "Evolving Wilds", colors: ["G"], imageUrl: "img1.jpg", price: 0.27, priceCategory: "$" },
          { name: "Delighted Halfling", colors: ["W"], imageUrl: "img2.jpg", price: 9.42, priceCategory: "$$" },
        ],
      ],
      [
        "Set B",
        [
          { name: "Evolving Wilds", colors: ["G"], imageUrl: "img1.jpg", price: 0.27, priceCategory: "$" },
          { name: "Banishing Light", colors: ["W"], imageUrl: "img3.jpg", price: 1.64, priceCategory: "$$$" },
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

describe("Card Service - Caching & API Fetching", () => {
  const mockCardNames = ["Evolving Wilds", "Delighted Halfling"];
  const mockApiResponse = {
    object: "list",
    data: [
      {
        name: "Evolving Wilds",
        set_name: "Core Set 2021",
        colors: [],
        prices: { usd: "0.50" },
        image_uris: { normal: "https://example.com/image.jpg" },
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear(); // Reset cache before each test
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
    );
  });

  test("Uses cached data if available and fresh", async () => {
  const cardNames = ["Evolving Wilds"];
    const cacheData = {
      timestamp: Date.now(),
      data: mockApiResponse,
    };
    localStorage.setItem("card_Evolving Wilds", JSON.stringify(cacheData));

    const result = await fetchCardSets(cardNames);
    expect(result.length).toBe(1);
    expect(fetch).not.toHaveBeenCalled(); // Should NOT call API if cache is valid
  });

  test("Fetches new data if cache is missing", async () => {
    const result = await fetchCardSets(mockCardNames);
    expect(result.length).toBe(1);
    expect(fetch).toHaveBeenCalled(); // Should call API if no cache
  });

  test("Fetches new data if cache format is outdated", async () => {
    const outdatedCache = {
      data: mockApiResponse, // Missing `timestamp`
    };
    localStorage.setItem("card_Evolving Wilds", JSON.stringify(outdatedCache));

    const result = await fetchCardSets(mockCardNames);
    expect(result.length).toBe(1);
    expect(fetch).toHaveBeenCalled(); // Should call API if cache is outdated
  });

  test("Handles JSON parsing errors in cache", async () => {
    localStorage.setItem("card_Evolving Wilds", "{invalid JSON");

    const result = await fetchCardSets(mockCardNames);
    expect(result.length).toBe(1);
    expect(fetch).toHaveBeenCalled(); // Should fetch new data if cache is corrupt
  });
});
