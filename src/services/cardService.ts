type PriceCategory = "$" | "$$" | "$$$";

export interface Card {
  name: string;
  colors: string[];
  imageUrl: string;
  priceCategory: PriceCategory;
}

type SetGroups = { [setName: string]: Card[] };

// **Extracts card names from text input**
export const extractCardNames = (input: string): string[] => {
  return input
    .split("\n")
    .map((line) => {
      const match = line.match(/\d+\s+(.+?)\s+\(.+\)/);
      return match ? match[1] : null;
    })
    .filter((name): name is string => name !== null);
};

// **Fetches card data from Scryfall API**
export const fetchCardSets = async (cardNames: string[]): Promise<[string, Card[]][]> => {
  const groups: SetGroups = {};

  for (const card of cardNames) {
    const cacheKey = `card_${card}`;
    let data;

    if (localStorage.getItem(cacheKey)) {
      console.log(`Loading ${card} from cache`);
      data = JSON.parse(localStorage.getItem(cacheKey)!);
      if ("object" in data && data.object == "error") {
        localStorage.removeItem(cacheKey);
        console.log(`Removed bad cache data for ${card}`);
        continue;
      }
    } else {
      console.log(`Fetching ${card} from scryfall`);
      const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(card)}&unique=prints`;
      try {
        const response = await fetch(url);
        data = await response.json();
        if ("object" in data && data.object === "list") {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          continue;
        }
      } catch (error) {
        console.error(`Error fetching data for ${card}:`, error);
        continue;
      }
    }

    if (!data.data) continue;

    data.data.forEach((cardData: any) => {
      // filter out promo and oversized cards
      if (
        cardData.promo ||
        cardData.oversized
      ) {
        return;
      }

      // data we care about
      const setName: string = cardData.set_name;
      const price = parseFloat(cardData.prices?.usd || "0");
      const priceCategory = price < 1 ? "$" : price < 5 ? "$$" : "$$$";

      if (!groups[setName]) {
        groups[setName] = [];
      }

      if (!groups[setName].some((c) => c.name === card)) {
        groups[setName].push({
          name: card,
          colors: cardData.colors || [],
          imageUrl: cardData.image_uris?.normal || "",
          priceCategory,
        });
      }
    });
  }

  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
};

// **Removes a card from all sets**
export const deselectCardFromSets = (setGroups: [string, Card[]][], cardName: string) => {
  return setGroups
    .map(([setName, cards]) => [setName, cards.filter((c) => c.name !== cardName)] as [string, Card[]])
    .filter(([_, cards]) => cards.length > 0);
};
