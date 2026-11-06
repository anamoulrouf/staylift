#!/usr/bin/env node
/**
 * Copy PGLite's runtime assets into the nitro vercel-preset build output.
 *
 * Nitro externalizes `@electric-sql/pglite` into
 * `.vercel/output/functions/__server.func/_libs/electric-sql__pglite.mjs` but
 * does NOT copy the emscripten assets that module reads from its own directory
 * (`pglite.data`, `pglite.wasm`, `initdb.wasm`). Without them any request that
 * reaches the embedded-PGLite path — i.e. every local preview, where
 * DATABASE_URL is unset — crashes the server on first load. Deployed apps use
 * Neon (`DATABASE_URL` set) and never import PGLite, so this is a local-QA
 * bridge, not a deploy fix.
 *
 * Runs as part of `npm run build` (after `vite build`). No-ops with a clear
 * note when the expected output directory is absent, so `vite build --mode
 * development` or a future preset change can't break the build.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const libsDir = join(root, ".vercel", "output", "functions", "__server.func", "_libs");
const pgliteDist = join(root, "node_modules", "@electric-sql", "pglite", "dist");

if (!existsSync(libsDir)) {
  console.log("[pglite-assets] no vercel output dir — skipping");
  process.exit(0);
}

if (!existsSync(pgliteDist)) {
  console.log("[pglite-assets] @electric-sql/pglite not installed — skipping");
  process.exit(0);
}

const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];
for (const file of files) {
  const from = join(pgliteDist, file);
  if (existsSync(from)) copyFileSync(from, join(libsDir, file));
}
console.log(`[pglite-assets] copied ${files.join(", ")} into _libs/`);
