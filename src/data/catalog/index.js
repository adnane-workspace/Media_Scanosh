/**
 * Flux.2 Klein prompt catalog — per-category architecture.
 * Each entry: id, section, title, description, prompt
 */
import { CAFE } from "./cafe/index.js";
import { RESTAURANT, MOROCCAN } from "./restaurant/index.js";

export { CAFE, RESTAURANT, MOROCCAN };

export const FLUX_CATALOG = [...RESTAURANT, ...MOROCCAN, ...CAFE];

export function listFluxCatalog({ section, q, limit } = {}) {
  let items = FLUX_CATALOG;
  if (section === "cafe" || section === "restaurant") {
    items = items.filter((i) => i.section === section);
  }
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        i.description.toLowerCase().includes(needle) ||
        i.id.toLowerCase().includes(needle)
    );
  }
  if (limit && Number(limit) > 0) items = items.slice(0, Number(limit));
  return items;
}

export function getFluxCatalogItem(id) {
  return FLUX_CATALOG.find((i) => i.id === id) || null;
}

export function fluxCatalogStats() {
  const moroccan = FLUX_CATALOG.filter((i) => i.id.includes("-ma-")).length;
  return {
    total: FLUX_CATALOG.length,
    restaurant: FLUX_CATALOG.filter((i) => i.section === "restaurant").length,
    cafe: FLUX_CATALOG.filter((i) => i.section === "cafe").length,
    moroccan,
  };
}
