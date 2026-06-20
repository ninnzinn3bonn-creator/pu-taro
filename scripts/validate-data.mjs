import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("public/data");
const files = [
  "business_areas.json",
  "tasks.json",
  "agents.json",
  "codex_sessions.json",
  "runs.json",
  "approvals.json",
  "state.json"
];

const parsed = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file,
      JSON.parse(await readFile(resolve(root, file), "utf8"))
    ])
  )
);

const areas = new Set(parsed["business_areas.json"].map((item) => item.id));
const tasks = new Set(parsed["tasks.json"].map((item) => item.id));
const agents = new Set(parsed["agents.json"].map((item) => item.id));
const sessions = new Set(parsed["codex_sessions.json"].map((item) => item.id));
const runs = new Set(parsed["runs.json"].map((item) => item.id));

const errors = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

for (const task of parsed["tasks.json"]) {
  if (!areas.has(task.businessAreaId)) errors.push(`Task ${task.id}: unknown businessAreaId`);
  if (!agents.has(task.assigneeId)) errors.push(`Task ${task.id}: unknown assigneeId`);
}

for (const session of parsed["codex_sessions.json"]) {
  if (!areas.has(session.relatedBusinessAreaId)) errors.push(`Session ${session.id}: unknown area`);
  if (!tasks.has(session.relatedTaskId)) errors.push(`Session ${session.id}: unknown task`);
  if (!agents.has(session.agentId)) errors.push(`Session ${session.id}: unknown agent`);
}

for (const run of parsed["runs.json"]) {
  if (!sessions.has(run.sessionId)) errors.push(`Run ${run.id}: unknown session`);
  if (!tasks.has(run.taskId)) errors.push(`Run ${run.id}: unknown task`);
}

for (const approval of parsed["approvals.json"]) {
  if (!areas.has(approval.businessAreaId)) errors.push(`Approval ${approval.id}: unknown area`);
  if (!tasks.has(approval.taskId)) errors.push(`Approval ${approval.id}: unknown task`);
  if (!runs.has(approval.runId)) errors.push(`Approval ${approval.id}: unknown run`);
}

for (const file of [
  "source_snapshot.example.json",
  "source_snapshot.local.json"
]) {
  const path = resolve(root, file);
  if (!(await exists(path))) continue;
  const snapshot = JSON.parse(await readFile(path, "utf8"));
  if (snapshot.schemaVersion !== 1) errors.push(`${file}: unsupported schemaVersion`);
  if (snapshot.mode !== "read-only") errors.push(`${file}: mode must be read-only`);
  if (!Array.isArray(snapshot.businessAreas)) {
    errors.push(`${file}: businessAreas must be an array`);
    continue;
  }
  if (snapshot.live && !snapshot.businessAreas.length) {
    errors.push(`${file}: live snapshot businessAreas is empty`);
  }
  const sourceAreas = new Set(snapshot.businessAreas.map((item) => item.id));
  for (const task of snapshot.tasks ?? []) {
    if (!sourceAreas.has(task.businessAreaId)) {
      errors.push(`${file}: task ${task.id} has unknown businessAreaId`);
    }
    if (
      [
        /(?:https?:\/\/|ws:\/\/)/i,
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
        /APIキー|パスワード|暗証番号|鍵番号|予約番号|宿泊者名|メールアドレス|電話番号/
      ].some((pattern) => pattern.test(task.title))
    ) {
      errors.push(`${file}: task ${task.id} contains excluded content`);
    }
  }
  if (!Array.isArray(snapshot.safety?.excluded) || !snapshot.safety.excluded.length) {
    errors.push(`${file}: safety exclusions are required`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `AX Factory data OK: ${areas.size} areas, ${tasks.size} tasks, ${sessions.size} sessions, ${runs.size} runs`
  );
}
