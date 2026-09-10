/**
 * Cafe drink service.
 *
 * Sources (no API key needed):
 *  - TheCocktailDB free tier  → coffee, tea, cocoa, shakes, soft drinks
 *  - DummyJSON /recipes       → smoothies & lassi (mealType=Beverage)
 *
 * Type filter values accepted by listCoffees():
 *   all | coffee | tea | cocoa | shake | softdrink | smoothie
 */

const COCKTAIL_BASE = "https://www.thecocktaildb.com/api/json/v1/1";
const DUMMYJSON_BASE = "https://dummyjson.com";

// CocktailDB category → internal type tag
const COCKTAILDB_CATEGORIES = [
  { category: "Coffee / Tea", type: "coffee" },
  { category: "Cocoa",        type: "cocoa"  },
  { category: "Shake",        type: "shake"  },
  { category: "Soft Drink",   type: "softdrink" },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

/** Map a CocktailDB summary drink (from filter endpoint) to our format */
function mapCocktailSummary(drink, type) {
  return {
    id: `cdb-${drink.idDrink}`,
    externalId: String(drink.idDrink),
    name: drink.strDrink,
    title: drink.strDrink,
    description: "",           // populated on detail fetch
    image: `${drink.strDrinkThumb}/preview`, // smaller preview image
    fullImage: drink.strDrinkThumb,
    type,
    source: "cocktaildb",
  };
}

/** Map a CocktailDB detail drink */
function mapCocktailDetail(d, type) {
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = d[`strIngredient${i}`];
    if (ing && ing.trim()) ingredients.push(ing.trim());
  }
  return {
    id: `cdb-${d.idDrink}`,
    externalId: String(d.idDrink),
    name: d.strDrink,
    title: d.strDrink,
    description: d.strInstructions || "",
    image: d.strDrinkThumb,
    fullImage: d.strDrinkThumb,
    type,
    source: "cocktaildb",
    ingredients,
    glass: d.strGlass || null,
    alcoholic: d.strAlcoholic || null,
  };
}

/** Map a DummyJSON recipe (beverage) */
function mapDummyBeverage(r) {
  return {
    id: `djb-${r.id}`,
    externalId: String(r.id),
    name: r.name,
    title: r.name,
    description: Array.isArray(r.instructions) ? r.instructions.join(" ") : "",
    image: r.image,
    fullImage: r.image,
    type: "smoothie",
    source: "dummyjson",
    ingredients: r.ingredients || [],
    cuisine: r.cuisine || null,
    tags: r.tags || [],
  };
}

// ─── Cache (in-memory, reset on restart) ───────────────────────────────────
let _cocktailCache = null;   // all CocktailDB drinks
let _dummyCache    = null;   // all DummyJSON beverages

async function getAllCocktailDrinks() {
  if (_cocktailCache) return _cocktailCache;

  const lists = await Promise.all(
    COCKTAILDB_CATEGORIES.map(({ category, type }) =>
      fetchJson(`${COCKTAIL_BASE}/filter.php?c=${encodeURIComponent(category)}`)
        .then((d) => (d.drinks || []).map((dr) => mapCocktailSummary(dr, type)))
        .catch(() => [])
    )
  );

  _cocktailCache = lists.flat();
  return _cocktailCache;
}

async function getAllDummyBeverages() {
  if (_dummyCache) return _dummyCache;
  const data = await fetchJson(
    `${DUMMYJSON_BASE}/recipes/meal-type/beverage?limit=50&select=id,name,instructions,image,ingredients,cuisine,tags`
  );
  _dummyCache = (data.recipes || []).map(mapDummyBeverage);
  return _dummyCache;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * List drinks.
 * @param {string} type  all | coffee | tea | cocoa | shake | softdrink | smoothie
 */
export async function listCoffees(type = "all") {
  const [cocktails, dummies] = await Promise.all([
    getAllCocktailDrinks(),
    getAllDummyBeverages(),
  ]);

  const all = [...cocktails, ...dummies];

  if (type === "all") return all;

  // "coffee" includes coffee AND tea from CocktailDB (same category)
  if (type === "coffee" || type === "tea") {
    return all.filter((d) => d.type === "coffee");
  }

  return all.filter((d) => d.type === type);
}

export async function getCoffeeById(id) {
  const raw = String(id);

  // DummyJSON beverage
  if (raw.startsWith("djb-")) {
    const all = await getAllDummyBeverages();
    return all.find((d) => d.id === raw) || null;
  }

  // CocktailDB — fetch full detail for description/ingredients
  const externalId = raw.startsWith("cdb-") ? raw.slice(4) : raw;
  const all = await getAllCocktailDrinks();
  const summary = all.find((d) => d.externalId === externalId || d.id === raw);

  if (!summary) return null;

  try {
    const detail = await fetchJson(
      `${COCKTAIL_BASE}/lookup.php?i=${externalId}`
    );
    const d = detail.drinks?.[0];
    if (d) return mapCocktailDetail(d, summary.type);
  } catch (_) {
    // fall back to summary
  }
  return summary;
}

export async function searchCoffees(query) {
  const q = query.trim().toLowerCase();
  if (!q) return listCoffees("all");

  const all = await listCoffees("all");
  return all.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
  );
}
