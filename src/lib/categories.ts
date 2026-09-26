export type CategoryMeta = { emoji: string; color: string };

/** Visual identity for each category — pins, chips and legend all use this. */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  "Food & Drink": { emoji: "🍽️", color: "#f59e0b" },
  Shopping: { emoji: "🛍️", color: "#ec4899" },
  Services: { emoji: "🔧", color: "#64748b" },
  "Health & Wellness": { emoji: "💊", color: "#10b981" },
  Accommodation: { emoji: "🛏️", color: "#8b5cf6" },
  Entertainment: { emoji: "🎭", color: "#06b6d4" },
  "Civic & Community": { emoji: "🏛️", color: "#84cc16" },
  Transport: { emoji: "🚌", color: "#ef4444" },
  Other: { emoji: "📍", color: "#94a3b8" },
};

export function metaFor(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? CATEGORY_META["Other"];
}

/** Categories in display order, with live counts from the current data. */
export function categoryCounts(
  places: { category: string }[]
): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of places) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const order = Object.keys(CATEGORY_META);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort(
      (a, b) =>
        (order.indexOf(a.category) + 1 || 99) - (order.indexOf(b.category) + 1 || 99)
    );
}
