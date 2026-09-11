/** Shared Flux catalog helpers — preserve ID prefixes for Cloudinary regenerate. */

export const STYLE =
  "professional food photography, square 1:1 composition, soft natural lighting, shallow depth of field, clean background, appetizing, high detail, menu catalog style, no text, no watermark, no logo";

export const MOROCCAN_STYLE =
  "professional food photography, square 1:1 composition, soft natural lighting, shallow depth of field, clean beige or white background, appetizing, high detail, authentic moroccan cuisine, menu catalog style, no text, no watermark, no logo";

/** Même verre pour tous les jus (highball cylindrique, fond blanc, menthe) */
export const JUICE_GLASS =
  "tall cylindrical highball glass, straight sides, flat base, mint leaf on top, pure white background, studio product photo, centered";

/** Glaces & sorbets — coupe / cornet menu-ready */
export const ICE_CUP =
  "served in a clear glass cup or waffle cone, soft natural light, clean white background, appetizing, menu catalog style, no text, no watermark";

export function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function cafeItem(title, description, subject, idSlug) {
  return {
    id: `flux-cafe-${idSlug || slugify(title)}`,
    section: "cafe",
    title,
    description,
    prompt: `${subject}. ${STYLE}`,
  };
}

export function restaurantItem(title, description, subject, idSlug) {
  return {
    id: `flux-restaurant-${idSlug || slugify(title)}`,
    section: "restaurant",
    title,
    description,
    prompt: `${subject}. ${STYLE}`,
  };
}

export function juiceItem(title, description, liquid, idSlug) {
  return {
    id: `flux-cafe-${idSlug || slugify(title)}`,
    section: "cafe",
    title,
    description,
    prompt: `${liquid} in a ${JUICE_GLASS}`,
  };
}

export function glaceItem(title, description, subject, idSlug) {
  return {
    id: `flux-cafe-${idSlug || slugify(title)}`,
    section: "cafe",
    title,
    description,
    prompt: `${subject}, ${ICE_CUP}`,
  };
}

export function moroccanRestaurantItem(title, description, subject, idSlug) {
  return {
    id: `flux-restaurant-ma-${idSlug || slugify(title)}`,
    section: "restaurant",
    title,
    description,
    prompt: `${subject}. ${MOROCCAN_STYLE}`,
  };
}

export function moroccanCafeItem(title, description, subject, idSlug) {
  return {
    id: `flux-cafe-ma-${idSlug || slugify(title)}`,
    section: "cafe",
    title,
    description,
    prompt: `${subject}. ${MOROCCAN_STYLE}`,
  };
}
