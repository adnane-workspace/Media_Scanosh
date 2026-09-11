/** Shared Flux prompt style for menu product photos */
export const MENU_PHOTO_STYLE =
  "professional food photography, square 1:1 composition, soft natural lighting, shallow depth of field, clean background, appetizing, high detail, menu catalog style, no text, no watermark, no logo";

/** Ensure freeform prompts get the menu style suffix */
export function withMenuStyle(prompt) {
  const text = String(prompt || "").trim();
  if (!text) return "";
  if (text.includes("professional food photography")) return text;
  return `${text.replace(/\.+$/, "")}. ${MENU_PHOTO_STYLE}`;
}
