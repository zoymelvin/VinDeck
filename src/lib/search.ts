import type { App } from "./types";

export function filterApps(
  apps: App[],
  query: string,
  categoryFilter: string | null,
  showHidden = false
): App[] {
  const lowerQuery = query.toLowerCase().trim();

  return apps.filter((app) => {
    if (!showHidden && app.isHidden) return false;
    if (categoryFilter && app.category !== categoryFilter) return false;
    if (!lowerQuery) return true;

    const searchable = [
      app.name,
      app.description,
      app.category,
      ...app.tags,
    ].join(" ").toLowerCase();

    return searchable.includes(lowerQuery);
  });
}

export function sortAppsByOrder(apps: App[]): App[] {
  return [...apps].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getUniqueCategories(apps: App[]): string[] {
  const categories = new Set(apps.map((a) => a.category));
  return Array.from(categories).sort();
}