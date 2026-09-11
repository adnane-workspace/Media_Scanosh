import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import multer from "multer";
import libraryRouter from "./routes/library.js";
import fluxRouter from "./routes/flux.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

app.get("/api", (_req, res) => {
  res.json({
    name: "Media Scanosh API",
    forMenuApp: {
      restaurants: "GET /library?section=restaurant",
      cafes: "GET /library?section=cafe",
      fields: ["id", "title", "description", "image"],
      create: "POST /library/:section multipart { image, title, description }",
      update: "PATCH /library/:section/:id { title, description } optional image",
      delete: "DELETE /library/:section/:id",
    },
    flux: {
      catalog: "GET /flux/catalog",
      generate: "POST /flux/generate/:id",
      batch: "POST /flux/generate-batch { section, limit }",
      prompt: "POST /flux/prompt { prompt, title, section }",
    },
  });
});

app.use("/library", libraryRouter);
app.use("/flux", fluxRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
