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
export const fetchCardSets = async (cardNames: string[]): Promise<[string, Card[]][]> => {
  const groups: SetGroups = {};
  const CACHE_EXPIRATION_HOURS = 96;

  for (const card of cardNames) {
    const cacheKey = `card_${card}`;
    const cachedData = localStorage.getItem(cacheKey);
    const now = Date.now();

    if (cachedData) {
      try {
        const parsedCache = JSON.parse(cachedData);

        if (parsedCache.timestamp && parsedCache.data && parsedCache.data.object && parsedCache.data.object === "list") {
          const isFresh = now - parsedCache.timestamp < CACHE_EXPIRATION_HOURS * 60 * 60 * 1000;

          if (isFresh) {
            console.log(`Using cached data for ${card}`);
            processScryfallData(parsedCache.data, groups);
            continue;
          }
        } else {
          console.warn(`Cache format outdated for ${card}, fetching new data.`);
        }
      } catch (error) {
        console.error(`Error parsing cache for ${card}:`, error);
      }
    }

    console.log(`Fetching fresh data for ${card}`);
    try {
      const response = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(card)}"&unique=prints`);
      const data = await response.json();

      if (data.data && data.object && data.object === "list") {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data }));
        processScryfallData(data, groups);
      } else {
        console.error(`Error with response for ${card}`);
      }
    } catch (error) {
      console.error(`Error fetching data for ${card}:`, error);
    }
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
