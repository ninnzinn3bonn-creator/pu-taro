import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  assertOutputOutsideSource,
  buildSourceSnapshot
} from "./lib/auto-house-source.mjs";

const fixture = await mkdtemp(join(tmpdir(), "ax-source-fixture-"));
const output = join(await mkdtemp(join(tmpdir(), "ax-source-output-")), "snapshot.json");

async function put(path, content) {
  const target = join(fixture, path);
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, content, "utf8");
}

try {
  await put("AGENTS.md", "# Fixture");
  await mkdir(join(fixture, "company_agent"), { recursive: true });
  await put(
    "docs/21_project_progress_snapshot_2026-06-16.md",
    Array.from({ length: 11 }, (_, index) => {
      const id = `P${index + 1}`;
      return `| ${id} | Fixture ${id} | ${50 + index}% | Green | Safe next action |`;
    }).join("\n")
  );
  await put(
    "tasks/self_tasks.md",
    [
      "- [ ] 予約管理アプリのCSV読込を調査する。",
      "- [ ] 鍵番号 1234 を宿泊者へ送る。",
      "- [ ] Stack-chanを ws://192.168.0.10:8790 へ接続する。",
      "- [ ] 担当へ secret@example.com と 090-1234-5678 を共有する。"
    ].join("\n")
  );
  await put(
    "company_agent/finance/operational_metrics_2026.md",
    "| 合計 | 15.9% | 32 | 58 | 4.38 | 1.81 | 33 | 1 | 3% |"
  );
  await put(
    "company_agent/finance/sources/yururi_monthly_payments_gid1654969878.csv",
    [
      ",年間合計",
      '売上金額①,"3,612,540"',
      'Booking.com 手数料,"505,153"',
      '経費合計,"1,968,569"',
      '差し引き合計,"736,840"'
    ].join("\n")
  );
  await put(
    "company_agent/finance/operator_time_log_actual.csv",
    "date,minutes\n2026-06-01,30\n2026-06-02,45"
  );
  await put(
    "company_agent/rules/inventory_actual.csv",
    "check_date,item,current_qty,unit,status\n2026-06-01,温泉チケット,20,sheets,ok"
  );
  await put(
    "company_agent/pricing/pricing_review_schedule.md",
    "| 2026-07-01 | 1か月前レビュー | 予約速度 | 基本判断 |"
  );
  await put(
    "private/raw_dm.txt",
    "Guest Name: Secret Person\nEmail: secret@example.com\nKey code: 9999"
  );

  let refused = false;
  try {
    assertOutputOutsideSource(fixture, join(fixture, "snapshot.json"));
  } catch {
    refused = true;
  }
  if (!refused) throw new Error("Output inside source root must be refused");

  const snapshot = await buildSourceSnapshot({
    workspaceRoot: resolve("."),
    sourceRoot: fixture,
    outputPath: output,
    now: new Date("2026-06-21T00:00:00+09:00")
  });
  const serialized = JSON.stringify(snapshot);
  if (snapshot.businessAreas.length !== 11) throw new Error("Expected 11 projects");
  if (snapshot.metrics.finance.revenue !== 3612540) throw new Error("Finance parse failed");
  if (snapshot.metrics.timeLog.minutes !== 75) throw new Error("Time log parse failed");
  if (snapshot.tasks.some((task) => task.title.includes("1234"))) {
    throw new Error("Sensitive task was imported");
  }
  for (const forbidden of ["Secret Person", "secret@example.com", "9999"]) {
    if (serialized.includes(forbidden)) throw new Error(`Leaked excluded content: ${forbidden}`);
  }
  if (!serialized.includes("[URL omitted]")) throw new Error("URL redaction failed");
  if (!serialized.includes("[email omitted]")) throw new Error("Email redaction failed");
  if (!serialized.includes("[phone omitted]")) throw new Error("Phone redaction failed");

  await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  JSON.parse(await readFile(output, "utf8"));
  console.log("Source importer OK: read-only boundary, parsing, redaction, and leakage checks passed");
} finally {
  await rm(fixture, { recursive: true, force: true });
  await rm(resolve(output, ".."), { recursive: true, force: true });
}
