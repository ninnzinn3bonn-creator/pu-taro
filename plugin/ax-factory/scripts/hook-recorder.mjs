import {
  appendFile,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let input;
try {
  input = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
} catch {
  process.exit(0);
}

const eventName = String(input.hook_event_name || "Unknown");
const sessionId = String(input.session_id || `session-${Date.now()}`);
const cwd = String(input.cwd || "");
const stableDataDir = resolve(
  process.env.AX_FACTORY_STABLE_DATA ||
    join(homedir(), ".ax-factory", "plugin-data")
);
const pluginDataDir = resolve(process.env.PLUGIN_DATA || stableDataDir);
const statePath = join(stableDataDir, "state.json");
const pluginStatePath = join(pluginDataDir, "state.json");
const eventsPath = join(stableDataDir, "events.jsonl");
const maxEventLogBytes = 5 * 1024 * 1024;

const eventState = {
  SessionStart: ["idle", "Codexセッションを接続", 0],
  UserPromptSubmit: ["running", "ユーザー指示を受けて作業開始", 10],
  PermissionRequest: ["waiting_approval", "権限または承認を待機", 70],
  PostToolUse: ["running", "ツール実行結果を処理", 60],
  Stop: ["completed", "ターンを完了", 100]
};

const [status, currentAction, progress] =
  eventState[eventName] || ["running", `Codexイベント: ${eventName}`, 40];
const now = new Date().toISOString();

async function readState() {
  try {
    return JSON.parse(await readFile(statePath, "utf8"));
  } catch {
    return { updatedAt: now, source: "codex-hooks", sessions: [] };
  }
}

async function writeAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

async function appendEvent(value) {
  await mkdir(stableDataDir, { recursive: true });
  try {
    const info = await stat(eventsPath);
    if (info.size >= maxEventLogBytes) {
      const rotatedPath = join(stableDataDir, "events.1.jsonl");
      await rm(rotatedPath, { force: true });
      await rename(eventsPath, rotatedPath);
    }
  } catch {
    // The log does not exist yet.
  }
  await appendFile(eventsPath, `${JSON.stringify(value)}\n`, "utf8");
}

try {
  const state = await readState();
  const existing = state.sessions.find((session) => session.id === sessionId);
  const session = {
    id: sessionId,
    status,
    title: existing?.title || (cwd ? basename(cwd) : "Codex session"),
    workspace: cwd,
    lastActivity: now,
    currentAction:
      eventName === "PostToolUse" && input.tool_name
        ? `${input.tool_name} を実行`
        : currentAction,
    progress:
      eventName === "PostToolUse"
        ? Math.max(Number(existing?.progress || 0), progress)
        : progress,
    changedFiles: Array.isArray(existing?.changedFiles) ? existing.changedFiles : []
  };

  const sessions = [
    ...state.sessions.filter((item) => item.id !== sessionId),
    session
  ]
    .sort((a, b) => String(b.lastActivity).localeCompare(String(a.lastActivity)))
    .slice(0, 100);

  const nextState = {
    updatedAt: now,
    source: "codex-hooks",
    sessions
  };

  await writeAtomic(statePath, nextState);
  if (pluginStatePath !== statePath) {
    await writeAtomic(pluginStatePath, nextState);
  }
  await appendEvent({
    timestamp: now,
    event: eventName,
    sessionId,
    turnId: input.turn_id || null,
    toolName: input.tool_name || null,
    cwd
  });

  if (process.env.AX_FACTORY_STATE_MIRROR) {
    await writeAtomic(resolve(process.env.AX_FACTORY_STATE_MIRROR), nextState);
  }
} catch (error) {
  process.stderr.write(`AX Factory hook recorder: ${error.message}\n`);
}
