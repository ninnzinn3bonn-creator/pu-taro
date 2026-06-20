import { copyFile, mkdir, stat, watch } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const source = readArg("--source") || process.env.AX_FACTORY_STATE_SOURCE;
const target = resolve(
  readArg("--target") ||
    process.env.AX_FACTORY_STATE_TARGET ||
    "public/data/state.json"
);

if (!source) {
  console.error(
    "Usage: npm run bridge -- --source <PLUGIN_DATA/state.json> [--target public/data/state.json]"
  );
  process.exit(1);
}

const absoluteSource = resolve(source);

async function sync() {
  await stat(absoluteSource);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(absoluteSource, target);
  console.log(`Synced ${absoluteSource} -> ${target} at ${new Date().toISOString()}`);
}

await sync();
const watcher = watch(absoluteSource);
for await (const event of watcher) {
  if (event.eventType === "change" || event.eventType === "rename") {
    try {
      await sync();
    } catch (error) {
      console.error(`State sync failed: ${error.message}`);
    }
  }
}
