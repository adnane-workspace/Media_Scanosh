/**
 * Unified restaurant browse layer.
 * Sources: TheMealDB + Free Food Menus
 */
import {
  searchMeals,
  filterByCategory,
  filterByArea,
  getMealById as getMealdbById,
  getRandomMeal,
  listCategories,
  listAreas,
} from "./mealdb.js";
import {
  listByCategory as listFfmByCategory,
  listAll as listAllFfm,
  getById as getFfmById,
  search as searchFfm,
  listFfmCategories,
} from "./freeFoodMenus.js";

export { listCategories, listAreas, getRandomMeal, listFfmCategories };

/**
 * @param {object} opts
 * @param {string} [opts.source] themealdb | ffm | all
 * @param {string} [opts.q]
 * @param {string} [opts.category] TheMealDB category or FFM slug
 * @param {string} [opts.area] TheMealDB area only
 */
export async function listMeals({ source = "themealdb", q, category, area } = {}) {
  const query = typeof q === "string" ? q.trim() : "";

  if (query) {
    if (source === "themealdb") return searchMeals(query);
    if (source === "ffm") return searchFfm(query);
    const [mdb, ffm] = await Promise.all([searchMeals(query), searchFfm(query)]);
    return [...mdb, ...ffm];
  }

  if (source === "ffm") {
    const cat = category || "burgers";
    return listFfmByCategory(cat);
  }

  if (source === "all") {
    const [mdb, ffm] = await Promise.all([
      filterByCategory(category || "Seafood"),
      listAllFfm(),
    ]);
    return [...mdb, ...ffm];
  }

  // themealdb (default)
  if (typeof area === "string" && area.trim()) return filterByArea(area);
  return filterByCategory(category || "Seafood");
}

export async function getMealById(id) {
  const raw = String(id);
  if (raw.startsWith("ffm-")) return getFfmById(raw);
  return getMealdbById(raw);
}
