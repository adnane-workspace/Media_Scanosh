import { Router } from "express";
import {
  listCategories,
  listAreas,
  listFfmCategories,
  listMeals,
  getMealById,
  getRandomMeal,
} from "../services/restaurantApi.js";
import {
  listImportedMeals,
  getImportedMeal,
  importMeal,
  importManyMeals,
  deleteImportedMeal,
  toMenuItem,
} from "../services/cloudinaryLibrary.js";

/**
 * Admin / scrape layer for restaurants:
 * browse TheMealDB + Free Food Menus → import to Cloudinary.
 * Menu app should prefer GET /library?section=restaurant
 */
const router = Router();

router.get("/categories", async (_req, res) => {
  try {
    const categories = await listCategories();
    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch categories from TheMealDB" });
  }
});

router.get("/ffm-categories", async (_req, res) => {
  try {
    res.json({ categories: listFfmCategories() });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch Free Food Menus categories" });
  }
});

router.get("/areas", async (_req, res) => {
  try {
    const areas = await listAreas();
    res.json({ areas });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch areas from TheMealDB" });
  }
});

router.get("/library", async (_req, res) => {
  try {
    const meals = (await listImportedMeals()).map(toMenuItem);
    res.json({ count: meals.length, items: meals });
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: err?.message || "Failed to list Cloudinary library",
      hint: "Check CLOUDINARY_CLOUD_NAME matches your dashboard exactly",
    });
  }
});

router.get("/library/:id", async (req, res) => {
  try {
    const meal = await getImportedMeal(req.params.id);
    if (!meal) return res.status(404).json({ error: "Not in Cloudinary library" });
    res.json(toMenuItem(meal));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch library meal" });
  }
});

router.delete("/library/:id", async (req, res) => {
  try {
    await deleteImportedMeal(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to delete from Cloudinary" });
  }
});

router.get("/meals", async (req, res) => {
  try {
    const { q, category, area, source = "themealdb" } = req.query;
    const meals = await listMeals({ source, q, category, area });

    res.json({
      count: meals.length,
      meals,
      source,
      sources: [
        "https://www.themealdb.com",
        "https://free-food-menus-api-two.vercel.app",
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch meals" });
  }
});

router.get("/meals/random", async (_req, res) => {
  try {
    const meal = await getRandomMeal();
    if (!meal) return res.status(404).json({ error: "No meal found" });
    res.json(meal);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch random meal" });
  }
});

router.post("/meals/import-all", async (req, res) => {
  try {
    let ids = Array.isArray(req.body?.ids) ? req.body.ids : [];

    if (!ids.length) {
      const { q, category, area, source = "themealdb" } = req.body || {};
      const meals = await listMeals({ source, q, category, area });
      ids = meals.map((m) => m.id);
    }

    if (!ids.length) {
      return res.status(400).json({ error: "No meals to import" });
    }

    const result = await importManyMeals(ids);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: err.message || "Failed to import meals",
      hint: "Check Cloudinary credentials",
    });
  }
});

router.post("/meals/:id/import", async (req, res) => {
  try {
    const imported = await importMeal(req.params.id);
    res.status(201).json(toMenuItem(imported));
  } catch (err) {
    console.error(err);
    const status = err.status || 502;
    res.status(status).json({
      error: err.message || "Failed to import meal to Cloudinary",
      hint: "Check CLOUDINARY_CLOUD_NAME / API keys in .env",
    });
  }
});

router.get("/meals/:id", async (req, res) => {
  try {
    const meal = await getMealById(req.params.id);
    if (!meal) return res.status(404).json({ error: "Meal not found" });

    const imported = await getImportedMeal(req.params.id).catch(() => null);
    const fallbackDesc = meal.description || [meal.category, meal.area].filter(Boolean).join(" · ");

    res.json({
      id: meal.id,
      name: meal.name,
      title: imported?.name || meal.name,
      description: imported?.description || fallbackDesc,
      image: imported?.image || meal.image,
      category: meal.category,
      area: meal.area,
      source: meal.source || "themealdb",
      imported: Boolean(imported),
      cloudinaryImage: imported?.image || null,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch meal details" });
  }
});

export default router;
