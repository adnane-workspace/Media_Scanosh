import { Router } from "express";
import {
  listFluxCatalog,
  getFluxCatalogItem,
  fluxCatalogStats,
} from "../data/fluxCatalog.js";
import {
  generateAndImportFluxItem,
  generateAndImportMany,
  generateAndImportFromPrompt,
} from "../services/fluxLibrary.js";

/**
 * Flux.2 Klein — generate menu photos into Cloudinary.
 */
const router = Router();

router.get("/catalog", (req, res) => {
  const { section, q, limit } = req.query;
  const items = listFluxCatalog({ section, q, limit });
  res.json({
    ...fluxCatalogStats(),
    count: items.length,
    items: items.map(({ id, section, title, description }) => ({
      id,
      section,
      title,
      description,
    })),
  });
});

router.get("/catalog/:id", (req, res) => {
  const item = getFluxCatalogItem(req.params.id);
  if (!item) return res.status(404).json({ error: "Catalog item not found" });
  res.json(item);
});

router.post("/generate/:id", async (req, res) => {
  try {
    const model = req.body?.model || "klein-4b";
    const item = await generateAndImportFluxItem(req.params.id, { model });
    res.status(201).json(item);
  } catch (err) {
    console.error(err.message || err);
    const status = err.status || 502;
    res.status(status).json({ error: err.message || "Flux generation failed" });
  }
});

router.post("/generate-batch", async (req, res) => {
  try {
    const { ids, section, limit, model = "klein-4b" } = req.body || {};
    let list = Array.isArray(ids) ? ids : [];

    if (!list.length) {
      list = listFluxCatalog({ section, limit: limit || 5 }).map((i) => i.id);
    }

    list = list.slice(0, 10);

    const result = await generateAndImportMany(list, { model, delayMs: 600 });
    res.status(201).json(result);
  } catch (err) {
    console.error(err.message || err);
    const status = err.status || 502;
    res.status(status).json({ error: err.message || "Batch generation failed" });
  }
});

router.post("/prompt", async (req, res) => {
  try {
    const {
      prompt,
      title,
      description,
      section,
      id,
      model = "klein-4b",
    } = req.body || {};
    const item = await generateAndImportFromPrompt({
      prompt,
      title,
      description,
      section,
      id,
      model,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err.message || err);
    const status = err.status || 502;
    res.status(status).json({ error: err.message || "Prompt generation failed" });
  }
});

export default router;
