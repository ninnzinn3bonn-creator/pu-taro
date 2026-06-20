import { readFile } from "node:fs/promises";
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

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `AX Factory data OK: ${areas.size} areas, ${tasks.size} tasks, ${sessions.size} sessions, ${runs.size} runs`
  );
}
