import multer from "multer";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Memory upload — Cloudinary upload happens in the library service. */
export const uploadProductImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG or WebP images are allowed"));
    }
    cb(null, true);
  },
});
