/**
 * Generate with Flux.2 Klein and save to Cloudinary.
 */
import { generateFluxImage } from "./fluxKlein.js";
import { getFluxCatalogItem } from "../data/fluxCatalog.js";
import { importFromImageUrl, toMenuItem } from "./cloudinaryLibrary.js";
import { withMenuStyle } from "./fluxPrompt.js";

function slugifyId(title) {
  const base = String(title || "photo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "photo"}-${Date.now().toString(36)}`;
}

/** Freeform prompt → Cloudinary library item */
export async function generateAndImportFromPrompt({
  prompt,
  title,
  description = "",
  section = "cafe",
  id,
  model = "klein-4b",
} = {}) {
  const name = (title || "").trim();
  const text = (prompt || "").trim();
  if (!text) {
    const err = new Error("prompt is required");
    err.status = 400;
    throw err;
  }
  if (!name) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  if (section !== "cafe" && section !== "restaurant") {
    const err = new Error("section must be cafe or restaurant");
    err.status = 400;
    throw err;
  }

  const generated = await generateFluxImage({
    prompt: withMenuStyle(text),
    model,
  });

  const imported = await importFromImageUrl(section, {
    id: id || slugifyId(name),
    title: name,
    description,
    imageUrl: generated.url,
    source: "flux",
  });

  return {
    ...toMenuItem(imported),
    fluxId: generated.id,
    model: generated.model,
    prompt: withMenuStyle(text),
  };
}

export async function generateAndImportFluxItem(
  catalogId,
  { model = "klein-4b" } = {}
) {
  const entry = getFluxCatalogItem(catalogId);
  if (!entry) {
    const err = new Error(`Catalog item not found: ${catalogId}`);
    err.status = 404;
    throw err;
  }

  const generated = await generateFluxImage({
    prompt: entry.prompt,
    model,
  });

  const imported = await importFromImageUrl(entry.section, {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    imageUrl: generated.url,
    source: "flux",
  });

  return {
    ...toMenuItem(imported),
    fluxId: generated.id,
    model: generated.model,
  };
}

export async function generateAndImportMany(
  ids,
  { model = "klein-4b", delayMs = 800 } = {}
) {
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  const results = { imported: [], failed: [] };

  for (const id of unique) {
    try {
      const item = await generateAndImportFluxItem(id, { model });
      results.imported.push(item);
      console.log(`OK ${id} → ${item.title}`);
    } catch (err) {
      results.failed.push({ id, error: err.message || "failed" });
      console.error(`FAIL ${id}:`, err.message);
    }
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }

  return {
    total: unique.length,
    success: results.imported.length,
    failed: results.failed.length,
    items: results.imported,
    errors: results.failed,
  };
}
