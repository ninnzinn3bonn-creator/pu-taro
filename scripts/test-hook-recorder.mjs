import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const temp = await mkdtemp(join(tmpdir(), "ax-factory-hook-"));
const recorder = resolve("plugin/ax-factory/scripts/hook-recorder.mjs");

function runHook(payload) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [recorder], {
      env: { ...process.env, PLUGIN_DATA: temp },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(stderr || `hook exited ${code}`));
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

try {
  const base = {
    session_id: "session-test",
    cwd: resolve("."),
    model: "test-model",
    permission_mode: "default"
  };

  await runHook({ ...base, hook_event_name: "SessionStart", source: "startup" });
  await runHook({ ...base, hook_event_name: "UserPromptSubmit", turn_id: "turn-1" });
  await runHook({
    ...base,
    hook_event_name: "PermissionRequest",
    turn_id: "turn-1",
    tool_name: "apply_patch"
  });
  await runHook({ ...base, hook_event_name: "Stop", turn_id: "turn-1" });

  const state = JSON.parse(await readFile(join(temp, "state.json"), "utf8"));
  const events = (await readFile(join(temp, "events.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map(JSON.parse);

  if (state.sessions.length !== 1) throw new Error("Expected one session");
  if (state.sessions[0].status !== "completed") throw new Error("Expected completed status");
  if (events.length !== 4) throw new Error("Expected four recorded events");
  if (events.some((event) => "prompt" in event)) throw new Error("Prompt content must not be stored");

  console.log("Hook recorder OK: lifecycle state and metadata-only event log verified");
} finally {
  await rm(temp, { recursive: true, force: true });
}
