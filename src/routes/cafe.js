import { Router } from "express";
import {
  listCoffees,
  searchCoffees,
  getCoffeeById,
} from "../services/coffeeApi.js";
import {
  listLibrary,
  getLibraryItem,
  importCafeFromCoffeeApi,
  importManyCoffees,
  deleteLibraryItem,
  toMenuItem,
} from "../services/cloudinaryLibrary.js";

/**
 * Cafe scrape layer: SampleAPIs Coffee → Cloudinary media/cafe
 */
const router = Router();

router.get("/drinks", async (req, res) => {
  try {
    const { type = "all", q } = req.query;
    let drinks =
      typeof q === "string" && q.trim()
        ? await searchCoffees(q)
        : await listCoffees(type);

    if (typeof type === "string" && (type === "hot" || type === "iced") && q) {
      drinks = drinks.filter((d) => d.type === type);
    }

    res.json({
      count: drinks.length,
      drinks,
      sources: [
        "https://www.thecocktaildb.com (Coffee/Tea, Cocoa, Shake, Soft Drink)",
        "https://dummyjson.com/recipes (Beverages/Smoothies)",
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch cafe drinks" });
  }
});

router.get("/library", async (_req, res) => {
  try {
    const items = (await listLibrary("cafe")).map(toMenuItem);
    res.json({ count: items.length, items });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "Failed to list cafe library" });
  }
});

router.post("/drinks/import-all", async (req, res) => {
  try {
    let ids = Array.isArray(req.body?.ids) ? req.body.ids : [];

    if (!ids.length) {
      const type = req.body?.type || "all";
      const drinks = await listCoffees(type);
      ids = drinks.map((d) => d.id);
    }

    if (!ids.length) {
      return res.status(400).json({ error: "No drinks to import" });
    }

    const result = await importManyCoffees(ids);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "Failed to import coffees" });
  }
});

router.post("/drinks/:id/import", async (req, res) => {
  try {
    const imported = await importCafeFromCoffeeApi(req.params.id);
    res.status(201).json(toMenuItem(imported));
  } catch (err) {
    console.error(err);
    const status = err.status || 502;
    res.status(status).json({ error: err.message || "Failed to import drink" });
  }
});

router.get("/drinks/:id", async (req, res) => {
  try {
    const drink = await getCoffeeById(req.params.id);
    if (!drink) return res.status(404).json({ error: "Drink not found" });

    const imported = await getLibraryItem("cafe", req.params.id).catch(() => null);
    res.json({
      ...drink,
      imported: Boolean(imported),
      title: imported?.name || drink.title,
      description: imported?.description || drink.description,
      image: imported?.image || drink.image,
      cloudinaryImage: imported?.image || null,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch drink" });
  }
});

router.delete("/library/:id", async (req, res) => {
  try {
    await deleteLibraryItem("cafe", req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to delete cafe item" });
  }
});

export default router;
