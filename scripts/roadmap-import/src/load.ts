import fs from "node:fs/promises";
import path from "node:path";
import { seedSchema } from "./schema";

export const DEFAULT_SEED = path.resolve(
  "scripts/roadmap-import/data/PDI_OS_Data_Engineering_Seed_V1.2.json",
);
export async function loadSeed(file = DEFAULT_SEED) {
  const raw = await fs.readFile(file, "utf8");
  return seedSchema.parse(JSON.parse(raw));
}
