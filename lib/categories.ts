export const CATEGORIES = [
  { key: "Snacks", emoji: "🍪" },
  { key: "Cigarettes", emoji: "🚬" },
  { key: "Breakfast", emoji: "🍳" },
  { key: "Lunch", emoji: "🍛" },
  { key: "Outing with friends", emoji: "🍻" },
  { key: "Transportation", emoji: "🚕" },
  { key: "Shopping", emoji: "🛍️" },
  { key: "Date", emoji: "❤️" },
  { key: "Others", emoji: "📦" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as string[];
export const emojiFor = (k: string) => CATEGORIES.find((c) => c.key === k)?.emoji ?? "📦";
