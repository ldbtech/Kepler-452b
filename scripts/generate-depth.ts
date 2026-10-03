// Runs monocular depth estimation (locally, via Transformers.js/ONNX — no
// API key, no network calls beyond the one-time model download) on each
// vehicle's rotation-angle photos, and writes a depth map alongside each.
// Run after fetch-copart.ts: npm run gen:depth
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "@huggingface/transformers";
import type { Vehicle } from "../lib/vehicles";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data", "vehicles.json");

async function main() {
  const raw = await readFile(DATA_FILE, "utf-8");
  const vehicles: Vehicle[] = JSON.parse(raw);

  console.log("Loading depth-estimation model (one-time download on first run)...");
  const estimator = await pipeline(
    "depth-estimation",
    "onnx-community/depth-anything-v2-small",
  );

  for (const vehicle of vehicles) {
    for (const label of vehicle.rotationOrder) {
      const img = vehicle.images.find((i) => i.label === label);
      if (!img) continue;

      const srcPath = path.join(ROOT, "public", img.file);
      const depthFile = img.file.replace(/(\.\w+)$/, "_depth.png");
      const destPath = path.join(ROOT, "public", depthFile);

      console.log(`Depth: lot ${vehicle.lotNumber} ${label}`);
      const out = (await estimator(srcPath)) as {
        depth: { save: (p: string) => Promise<void> };
      };
      await out.depth.save(destPath);

      (img as Vehicle["images"][number] & { depthFile?: string }).depthFile = depthFile;
    }
  }

  await writeFile(DATA_FILE, JSON.stringify(vehicles, null, 2));
  console.log(`Updated ${DATA_FILE} with depth map paths`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
