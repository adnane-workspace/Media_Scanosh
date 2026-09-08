import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../cloudinary.js";

const ALLOWED_SECTIONS = new Set(["cafe", "restaurant"]);

function createUploader(section) {
  if (!ALLOWED_SECTIONS.has(section)) {
    throw new Error(`Invalid section: ${section}`);
  }

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `places/${section}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1600, crop: "limit" }],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

export const uploadCafe = createUploader("cafe");
export const uploadRestaurant = createUploader("restaurant");
