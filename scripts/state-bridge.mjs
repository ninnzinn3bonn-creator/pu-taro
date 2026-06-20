import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { publishRuntimeState } from "./lib/runtime-state.mjs";

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const source =
  readArg("--source") ||
  process.env.AX_FACTORY_STATE_SOURCE ||
  join(homedir(), ".ax-factory", "plugin-data", "state.json");
const target = resolve(
  readArg("--target") ||
    process.env.AX_FACTORY_STATE_TARGET ||
    "public/data/state.json"
);

const absoluteSource = resolve(source);
let lastSignature = "";

async function sync(force = false) {
  const details = await stat(absoluteSource);
  const signature = `${details.size}:${details.mtimeMs}`;
  if (!force && signature === lastSignature) return;
  await publishRuntimeState(absoluteSource, target);
  lastSignature = signature;
  console.log(`Synced ${absoluteSource} -> ${target} at ${new Date().toISOString()}`);
}

await sync(true);
setInterval(async () => {
  try {
    await sync();
  } catch (error) {
    console.error(`State sync failed: ${error.message}`);
  }
}, 2_000);
