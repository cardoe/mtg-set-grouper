type PriceCategory = "$" | "$$" | "$$$";

export interface Card {
  name: string;
  colors: string[];
  imageUrl: string;
  price: number;
  priceCategory: PriceCategory;
}

type SetGroups = { [setName: string]: Card[] };

// **LocalStorage management functions**
const getStorageSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

const clearOldestCacheEntries = (keepCount: number = 50): void => {
  const cacheKeys = Object.keys(localStorage)
    .filter(key => key.startsWith('card_'))
    .map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return { key, timestamp: data.timestamp || 0 };
      } catch {
        return { key, timestamp: 0 };
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest entries, keeping only the specified count
  const toRemove = cacheKeys.slice(0, Math.max(0, cacheKeys.length - keepCount));
  toRemove.forEach(({ key }) => {
    localStorage.removeItem(key);
  });

  if (toRemove.length > 0) {
    console.log(`Cleared ${toRemove.length} old cache entries to free up space`);
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded, clearing old cache entries...');

      // Clear oldest entries and try again
      clearOldestCacheEntries(30);

      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.warn('Still unable to save to localStorage after cleanup, skipping cache for this item');
        return false;
      }
    }
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

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
  const CACHE_EXPIRATION_HOURS = 96;
  let processedCount = 0;

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
            processedCount++;
            onProgress?.(processedCount);
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
        // Always process the data first, regardless of caching success
        processScryfallData(data, groups);

        // Then try to cache it for future use
        const cacheData = JSON.stringify({ timestamp: now, data });
        const cached = safeSetItem(cacheKey, cacheData);
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

// **Export utility functions for testing**
export const cacheUtils = {
  getStorageSize,
  clearOldestCacheEntries,
  safeSetItem
};
