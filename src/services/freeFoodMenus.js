/**
 * Free Food Menus API — real restaurant menu photos (Goldbelly).
 * https://free-food-menus-api-two.vercel.app/{category}
 */

const BASE = "https://free-food-menus-api-two.vercel.app";

export const FFM_CATEGORIES = [
  { slug: "best-foods", label: "Best foods" },
  { slug: "bbqs", label: "BBQ" },
  { slug: "burgers", label: "Burgers" },
  { slug: "pizzas", label: "Pizzas" },
  { slug: "steaks", label: "Steaks" },
  { slug: "fried-chicken", label: "Fried chicken" },
  { slug: "sandwiches", label: "Sandwiches" },
  { slug: "porks", label: "Pork" },
  { slug: "sausages", label: "Sausages" },
  { slug: "breads", label: "Breads" },
  { slug: "desserts", label: "Desserts" },
  { slug: "ice-cream", label: "Ice cream" },
  { slug: "chocolates", label: "Chocolates" },
  { slug: "drinks", label: "Drinks" },
];

const cache = new Map();

async function fetchCategory(slug) {
  if (cache.has(slug)) return cache.get(slug);

  const res = await fetch(`${BASE}/${slug}`);
  if (!res.ok) throw new Error(`Free Food Menus error (${res.status}) for ${slug}`);

  const data = await res.json();
  const items = Array.isArray(data) ? data : [];
  cache.set(slug, items);
  return items;
}

function mapItem(item, category) {
  return {
    id: `ffm-${item.id}`,
    externalId: item.id,
    name: item.name,
    title: item.name,
    description: item.dsc || "",
    image: item.img || null,
    imageMedium: item.img || null,
    category,
    area: item.country || null,
    price: item.price ?? null,
    rate: item.rate ?? null,
    source: "freefoodmenus",
  };
}

export function listFfmCategories() {
  return FFM_CATEGORIES.map(({ slug, label }) => ({ slug, label }));
}

export async function listByCategory(category) {
  const slug = category.trim().toLowerCase();
  const items = await fetchCategory(slug);
  return items.filter((i) => i.img).map((i) => mapItem(i, slug));
}

export async function listAll() {
  const lists = await Promise.all(
    FFM_CATEGORIES.map(({ slug }) =>
      fetchCategory(slug)
        .then((items) => items.filter((i) => i.img).map((i) => mapItem(i, slug)))
        .catch(() => [])
    )
  );
  return lists.flat();
}

export async function getById(id) {
  const raw = String(id).startsWith("ffm-") ? String(id).slice(4) : String(id);
  const all = await listAll();
  return all.find((m) => m.externalId === raw || m.id === `ffm-${raw}`) || null;
}

export async function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return listAll();

  const all = await listAll();
  return all.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.category && m.category.toLowerCase().includes(q))
  );
}
