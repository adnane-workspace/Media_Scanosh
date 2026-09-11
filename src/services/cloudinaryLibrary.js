import cloudinary from "../cloudinary.js";

/** Cloudinary folders used by this media API */
export const SECTIONS = {
  restaurant: "media/restaurant",
  cafe: "media/cafe",
};

/** Prefixes kept so older Cloudinary assets still resolve for edit/delete */
const PREFIXES = {
  restaurant: ["mealdb", "ffm", "flux", "item"],
  cafe: ["drink", "coffee", "flux", "item"],
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

/** Shape for the menu app: photo + title + description only */
export function toMenuItem(item) {
  return {
    id: item.id,
    section: item.section,
    title: item.name || item.title || "",
    description: item.description || "",
    image: item.image,
    createdAt: item.createdAt || null,
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
    createdAt: resource.created_at || null,
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
    const resources = [];
    let nextCursor;
    do {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: `${folderFor(section)}/`,
        max_results: 500,
        context: true,
        next_cursor: nextCursor,
      });
      resources.push(...(result.resources || []));
      nextCursor = result.next_cursor;
    } while (nextCursor);
    return resources.map((r) => mapResource(r, section));
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

/** Import a remote / data-URI image into Cloudinary library (Flux). */
export async function importFromImageUrl(
  section,
  { id, title, description, imageUrl, source = "flux" }
) {
  const name = (title || "").trim();
  if (!name) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  if (!imageUrl) {
    const err = new Error("imageUrl is required");
    err.status = 400;
    throw err;
  }

  const externalId = id || `flux-${Date.now()}`;
  const prefix = source === "flux" ? "flux" : "item";
  const publicId = publicIdFor(section, externalId, prefix);
  const desc = (description || "").trim().slice(0, 500);

  const upload = await cloudinary.uploader.upload(imageUrl, {
    public_id: publicId,
    overwrite: true,
    tags: [section, "menu", source, "ai"].filter(Boolean),
    context: {
      external_id: externalId,
      external_source: source,
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
          external_id: externalId,
          external_source: source,
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
