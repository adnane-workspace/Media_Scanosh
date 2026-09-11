/**
 * Batch generate Flux.2 Klein photos → Cloudinary library.
 *
 * Usage:
 *   node src/scripts/generateFluxLibrary.js
 *   node src/scripts/generateFluxLibrary.js --section=cafe --limit=10
 *   node src/scripts/generateFluxLibrary.js --section=restaurant --limit=20 --model=klein-4b
 *   node src/scripts/generateFluxLibrary.js --moroccan
 *   node src/scripts/generateFluxLibrary.js --ids=flux-cafe-espresso,flux-restaurant-burger-classique
 *
 * Requires: NVIDIA_API_KEY (or BFL_API_KEY) + Cloudinary credentials in .env
 */
import "dotenv/config";
import {
  listFluxCatalog,
  fluxCatalogStats,
} from "../data/fluxCatalog.js";
import { generateAndImportMany } from "../services/fluxLibrary.js";

function parseArgs(argv) {
  const opts = {
    section: "all",
    limit: 0,
    model: "klein-4b",
    ids: null,
    delayMs: 800,
    moroccan: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--section=")) opts.section = arg.slice(10);
    else if (arg.startsWith("--limit=")) opts.limit = Number(arg.slice(8));
    else if (arg.startsWith("--model=")) opts.model = arg.slice(8);
    else if (arg.startsWith("--ids=")) opts.ids = arg.slice(6).split(",").map((s) => s.trim());
    else if (arg.startsWith("--delay=")) opts.delayMs = Number(arg.slice(8));
    else if (arg === "--moroccan") opts.moroccan = true;
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const stats = fluxCatalogStats();
  console.log("Flux catalog:", stats);
  console.log("Options:", opts);

  if (!process.env.NVIDIA_API_KEY && !process.env.BFL_API_KEY) {
    console.error(
      "Missing NVIDIA_API_KEY in .env — get one at https://build.nvidia.com"
    );
    process.exit(1);
  }

  let ids = opts.ids;
  if (!ids?.length) {
    let items = listFluxCatalog({
      section: opts.section === "all" ? undefined : opts.section,
      limit: opts.limit || undefined,
    });
    if (opts.moroccan) {
      items = listFluxCatalog({
        section: opts.section === "all" ? undefined : opts.section,
      }).filter((i) => i.id.includes("-ma-"));
      if (opts.limit > 0) items = items.slice(0, opts.limit);
    }
    ids = items.map((i) => i.id);
  }

  if (!ids.length) {
    console.error("No items to generate");
    process.exit(1);
  }

  console.log(`Generating ${ids.length} image(s) with Flux.2 ${opts.model} (NVIDIA)…`);
  console.log("Running sequentially to respect rate limits.\n");

  const result = await generateAndImportMany(ids, {
    model: opts.model,
    delayMs: opts.delayMs,
  });

  console.log("\nDone:", {
    total: result.total,
    success: result.success,
    failed: result.failed,
  });
  if (result.errors.length) {
    console.log("Errors:", result.errors.slice(0, 10));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
