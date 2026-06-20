import { accessSync, constants } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const bundledNode =
  process.platform === "win32"
    ? join(
        homedir(),
        ".cache",
        "codex-runtimes",
        "codex-primary-runtime",
        "dependencies",
        "node",
        "bin",
        "node.exe"
      )
    : "";

function isExecutable(path) {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

const nodeExecutable =
  process.env.AX_FACTORY_NODE ||
  (bundledNode && isExecutable(bundledNode) ? bundledNode : process.execPath);

function run(script, args) {
  const result = spawnSync(nodeExecutable, [resolve(script), ...args], {
    stdio: "inherit",
    env: process.env
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (nodeExecutable !== process.execPath) {
  console.log(`Using compatible Node runtime: ${nodeExecutable}`);
}

run("node_modules/typescript/bin/tsc", ["-b"]);
run("node_modules/vite/bin/vite.js", ["build"]);

if (process.env.AX_FACTORY_INCLUDE_LOCAL_SNAPSHOT !== "1") {
  run("scripts/sanitize-dist.mjs", []);
}
