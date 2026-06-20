import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildSourceSnapshot } from "./lib/auto-house-source.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const workspaceRoot = resolve(".");
const outputPath = resolve(
  argument("--output") || "public/data/source_snapshot.local.json"
);
const snapshot = await buildSourceSnapshot({
  workspaceRoot,
  sourceRoot: argument("--source"),
  outputPath
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(
  `Read-only sync complete: ${snapshot.businessAreas.length} areas, ${snapshot.tasks.length} open tasks, ${snapshot.health.warnings.length} warnings`
);
console.log(`Source: ${snapshot.source.root}`);
console.log(`Output: ${outputPath}`);
