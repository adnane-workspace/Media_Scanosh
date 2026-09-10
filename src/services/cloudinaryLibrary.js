import cloudinary from "../cloudinary.js";
import { getMealById } from "./restaurantApi.js";
import { getCoffeeById } from "./coffeeApi.js";

/** Cloudinary folders used by this media API */
export const SECTIONS = {
  restaurant: "media/restaurant",
  cafe: "media/cafe",
};

const PREFIXES = {
  restaurant: ["mealdb", "ffm", "item"],
  cafe: ["drink", "coffee", "item"],
};

function folderFor(section) {
  const folder = SECTIONS[section];
  if (!folder) {
    const err = new Error(`Invalid section: ${section}. Use restaurant|cafe`);
    err.status = 400;
    throw err;
  }
  return folder;
}

function publicIdFor(section, externalId, prefix = "item") {
  return `${folderFor(section)}/${prefix}_${externalId}`;
}

function shortDescription(meal) {
  const fromMeta = [meal.category, meal.area].filter(Boolean).join(" · ");
  if (meal.instructions) {
    const first = meal.instructions.split(/\n|\./).map((s) => s.trim()).find(Boolean);
    if (first) return first.slice(0, 160);
  }
  return fromMeta || "";
}

/** Shape for the menu app: photo + title + description only */
export function toMenuItem(item) {
  return {
    id: item.id,
    section: item.section,
    title: item.name || item.title || "",
    description: item.description || "",
    image: item.image,
  };
}

function mapResource(resource, section) {
  const ctx = resource.context?.custom || {};
  const externalId =
    ctx.external_id ||
    ctx.mealdb_id ||
    resource.public_id.split("_").pop();

  return {
    id: externalId,
    section,
    name: ctx.name || resource.display_name || resource.filename || externalId,
    category: ctx.category || null,
    area: ctx.area || null,
    description: ctx.description || null,
    image: resource.secure_url,
    imageMedium: cloudinary.url(resource.public_id, {
      secure: true,
      width: 350,
      height: 350,
      crop: "fill",
    }),
    cloudinaryId: resource.public_id,
    externalSource: ctx.external_source || null,
  };
}

async function resolvePublicId(section, externalId) {
  const prefixes = PREFIXES[section] || ["item"];
  for (const prefix of prefixes) {
    const publicId = publicIdFor(section, externalId, prefix);
    try {
      await cloudinary.api.resource(publicId);
      return publicId;
    } catch (err) {
      if (err?.error?.http_code === 404 || err?.http_code === 404) continue;
      throw err;
    }
  }
  return null;
}

export async function listLibrary(section) {
  if (section) {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: `${folderFor(section)}/`,
      max_results: 100,
      context: true,
    });
    return (result.resources || []).map((r) => mapResource(r, section));
  }

  const [restaurant, cafe] = await Promise.all([
    listLibrary("restaurant"),
    listLibrary("cafe"),
  ]);
  return [...restaurant, ...cafe];
}

export async function getLibraryItem(section, externalId) {
  const publicId = await resolvePublicId(section, externalId);
  if (!publicId) return null;
  const resource = await cloudinary.api.resource(publicId, { context: true });
  return mapResource(resource, section);
}

export async function createLibraryItem(section, { title, description, file }) {
  const name = (title || "").trim();
  if (!name) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  if (!file?.buffer) {
    const err = new Error("Image file is required");
    err.status = 400;
    throw err;
  }

  const id = `custom-${Date.now()}`;
  const publicId = publicIdFor(section, id, "item");
  const desc = (description || "").trim().slice(0, 500);

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const upload = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    overwrite: false,
    tags: [section, "menu", "custom"],
    context: {
      external_id: id,
      external_source: "custom",
      name,
      description: desc,
      section,
    },
  });

  return mapResource(
    {
      ...upload,
      context: {
        custom: {
          external_id: id,
          external_source: "custom",
          name,
          description: desc,
        },
      },
    },
    section
  );
}

export async function updateLibraryItem(section, externalId, { title, description, file }) {
  const publicId = await resolvePublicId(section, externalId);
  if (!publicId) {
    const err = new Error("Item not found in library");
    err.status = 404;
    throw err;
  }

  const current = await cloudinary.api.resource(publicId, { context: true });
  const ctx = { ...(current.context?.custom || {}) };

  if (typeof title === "string") ctx.name = title.trim();
  if (typeof description === "string") ctx.description = description.trim();

  if (file?.buffer) {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      context: ctx,
      tags: [section, "menu", ctx.external_source || "custom"].filter(Boolean),
    });
  } else {
    await cloudinary.api.update(publicId, { context: ctx });
  }

  const updated = await cloudinary.api.resource(publicId, { context: true });
  return mapResource(updated, section);
}

