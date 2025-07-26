import { describe, test, expect, vi, beforeEach } from "vitest";
import { deselectCardFromSets, extractCardNames, fetchCardSets , Card } from "../services/cardService";

describe("extractCardNames", () => {
  test("Handles normal cards", () => {
    const input = `Evolving Wilds
Delighted Halfling`;
    expect(extractCardNames(input)).toEqual(["Evolving Wilds", "Delighted Halfling"]);
  });

  test("Handles cards with set names and ignores collector numbers", () => {
    const input = `1 Feign Death (PLST) AFR-103
1 Trailblazer's Boots (LTR) 398
1 Kaya's Ghostform (PLST) WAR-94
1 Reflecting Pool (PLST) CLB-358`;
    expect(extractCardNames(input)).toEqual(["Feign Death", "Trailblazer's Boots", "Kaya's Ghostform", "Reflecting Pool"]);
  });

  test("Handles special flags like *E* or *F*", () => {
    const input = `1 Shadowspear (PTHB) 236p *F*
1 Trailblazer's Boots (LTR) 398 *F*`;
    expect(extractCardNames(input)).toEqual(["Shadowspear", "Trailblazer's Boots"]);
  });

  test("Handles double-faced cards", () => {
    const input = `1 Malakir Rebirth // Malakir Mire (ZNR) 111`;
    expect(extractCardNames(input)).toEqual(["Malakir Rebirth // Malakir Mire"]);
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

  test("Ignores 'Deck', 'Sideboard', 'Commander' lines", () => {
    const input = `
Deck
1 Birds of Paradise (SLD) 176
Sideboard
2 Delighted Halfling
Commander
3 Banishing Light
`;
    expect(extractCardNames(input)).toEqual(["Birds of Paradise", "Delighted Halfling", "Banishing Light"]);
  });
});

describe("extractCardNames - Edge Cases", () => {
  test("Handles very large deck lists (100+ cards)", () => {
    const cardList = Array(150).fill("1 Lightning Bolt").join("\n");
    const result = extractCardNames(cardList);

    expect(result).toHaveLength(150);
    expect(result.every(name => name === "Lightning Bolt")).toBe(true);
  });

  test("Handles cards with special characters and accents", () => {
    const input = `1 Jace, the Mind Sculptor
1 Elspeth, Knight-Errant
1 Æther Vial
1 Doran, the Siege Tower
1 Lim-Dûl's Vault
1 Márton Stromgald
1 Gríma Wormtongue`;

    expect(extractCardNames(input)).toEqual([
      "Jace, the Mind Sculptor",
      "Elspeth, Knight-Errant",
      "Æther Vial",
      "Doran, the Siege Tower",
      "Lim-Dûl's Vault",
      "Márton Stromgald",
      "Gríma Wormtongue"
    ]);
  });

  test("Handles cards with parentheses in names", () => {
    const input = `1 Borborygmos (Guildpact)
1 Fire // Ice (Apocalypse)
1 Who // What // When // Where // Why (Unhinged)`;

    expect(extractCardNames(input)).toEqual([
      "Borborygmos (Guildpact)", // Parentheses are preserved when no set code follows
      "Fire // Ice (Apocalypse)",
      "Who // What // When // Where // Why (Unhinged)"
    ]);
  });

  test("Handles cards with numbers in names", () => {
    const input = `1 B.F.M. (Big Furry Monster)
1 Goblin Balloon Brigade
1 B-I-N-G-O
1 1996 World Champion`;

    expect(extractCardNames(input)).toEqual([
      "B.F.M. (Big Furry Monster)", // Parentheses preserved when no set code follows
      "Goblin Balloon Brigade",
      "B-I-N-G-O",
      "1996 World Champion"
    ]);
  });

  test("Handles mixed line endings (Windows/Unix)", () => {
    const input = "1 Lightning Bolt\r\n1 Counterspell\n1 Giant Growth\r\n";

    expect(extractCardNames(input)).toEqual([
      "Lightning Bolt",
      "Counterspell",
      "Giant Growth"
    ]);
  });

  test("Handles extreme whitespace variations", () => {
    const input = `   1   Lightning Bolt
\t\t2\tCounterspell\t(SET)\t
      Giant Growth      `;

    expect(extractCardNames(input)).toEqual([
      "Lightning Bolt",
      "Counterspell",
      "Giant Growth"
    ]);
  });

  test("Handles Unicode characters and emojis", () => {
    const input = `1 ☀️ Lightning Bolt ☀️
1 ⚡ Shock ⚡
1 🔥 Fireball 🔥`;

    expect(extractCardNames(input)).toEqual([
      "☀️ Lightning Bolt ☀️",
      "⚡ Shock ⚡",
      "🔥 Fireball 🔥"
    ]);
  });

  test("Handles extremely long card names", () => {
    const longName = "A".repeat(200);
    const input = `1 ${longName}`;

    expect(extractCardNames(input)).toEqual([longName]);
  });

  test("Handles cards with multiple slashes (split/transform cards)", () => {
    const input = `1 Fire // Ice
1 Wear // Tear
1 Armed // Dangerous
1 Assault // Battery`;

    expect(extractCardNames(input)).toEqual([
      "Fire // Ice",
      "Wear // Tear",
      "Armed // Dangerous",
      "Assault // Battery"
    ]);
  });

  test("Handles various quantity formats", () => {
    const input = `1x Lightning Bolt
2 Counterspell
10x Giant Growth
0 Shock
99 Fireball`;

    expect(extractCardNames(input)).toEqual([
      "1x Lightning Bolt", // 'x' is preserved as part of card name parsing
      "Counterspell",
      "10x Giant Growth",
      "Shock",
      "Fireball"
    ]);
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
    vi.clearAllMocks();
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

describe("Card Service - API Error Handling", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error in tests
  });

  test("Handles network fetch failure gracefully", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

    const result = await fetchCardSets(["Lightning Bolt"]);

    expect(result).toEqual([]); // Should return empty array when all requests fail
    expect(console.error).toHaveBeenCalledWith("Error fetching data for Lightning Bolt:", expect.any(Error));
  });

  test("Handles HTTP error responses (404)", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response("Not found", { status: 404 }))
    );

    const result = await fetchCardSets(["Nonexistent Card"]);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error fetching data for Nonexistent Card:", expect.any(Error));
  });

  test("Handles HTTP error responses (500)", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response("Server error", { status: 500 }))
    );

    const result = await fetchCardSets(["Lightning Bolt"]);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error fetching data for Lightning Bolt:", expect.any(Error));
  });

  test("Handles rate limiting (429) response", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": "60" }
      }))
    );

    const result = await fetchCardSets(["Lightning Bolt"]);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error fetching data for Lightning Bolt:", expect.any(Error));
  });

  test("Handles malformed JSON response", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response("invalid json", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }))
    );

    const result = await fetchCardSets(["Lightning Bolt"]);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error fetching data for Lightning Bolt:", expect.any(Error));
  });

  test("Handles API response without expected structure", async () => {
    const invalidResponse = {
      // Missing 'object' and 'data' fields
      cards: ["some data"]
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(invalidResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }))
    );

    const result = await fetchCardSets(["Lightning Bolt"]);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error with response for Lightning Bolt");
  });

  test("Handles API response with wrong object type", async () => {
    const wrongTypeResponse = {
      object: "card", // Should be "list"
      data: []
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(wrongTypeResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }))
    );

    const result = await fetchCardSets(["Lightning Bolt"]);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error with response for Lightning Bolt");
  });

  test("Handles partial success (some cards succeed, some fail)", async () => {
    const successResponse = {
      object: "list",
      data: [
        {
          name: "Lightning Bolt",
          set_name: "Alpha",
          colors: ["R"],
          prices: { usd: "100.00" },
          image_uris: { normal: "https://example.com/bolt.jpg" },
        },
      ],
    };

    let callCount = 0;
    global.fetch = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        // First call succeeds
        return Promise.resolve(new Response(JSON.stringify(successResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      } else {
        // Second call fails
        return Promise.reject(new Error("Network error"));
      }
    });

    const result = await fetchCardSets(["Lightning Bolt", "Counterspell"]);

    expect(result).toHaveLength(1);
    expect(result[0][0]).toBe("Alpha");
    expect(result[0][1]).toHaveLength(1);
    expect(result[0][1][0].name).toBe("Lightning Bolt");
    expect(console.error).toHaveBeenCalledWith("Error fetching data for Counterspell:", expect.any(Error));
  });

  test("Handles timeout scenarios", async () => {
    global.fetch = vi.fn(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 100)
      ) as Promise<Response>
    );

    const result = await fetchCardSets(["Lightning Bolt"]);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error fetching data for Lightning Bolt:", expect.any(Error));
  });

  test("Handles API response with missing card data fields", async () => {
    const incompleteResponse = {
      object: "list",
      data: [
        {
          name: "Lightning Bolt",
          // Missing set_name, colors, prices, image_uris
        },
      ],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(incompleteResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }))
    );

    const result = await fetchCardSets(["Lightning Bolt"]);

    // Should still process the card, filling in defaults for missing fields
    expect(result).toHaveLength(1);
    expect(result[0][1]).toHaveLength(1);
    expect(result[0][1][0].name).toBe("Lightning Bolt");
    expect(result[0][1][0].colors).toEqual([]);
    expect(result[0][1][0].price).toBe(0);
    expect(result[0][1][0].imageUrl).toBe("");
  });
});
