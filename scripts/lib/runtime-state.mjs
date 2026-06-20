import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function publishRuntimeState(source, target) {
  const absoluteSource = resolve(source);
  const absoluteTarget = resolve(target);
  const state = JSON.parse(await readFile(absoluteSource, "utf8"));
  if (typeof state.source !== "string" || !Array.isArray(state.sessions)) {
    throw new Error("Runtime state must contain source and sessions");
  }

  await mkdir(dirname(absoluteTarget), { recursive: true });
  const temporary = `${absoluteTarget}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rm(absoluteTarget, { force: true });
  await rename(temporary, absoluteTarget);
  return state;
}
