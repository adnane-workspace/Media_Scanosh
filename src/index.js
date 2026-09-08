import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import photosRouter from "./routes/photos.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    name: "Cafe & Restaurant Photos API",
    sections: ["cafe", "restaurant"],
    endpoints: {
      "GET /photos/cafe": "List cafe photos",
      "GET /photos/restaurant": "List restaurant photos",
      "GET /photos/:id": "Get one photo",
      "POST /photos/cafe":
        "Upload cafe photo (multipart: image, place_name, city?, description?)",
      "POST /photos/restaurant":
        "Upload restaurant photo (multipart: image, place_name, city?, description?)",
      "DELETE /photos/:id": "Delete photo",
    },
  });
});

app.use("/photos", photosRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
