import { cardCache } from './cardCache';

type PriceCategory = "$" | "$$" | "$$$";

export interface Card {
  name: string;
  colors: string[];
  imageUrl: string;
  price: number;
  priceCategory: PriceCategory;
}

type SetGroups = { [setName: string]: Card[] };

// **Extracts card names from text input**
export const extractCardNames = (input: string): string[] => {
  const cardRegex = /^(?:\d+\s+)?(.+?)(?:\s*\([A-Z0-9]+\))?(?:\s+[A-Z0-9-]+\d+|\s+\*\w*\*)?$/;

  const skipKeywords = new Set(["Deck", "Sideboard", "Commander"]);

  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      line.length > 0 &&
      !line.startsWith("/") &&
      !skipKeywords.has(line)
    )
    .map((line) => {
      const match = line.match(cardRegex);
      return match ? match[1].replace(/\s*\([A-Z0-9]+\)\s*[A-Z0-9-]*\d+[a-zA-Z]*$/, "").trim() : null;
    })
    .filter((name): name is string => name !== null);
};

// **Fetches card data from Scryfall API**
export const fetchCardSets = async (
  cardNames: string[],
  onProgress?: (current: number) => void
): Promise<[string, Card[]][]> => {
  const groups: SetGroups = {};
  let processedCount = 0;

  for (const card of cardNames) {
    const cacheKey = `card_${card}`;

    // Try to get cached data
    const cachedData = await cardCache.getItem(cacheKey);

    if (cachedData && cachedData.object === "list") {
      console.log(`Using cached data for ${card}`);
      processScryfallData(cachedData, groups);
      processedCount++;
      onProgress?.(processedCount);
      continue;
    }

    console.log(`Fetching fresh data for ${card}`);
    try {
      const response = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(card)}"&unique=prints`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.data && data.object && data.object === "list") {
        // Always process the data first, regardless of caching success
        processScryfallData(data, groups);

        // Then try to cache it for future use
        const cached = await cardCache.setItem(cacheKey, data);
        if (!cached) {
          console.warn(`Unable to cache data for ${card}, but card data is still processed`);
        }
      } else {
        console.error(`Error with response for ${card}`);
      }
    } catch (error) {
      console.error(`Error fetching data for ${card}:`, error);
    }

    processedCount++;
    onProgress?.(processedCount);
  }

  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
};

const processScryfallData = (data: any, groups: SetGroups) => {
  data.data.forEach((cardData: any) => {
    // filter out promo and oversized cards
    if (
      cardData.promo ||
      cardData.oversized
    ) {
      return;
    }

    const setName: string = cardData.set_name;
    const price = parseFloat(cardData.prices?.usd || "0");
    const priceCategory = price < 1 ? "$" : price < 5 ? "$$" : "$$$";

    if (!groups[setName]) {
      groups[setName] = [];
    }

    if (!groups[setName].some((c) => c.name === cardData.name)) {
      groups[setName].push({
        name: cardData.name,
        colors: cardData.color_identity || [],
        imageUrl: cardData.image_uris?.normal || "",
        price,
        priceCategory,
      });
    }
  });
};

// **Removes a card from all sets**
export const deselectCardFromSets = (setGroups: [string, Card[]][], cardName: string) => {
  return setGroups
    .map(([setName, cards]) => [setName, cards.filter((c) => c.name !== cardName)] as [string, Card[]])
    .filter(([_, cards]) => cards.length > 0);
};

// **Export cache utilities for testing and management**
export { cardCache };
