import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const distDir = path.join(root, "dist");
const outDir = path.join(root, "android", "app", "src", "main", "assets", "www");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
      continue;
    }
    if (entry.isSymbolicLink()) continue;
    await fs.copyFile(from, to);
  }
}

if (!(await exists(distDir))) {
  console.error("No existe ./dist. Corre `npm run build:android` primero.");
  process.exit(1);
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });
await copyDir(distDir, outDir);
console.log(`OK: assets Android sincronizados en ${path.relative(root, outDir)}`);
