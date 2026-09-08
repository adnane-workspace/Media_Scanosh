import { Router } from "express";
import pool from "../db.js";
import cloudinary from "../cloudinary.js";
import { uploadCafe, uploadRestaurant } from "../middleware/upload.js";

const router = Router();

async function listBySection(section, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, section, place_name, city, description, image_url, cloudinary_id, created_at
       FROM photos
       WHERE section = $1
       ORDER BY created_at DESC`,
      [section]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
}

async function createPhoto(section, req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required (field: image)" });
    }

    const place_name = (req.body.place_name || "").trim();
    if (!place_name) {
      return res.status(400).json({ error: "place_name is required" });
    }

    const city = (req.body.city || "").trim() || null;
    const description = (req.body.description || "").trim() || null;
    const image_url = req.file.path;
    const cloudinary_id = req.file.filename;

    const { rows } = await pool.query(
      `INSERT INTO photos (section, place_name, city, description, image_url, cloudinary_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, section, place_name, city, description, image_url, cloudinary_id, created_at`,
      [section, place_name, city, description, image_url, cloudinary_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create photo" });
  }
}

router.get("/cafe", (req, res) => listBySection("cafe", res));
router.get("/restaurant", (req, res) => listBySection("restaurant", res));

router.post("/cafe", uploadCafe.single("image"), (req, res) =>
  createPhoto("cafe", req, res)
);
router.post("/restaurant", uploadRestaurant.single("image"), (req, res) =>
  createPhoto("restaurant", req, res)
);

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, section, place_name, city, description, image_url, cloudinary_id, created_at
       FROM photos
       WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Photo not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch photo" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM photos WHERE id = $1 RETURNING cloudinary_id`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Photo not found" });
    }

    await cloudinary.uploader.destroy(rows[0].cloudinary_id);

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

export default router;
