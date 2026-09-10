import { Router } from "express";
import {
  listLibrary,
  getLibraryItem,
  createLibraryItem,
  deleteLibraryItem,
  updateLibraryItem,
  toMenuItem,
  SECTIONS,
} from "../services/cloudinaryLibrary.js";
import { uploadProductImage } from "../middleware/uploadProduct.js";

/**
 * Consumer API for the menu builder app.
 * CRUD: id, title, description, image
 */
const router = Router();

function assertSection(section, res) {
  if (!SECTIONS[section]) {
    res.status(400).json({ error: "Invalid section", allowed: Object.keys(SECTIONS) });
    return false;
  }
  return true;
}

router.get("/", async (req, res) => {
  try {
    const section = req.query.section;
    if (section && !SECTIONS[section]) {
      return res.status(400).json({
        error: "Invalid section",
        allowed: Object.keys(SECTIONS),
      });
    }

    const items = (await listLibrary(section || null)).map(toMenuItem);
    res.json({
      count: items.length,
      section: section || "all",
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: err?.message || "Failed to list library",
      hint: "Verify CLOUDINARY_CLOUD_NAME matches your Cloudinary dashboard",
    });
  }
});

/** Create product: multipart { image, title, description } */
router.post("/:section", uploadProductImage.single("image"), async (req, res) => {
  try {
    const { section } = req.params;
    if (!assertSection(section, res)) return;

    const title = req.body?.title || req.body?.place_name || "";
    const description = req.body?.description || "";

    const created = await createLibraryItem(section, {
      title,
      description,
      file: req.file,
    });
    res.status(201).json(toMenuItem(created));
  } catch (err) {
    console.error(err);
    const status = err.status || 502;
    res.status(status).json({ error: err.message || "Failed to create product" });
  }
});

router.get("/:section/:id", async (req, res) => {
  try {
    const { section, id } = req.params;
    if (!assertSection(section, res)) return;
    const item = await getLibraryItem(section, id);
    if (!item) return res.status(404).json({ error: "Item not found in library" });
    res.json(toMenuItem(item));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch library item" });
  }
});

/** Update title/description and optionally replace image */
router.patch("/:section/:id", uploadProductImage.single("image"), async (req, res) => {
  try {
    const { section, id } = req.params;
    if (!assertSection(section, res)) return;

    const body = req.body || {};
    const title = body.title;
    const description = body.description;

    if (title === undefined && description === undefined && !req.file) {
      return res.status(400).json({
        error: "Provide title, description and/or image",
      });
    }

    const updated = await updateLibraryItem(section, id, {
      title,
      description,
      file: req.file,
    });
    res.json(toMenuItem(updated));
  } catch (err) {
    console.error(err);
    const status = err.status || 502;
    res.status(status).json({ error: err.message || "Failed to update item" });
  }
});

router.delete("/:section/:id", async (req, res) => {
  try {
    const { section, id } = req.params;
    if (!assertSection(section, res)) return;
    await deleteLibraryItem(section, id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to delete library item" });
  }
});

export default router;
