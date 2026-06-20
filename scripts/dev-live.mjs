import { stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { publishRuntimeState } from "./lib/runtime-state.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runNode(script, args = []) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [resolve(script), ...args], {
      cwd: resolve("."),
      env: process.env,
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} exited with code ${code ?? "unknown"}`));
    });
  });
}

const sourceRoot = argument("--source");
const stateSource = resolve(
  process.env.AX_FACTORY_STATE_SOURCE ||
    join(homedir(), ".ax-factory", "plugin-data", "state.json")
);
const stateTarget = resolve("public/data/state.json");
const sourceArgs = sourceRoot ? ["--source", sourceRoot] : [];

let sourceSyncing = false;
let stateSyncing = false;
let runtimeWasMissing = false;

async function syncSource() {
  if (sourceSyncing) return;
  sourceSyncing = true;
  try {
    await runNode("scripts/sync-auto-house.mjs", sourceArgs);
  } catch (error) {
    console.error(`Auto House sync failed: ${error.message}`);
  } finally {
    sourceSyncing = false;
  }
}

async function syncRuntimeState() {
  if (stateSyncing) return;
  stateSyncing = true;
  try {
    await stat(stateSource);
    await publishRuntimeState(stateSource, stateTarget);
    if (runtimeWasMissing) {
      console.log(`Codex runtime connected: ${stateSource}`);
    }
    runtimeWasMissing = false;
  } catch (error) {
    if (error.code === "ENOENT") {
      if (!runtimeWasMissing) {
        console.log(
          `Codex runtime is not connected yet. Waiting for ${stateSource}`
        );
      }
      runtimeWasMissing = true;
    } else {
      console.error(`Runtime state sync failed: ${error.message}`);
    }
  } finally {
    stateSyncing = false;
  }
}

await syncSource();
await syncRuntimeState();

const sourceTimer = setInterval(syncSource, 60_000);
const stateTimer = setInterval(syncRuntimeState, 5_000);
const vite = spawn(
  process.execPath,
  [resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", "4173"],
  {
    cwd: resolve("."),
    env: process.env,
    stdio: "inherit"
  }
);

function shutdown(signal) {
  clearInterval(sourceTimer);
  clearInterval(stateTimer);
  if (!vite.killed) vite.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
vite.on("error", (error) => {
  console.error(`Vite failed to start: ${error.message}`);
  process.exitCode = 1;
});
vite.on("exit", (code) => {
  clearInterval(sourceTimer);
  clearInterval(stateTimer);
  process.exitCode = code ?? 0;
});
