function getBaseUrl() {
  const key = process.env.MEALDB_API_KEY || "1";
  return `https://www.themealdb.com/api/json/v1/${key}`;
}

async function mealdbFetch(path) {
  const res = await fetch(`${getBaseUrl()}${path}`);
  if (!res.ok) {
    throw new Error(`TheMealDB error (${res.status})`);
  }
  return res.json();
}

function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i += 1) {
    const name = meal[`strIngredient${i}`]?.trim();
    if (!name) continue;
    const measure = meal[`strMeasure${i}`]?.trim() || "";
    ingredients.push({ name, measure });
  }
  return ingredients;
}

function mapSummary(meal) {
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    imageMedium: meal.strMealThumb ? `${meal.strMealThumb}/medium` : null,
    category: meal.strCategory || null,
    area: meal.strArea || null,
    source: "themealdb",
  };
}

function mapDetail(meal) {
  return {
    ...mapSummary(meal),
    instructions: meal.strInstructions || "",
    youtube: meal.strYoutube || null,
    sourceUrl: meal.strSource || null,
    tags: meal.strTags
      ? meal.strTags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    ingredients: extractIngredients(meal),
    mealPage: `https://www.themealdb.com/meal/${meal.idMeal}`,
    attribution: "Recipe data and imagery: TheMealDB (https://www.themealdb.com/)",
  };
}

export async function listCategories() {
  const data = await mealdbFetch("/list.php?c=list");
  return (data.meals || []).map((item) => item.strCategory);
}

export async function listAreas() {
  const data = await mealdbFetch("/list.php?a=list");
  return (data.meals || []).map((item) => item.strArea);
}

export async function searchMeals(query) {
  const q = encodeURIComponent(query.trim());
  const data = await mealdbFetch(`/search.php?s=${q}`);
  return (data.meals || []).map(mapSummary);
}

export async function filterByCategory(category) {
  const c = encodeURIComponent(category.trim());
  const data = await mealdbFetch(`/filter.php?c=${c}`);
  return (data.meals || []).map(mapSummary);
}

export async function filterByArea(area) {
  const a = encodeURIComponent(area.trim());
  const data = await mealdbFetch(`/filter.php?a=${a}`);
  return (data.meals || []).map(mapSummary);
}

export async function getMealById(id) {
  const data = await mealdbFetch(`/lookup.php?i=${encodeURIComponent(id)}`);
  const meal = data.meals?.[0];
  return meal ? mapDetail(meal) : null;
}

export async function getRandomMeal() {
  const data = await mealdbFetch("/random.php");
  const meal = data.meals?.[0];
  return meal ? mapDetail(meal) : null;
}