export async function deleteLibraryItem(section, externalId) {
  const prefixes = PREFIXES[section] || ["item"];
  for (const prefix of prefixes) {
    const publicId = publicIdFor(section, externalId, prefix);
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") return true;
  }
  return true;
}

export async function importRestaurantFromMealdb(mealId) {
  const meal = await getMealById(mealId);
  if (!meal?.image) {
    const err = new Error("Meal not found or has no image");
    err.status = 404;
    throw err;
  }

  const isFfm = meal.source === "freefoodmenus" || String(meal.id).startsWith("ffm-");
  const prefix = isFfm ? "ffm" : "mealdb";
  const publicId = publicIdFor("restaurant", meal.id, prefix);
  const description = isFfm
    ? (meal.description || "").slice(0, 220)
    : shortDescription(meal);

  const upload = await cloudinary.uploader.upload(meal.image, {
    public_id: publicId,
    overwrite: true,
    tags: ["restaurant", "menu", meal.source || prefix, meal.category, meal.area].filter(
      Boolean
    ),
    context: {
      external_id: meal.id,
      mealdb_id: isFfm ? "" : meal.id,
      external_source: meal.source || "themealdb",
      name: meal.name,
      category: meal.category || "",
      area: meal.area || "",
      description,
      section: "restaurant",
    },
  });

  return mapResource(
    {
      ...upload,
      context: {
        custom: {
          external_id: meal.id,
          mealdb_id: isFfm ? "" : meal.id,
          external_source: meal.source || "themealdb",
          name: meal.name,
          category: meal.category || "",
          area: meal.area || "",
          description,
        },
      },
    },
    "restaurant"
  );
}

export async function importCafeFromCoffeeApi(coffeeId) {
  const drink = await getCoffeeById(coffeeId);
  if (!drink?.image) {
    const err = new Error("Coffee drink not found or has no image");
    err.status = 404;
    throw err;
  }

  const publicId = publicIdFor("cafe", drink.id, "drink");
  const description = (drink.description || "").slice(0, 220);

  const upload = await cloudinary.uploader.upload(drink.image, {
    public_id: publicId,
    overwrite: true,
    tags: ["cafe", "menu", drink.source, drink.type].filter(Boolean),
    context: {
      external_id: drink.id,
      external_source: drink.source,
      name: drink.title,
      category: drink.type || drink.category || "cafe",
      description,
      section: "cafe",
    },
  });

  return mapResource(
    {
      ...upload,
      context: {
        custom: {
          external_id: drink.id,
          external_source: drink.source,
          name: drink.title,
          category: drink.type || drink.category || "cafe",
          description,
        },
      },
    },
    "cafe"
  );
}

/** Import many MealDB ids sequentially (safer for rate limits). */
export async function importManyMeals(ids) {
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  const results = { imported: [], failed: [] };

  for (const id of unique) {
    try {
      const item = await importRestaurantFromMealdb(id);
      results.imported.push(toMenuItem(item));
    } catch (err) {
      results.failed.push({ id, error: err.message || "import failed" });
    }
  }

  return {
    total: unique.length,
    success: results.imported.length,
    failed: results.failed.length,
    items: results.imported,
    errors: results.failed,
  };
}

export async function importManyCoffees(ids) {
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  const results = { imported: [], failed: [] };

  for (const id of unique) {
    try {
      const item = await importCafeFromCoffeeApi(id);
      results.imported.push(toMenuItem(item));
    } catch (err) {
      results.failed.push({ id, error: err.message || "import failed" });
    }
  }

  return {
    total: unique.length,
    success: results.imported.length,
    failed: results.failed.length,
    items: results.imported,
    errors: results.failed,
  };
}

export async function listImportedMeals() {
  return listLibrary("restaurant");
}

export async function getImportedMeal(mealdbId) {
  return getLibraryItem("restaurant", mealdbId);
}

export async function importMeal(mealdbId) {
  return importRestaurantFromMealdb(mealdbId);
}

export async function deleteImportedMeal(mealdbId) {
  return deleteLibraryItem("restaurant", mealdbId);
}
