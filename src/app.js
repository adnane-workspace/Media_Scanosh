import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import multer from "multer";
import photosRouter from "./routes/photos.js";
import restaurantRouter from "./routes/restaurant.js";
import cafeRouter from "./routes/cafe.js";
import libraryRouter from "./routes/library.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

app.get("/api", (_req, res) => {
  res.json({
    name: "Menu Media API",
    forMenuApp: {
      restaurants: "GET /library?section=restaurant",
      cafes: "GET /library?section=cafe",
      fields: ["id", "title", "description", "image"],
      create: "POST /library/:section multipart { image, title, description }",
      update: "PATCH /library/:section/:id { title, description } optional image",
      delete: "DELETE /library/:section/:id",
    },
    admin: {
      restaurantBrowse: "GET /restaurant/meals",
      restaurantSaveAll: "POST /restaurant/meals/import-all",
      cafeBrowse: "GET /cafe/drinks?type=hot|iced|all",
      cafeSaveAll: "POST /cafe/drinks/import-all",
    },
  });
});

app.use("/library", libraryRouter);
app.use("/restaurant", restaurantRouter);
app.use("/cafe", cafeRouter);
app.use("/photos", photosRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
