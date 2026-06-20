import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_META = {
  P1: {
    id: "company-agent",
    shortName: "COMPANY AGENT",
    icon: "◇",
    color: "#43e8b8",
    accent: "#163f3b",
    description: "経営レビュー、意思決定、データ不足確認を行うカンパニーエージェント基盤。",
    files: ["AGENTS.md", "company_agent/README.md", "company_agent/reports"],
    prompts: ["monthly_review_prompt.md", "data_gap_interviewer.md"],
    prohibitedActions: ["未確認データを確定値として扱わない", "人間の経営判断を自動確定しない"],
    line: ["データ収集", "経営分析", "提案生成", "人間判断", "意思決定ログ"]
  },
  P2: {
    id: "profit-cockpit",
    shortName: "PROFIT COCKPIT",
    icon: "◉",
    color: "#67d8ff",
    accent: "#17364a",
    description: "家主側と運営受託側の利益、実働時間、在庫を統合する経営計器盤。",
    files: ["company_agent/finance", "outputs/profit_cockpit_v0"],
    prompts: ["monthly_review_prompt.md"],
    prohibitedActions: ["元の財務CSVを上書きしない", "未照合値を確定値として報告しない"],
    line: ["売上取得", "経費照合", "利益計算", "差異確認", "月次報告"]
  },
  P3: {
    id: "guest-support",
    shortName: "GUEST REPLY",
    icon: "✦",
    color: "#43e8b8",
    accent: "#163f3b",
    description: "ゲストDMを分類し、RAGを参照して安全な返信下書きを生成する。",
    files: ["apps/guest-reply-bot", "company_agent/rules", "company_agent/shared_knowledge"],
    prompts: ["guest_reply_draft_prompt.md"],
    prohibitedActions: ["返信を自動送信しない", "鍵・返金・予約固有情報を回答しない"],
    line: ["DM入力", "言語・危険判定", "RAG参照", "返信下書き", "人間承認"]
  },
  P4: {
    id: "reservation-ops",
    shortName: "RESERVATION OPS",
    icon: "▣",
    color: "#b69cff",
    accent: "#30274d",
    description: "予約・チェックイン・宿泊者台帳を安全な状態遷移として扱う基盤。",
    files: ["apps/reservation-checkin-core", "docs/25_reservation_checkin_product_master_plan.md"],
    prompts: ["ax-runbook"],
    prohibitedActions: ["OTA管理画面を変更しない", "個人情報をAX Factoryへ取り込まない"],
    line: ["予約取得", "正規化", "状態検証", "本人確認", "チェックイン"]
  },
  P5: {
    id: "accounting",
    shortName: "ACCOUNTING",
    icon: "●",
    color: "#f7c85c",
    accent: "#493b1b",
    description: "請求書生成、月次会計、CSV連携を人間確認付きで運用する。",
    files: ["company_agent/invoicing", "company_agent/accounting", "outputs/invoices"],
    prompts: ["invoice_agent_prompt.md"],
    prohibitedActions: ["確認なしで請求書を送信しない", "税務判断を自動化しない"],
    line: ["月次データ", "請求額計算", "PDF生成", "人間確認", "送信記録"]
  },
  P6: {
    id: "pricing",
    shortName: "PRICING LAB",
    icon: "▲",
    color: "#b69cff",
    accent: "#30274d",
    description: "需要、Genius後価格、清掃バッファ、予約速度から価格案を作る。",
    files: ["company_agent/pricing", "company_agent/decisions"],
    prompts: ["pricing_review_prompt.md"],
    prohibitedActions: ["価格を自動保存しない", "売り止めを自動変更しない"],
    line: ["予約速度", "需要・競合", "価格案", "人間承認", "結果レビュー"]
  },
  P7: {
    id: "cleaning",
    shortName: "CLEANING STATION",
    icon: "◆",
    color: "#67d8ff",
    accent: "#17364a",
    description: "清掃、直前チェック、写真確認、備品補充を品質管理として扱う。",
    files: ["company_agent/rules/pre_arrival_checklist.md", "company_agent/rules/inventory_check_sheet.md"],
    prompts: ["ax-runbook"],
    prohibitedActions: ["正式依頼を自動送信しない", "鍵情報をログへ保存しない"],
    line: ["予約確定", "清掃予定", "清掃実施", "直前チェック", "完了確認"]
  },
  P8: {
    id: "marketing",
    shortName: "MARKETING",
    icon: "✺",
    color: "#ff9f68",
    accent: "#4a2b22",
    description: "掲載内容、レビュー、価格納得感を確認し、改善候補を管理する。",
    files: ["company_agent/marketing", "reviews.csv"],
    prompts: ["ax-report"],
    prohibitedActions: ["掲載文を自動変更しない", "レビュー本文や宿泊者情報を取り込まない"],
    line: ["掲載監査", "レビュー集計", "課題抽出", "改善案", "人間判断"]
  },
  P9: {
    id: "calendar-audit",
    shortName: "CALENDAR AUDIT",
    icon: "▦",
    color: "#ff9f68",
    accent: "#4a2b22",
    description: "価格、空室、清掃バッファ、キャンセル後の売り止め残りを監査する。",
    files: ["company_agent/api_research/calendar_audit_checklist.md", "company_agent/pricing/booking_buffer_policy.md"],
    prompts: ["ax-runbook"],
    prohibitedActions: ["カレンダーを自動保存しない", "販売再開を自動実行しない"],
    line: ["画面確認", "状態分類", "バッファ監査", "解除候補", "人間承認"]
  },
  P10: {
    id: "inventory",
    shortName: "INVENTORY",
    icon: "▤",
    color: "#f7c85c",
    accent: "#493b1b",
    description: "次2予約分を基準に温泉チケット、コーヒー、浴衣、タオルを監視する。",
    files: ["company_agent/rules/inventory_actual.csv", "company_agent/rules/inventory_reorder_rules.md"],
    prompts: ["ax-progress"],
    prohibitedActions: ["高額購入を自動承認しない", "未実測数量を確定しない"],
    line: ["在庫実測", "必要数計算", "不足判定", "購入確認", "補充記録"]
  },
  P11: {
    id: "robot-concierge",
    shortName: "ROBOT CONCIERGE",
    icon: "◎",
    color: "#ff6b7d",
    accent: "#48222d",
    description: "客室内RAG、音声、Stack-chan、安全判定、管理ログを統合する。",
    files: ["apps/yururi-concierge-api", "apps/in-room-robot-rag", "company_agent/robot_rag"],
    prompts: ["robot_intents_and_permissions.md"],
    prohibitedActions: ["秘密情報を発話しない", "返金・近隣・安全判断を行わない"],
    line: ["音声入力", "STT", "RAG・安全判定", "TTS", "実機応答"]
  }
};

const SOURCE_FILES = [
  {
    id: "progress",
    path: "docs/21_project_progress_snapshot_2026-06-16.md",
    purpose: "P1〜P11の進捗と状態",
    maxAgeDays: 14
  },
  {
    id: "tasks",
    path: "tasks/self_tasks.md",
    purpose: "未完了タスク",
    maxAgeDays: 14
  },
  {
    id: "operations",
    path: "company_agent/finance/operational_metrics_2026.md",
    purpose: "稼働・泊数・平均連泊",
    maxAgeDays: 45
  },
  {
    id: "finance",
    path: "company_agent/finance/sources/yururi_monthly_payments_gid1654969878.csv",
    purpose: "月次財務集計",
    maxAgeDays: 40
  },
  {
    id: "time-log",
    path: "company_agent/finance/operator_time_log_actual.csv",
    purpose: "運営実働時間",
    maxAgeDays: 14
  },
  {
    id: "inventory",
    path: "company_agent/rules/inventory_actual.csv",
    purpose: "在庫実測",
    maxAgeDays: 30
  },
  {
    id: "pricing-review",
    path: "company_agent/pricing/pricing_review_schedule.md",
    purpose: "価格レビュー予定",
    maxAgeDays: 45
  }
];

function normalizePath(path) {
  return resolve(path).replaceAll("/", sep);
}

function isWithin(parent, child) {
  const relation = relative(normalizePath(parent), normalizePath(child));
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

export function assertOutputOutsideSource(sourceRoot, outputPath) {
  if (isWithin(sourceRoot, outputPath)) {
    throw new Error("Safety refusal: AX Factory output must not be inside the read-only source root.");
  }
}

export function resolveSourceRoot(workspaceRoot, explicitSource) {
  const candidates = [
    explicitSource,
    process.env.AUTO_HOUSE_ROOT,
    resolve(workspaceRoot, "..", "..", "auto house"),
    resolve(workspaceRoot, "..", "auto house"),
    resolve(homedir(), "auto house")
  ].filter(Boolean);

  const found = candidates.find(
    (candidate) =>
      existsSync(resolve(candidate, "AGENTS.md")) &&
      existsSync(resolve(candidate, "company_agent"))
  );
  if (!found) {
    throw new Error(
      "Auto House source was not found. Pass --source or set AUTO_HOUSE_ROOT."
    );
  }
  return normalizePath(found);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toNumber(value) {
  const normalized = String(value ?? "").replaceAll(",", "").replaceAll("%", "").trim();
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function slug(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function statusFromLabel(label) {
  if (/red/i.test(label)) return "blocked";
  if (/yellow/i.test(label)) return "attention";
  if (/green/i.test(label)) return "stable";
  return "active";
}

function lineNodes(projectId, labels, status) {
  const activeIndex =
    status === "blocked" ? 1 : status === "attention" ? 2 : status === "stable" ? 3 : 1;
  return labels.map((label, index) => ({
    id: `${PROJECT_META[projectId].id}-${index + 1}`,
    label,
    kind:
      index === 0
        ? "input"
        : index === labels.length - 1
          ? "output"
          : /承認|判断|確認/.test(label)
            ? "approval"
            : "machine",
    status:
      status === "blocked" && index === activeIndex
        ? "blocked"
        : index < activeIndex
          ? "completed"
          : index === activeIndex
            ? "running"
            : "waiting"
  }));
}

function parseProjects(markdown) {
  const projects = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(
      /^\|\s*(P\d+)\s*\|\s*([^|]+?)\s*\|\s*(\d+)%\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/
    );
    if (!match || !PROJECT_META[match[1]]) continue;
    const [, projectId, name, progressText, stateText, comment] = match;
    const meta = PROJECT_META[projectId];
    const progress = Number(progressText);
    const status = statusFromLabel(stateText);
    projects.push({
      id: meta.id,
      name: name.trim(),
      shortName: meta.shortName,
      description: meta.description,
      icon: meta.icon,
      axLevel: Math.max(1, Math.round(progress / 12.5)),
      progress,
      status,
      color: meta.color,
      accent: meta.accent,
      position: { x: projects.length % 2, y: Math.floor(projects.length / 2) },
      nextAction: comment.trim().replace(/\s+/g, " ").slice(0, 140),
      files: meta.files,
      prompts: meta.prompts,
      prohibitedActions: meta.prohibitedActions,
      line: lineNodes(projectId, meta.line, status),
      sourceProjectId: projectId,
      sourceState: stateText.trim()
    });
  }
  return projects;
}

function taskAreaId(text) {
  const mappings = [
    [
      /Stack-chan|スタックチャン|Raspberry Pi|ロボット|RAG|音声|STT|TTS|LLM|WAV|Opus|wake_armed|answered|YURURI|実機|マイク|スピーカー|照れ表情|首振り/,
      "robot-concierge"
    ],
    [/返信Bot|FAQ|宿泊ルール|翻訳/, "guest-support"],
    [/予約管理|OTA|Booking\.com|チェックイン/, "reservation-ops"],
    [/カレンダー監査|清掃バッファ|売り止め残り/, "calendar-audit"],
    [/価格|Genius|売り止め|カレンダー|予約速度|two days|小幅調整/, "pricing"],
    [/会計|請求書|経費|売上収支/, "accounting"],
    [/利益|実働時間|時給|コックピット/, "profit-cockpit"],
    [/清掃|直前チェック|写真/, "cleaning"],
    [/在庫|タオル|浴衣|温泉チケット/, "inventory"],
    [/掲載|レビュー|マーケ/, "marketing"],
    [/カンパニーエージェント|意思決定ログ|月次レビュー/, "company-agent"]
  ];
  return mappings.find(([pattern]) => pattern.test(text))?.[1] ?? "company-agent";
}

function redactTask(text) {
  return text
    .replace(/(?:https?:\/\/|ws:\/\/)\S+/g, "[URL omitted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email omitted]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP omitted]")
    .replace(/(?:\+?\d[\d\s()-]{8,}\d)/g, "[phone omitted]")
    .replace(/\b[A-F0-9]{2}(?::[A-F0-9]{2}){5}\b/gi, "[device omitted]")
    .replace(/\bCOM\d+\b/gi, "[port omitted]")
    .trim();
}

function assertSafeTaskTitles(tasks) {
  const forbiddenPatterns = [
    /(?:https?:\/\/|ws:\/\/)/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    /APIキー|パスワード|暗証番号|鍵番号|予約番号|宿泊者名|メールアドレス|電話番号/
  ];
  for (const task of tasks) {
    if (forbiddenPatterns.some((pattern) => pattern.test(task.title))) {
      throw new Error(`Safety refusal: task title contains excluded content (${task.id}).`);
    }
  }
}

function parseTasks(markdown, generatedAt) {
  const candidates = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*-\s*\[\s\]\s+(.+)/);
    if (!match) continue;
    const title = redactTask(match[1]);
    if (
      /APIキー|パスワード|暗証番号|鍵番号|予約番号|宿泊者名|メールアドレス|電話番号/.test(
        title
      )
    ) {
      continue;
    }
    const businessAreaId = taskAreaId(title);
    candidates.push({
      id: `source-task-${slug(title)}`,
      businessAreaId,
      title: title.slice(0, 120),
      description: "Auto Houseの未完了タスクから読み取り専用で同期。",
      status: "todo",
      progress: 0,
      assigneeType: "human",
      assigneeId: "agent-codex-unassigned",
      relatedFiles: ["tasks/self_tasks.md"],
      updatedAt: generatedAt
    });
  }

  const selected = [];
  const selectedIds = new Set();
  for (const areaId of Object.values(PROJECT_META).map((project) => project.id)) {
    for (const task of candidates
      .filter((candidate) => candidate.businessAreaId === areaId)
      .slice(0, 3)) {
      selected.push(task);
      selectedIds.add(task.id);
    }
  }
  for (const task of candidates) {
    if (selected.length >= 60) break;
    if (!selectedIds.has(task.id)) {
      selected.push(task);
      selectedIds.add(task.id);
    }
  }

  const areaRanks = new Map();
  const tasks = selected.map((task) => {
    const rank = areaRanks.get(task.businessAreaId) ?? 0;
    areaRanks.set(task.businessAreaId, rank + 1);
    return {
      ...task,
      priority: rank === 0 ? "high" : rank < 3 ? "medium" : "low"
    };
  });
  assertSafeTaskTitles(tasks);
  return tasks;
}

function parseOperationalMetrics(markdown) {
  const rows = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(
      /^\|\s*([^|]+?)\s*\|\s*([\d.]+)%\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([\d.]+)%\s*\|/
    );
    if (!match || match[1].includes("---")) continue;
    rows.push({
      month: match[1].trim(),
      occupancyRate: Number(match[2]),
      salesCount: Number(match[3]),
      roomNights: Number(match[4]),
      averageGuests: Number(match[5]),
      averageStay: Number(match[6]),
      reservations: Number(match[7]),
      cancellations: Number(match[8])
    });
  }
  const total = rows.find((row) => row.month === "合計");
  return {
    months: rows.filter((row) => row.month !== "合計"),
    total: total ?? null,
    caveat: "売上ではなく宿泊者情報収集由来の運用指標"
  };
}

function parseFinance(text) {
  const rows = parseCsv(text);
  const wanted = {
    "売上金額①": "revenue",
    "入金金額": "payments",
    "Booking.com 手数料": "bookingFees",
    "委託運営管理費": "managementFee",
    "経費合計": "expenses",
    "差し引き合計": "net"
  };
  const result = {};
  for (const row of rows) {
    const key = wanted[row[0]?.trim()];
    if (!key) continue;
    result[key] = toNumber(row.at(-1));
  }
  return result;
}

function parseTimeLog(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { entries: 0, minutes: 0, lastDate: null };
  const headers = rows[0];
  const dateIndex = headers.indexOf("date");
  const minutesIndex = headers.indexOf("minutes");
  const data = rows.slice(1);
  return {
    entries: data.length,
    minutes: data.reduce((sum, row) => sum + (toNumber(row[minutesIndex]) ?? 0), 0),
    lastDate: data.map((row) => row[dateIndex]).filter(Boolean).sort().at(-1) ?? null
  };
}

function parseInventory(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  return rows.slice(1).map((row) => ({
    item: row[index.item],
    currentQuantity: toNumber(row[index.current_qty]),
    unit: row[index.unit],
    status: row[index.status],
    checkedAt: row[index.check_date]
  }));
}

function parsePricingReviews(markdown, now) {
  const reviews = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+)\|\s*([^|]+)\|/);
    if (!match) continue;
    const date = new Date(`${match[1]}T00:00:00+09:00`);
    reviews.push({
      date: match[1],
      label: match[2].trim(),
      focus: match[3].trim(),
      daysFromNow: Math.ceil((date.getTime() - now.getTime()) / 86_400_000)
    });
  }
  return reviews;
}

async function fileHealth(sourceRoot, definition, now) {
  const absolute = resolve(sourceRoot, definition.path);
  try {
    const details = await stat(absolute);
    const ageDays = Math.floor((now.getTime() - details.mtime.getTime()) / 86_400_000);
    return {
      ...definition,
      exists: true,
      modifiedAt: details.mtime.toISOString(),
      ageDays,
      status: ageDays > definition.maxAgeDays ? "stale" : "fresh",
      bytes: details.size
    };
  } catch {
    return {
      ...definition,
      exists: false,
      modifiedAt: null,
      ageDays: null,
      status: "missing",
      bytes: 0
    };
  }
}

function gitInfo(sourceRoot) {
  const run = (args) =>
    spawnSync("git", ["-C", sourceRoot, ...args], {
      encoding: "utf8",
      windowsHide: true
    });
  const branch = run(["branch", "--show-current"]).stdout?.trim() || null;
  const commit = run(["rev-parse", "--short", "HEAD"]).stdout?.trim() || null;
  const status = run(["status", "--short"]).stdout?.trim().split(/\r?\n/).filter(Boolean) ?? [];
  return { branch, commit, dirtyFileCount: status.length, dirty: status.length > 0 };
}

async function readAllowed(sourceRoot, path) {
  return readFile(resolve(sourceRoot, path), "utf8");
}

export async function buildSourceSnapshot({
  workspaceRoot,
  sourceRoot: explicitSource,
  outputPath,
  now = new Date()
}) {
  const sourceRoot = resolveSourceRoot(workspaceRoot, explicitSource);
  if (outputPath) assertOutputOutsideSource(sourceRoot, outputPath);
  const generatedAt = now.toISOString();

  const [
    progressMarkdown,
    tasksMarkdown,
    operationsMarkdown,
    financeCsv,
    timeLogCsv,
    inventoryCsv,
    pricingMarkdown
  ] = await Promise.all(SOURCE_FILES.map((definition) => readAllowed(sourceRoot, definition.path)));

  const health = await Promise.all(
    SOURCE_FILES.map((definition) => fileHealth(sourceRoot, definition, now))
  );
  const warnings = health
    .filter((item) => item.status !== "fresh")
    .map((item) =>
      item.status === "missing"
        ? `${item.purpose}のソースが見つかりません。`
        : `${item.purpose}の更新から${item.ageDays}日経過しています。`
    );

  const inventory = parseInventory(inventoryCsv);
  if (!inventory.some((item) => /タオル/.test(item.item))) {
    warnings.push("タオル在庫が未確定です。");
  }

  const projects = parseProjects(progressMarkdown);
  if (projects.length < 11) {
    warnings.push(`進捗スナップショットから${projects.length}/11プロジェクトしか取得できませんでした。`);
  }

  return {
    schemaVersion: 1,
    generatedAt,
    mode: "read-only",
    live: true,
    source: {
      name: basename(sourceRoot),
      root: sourceRoot,
      ...gitInfo(sourceRoot)
    },
    businessAreas: projects,
    tasks: parseTasks(tasksMarkdown, generatedAt),
    metrics: {
      operations: parseOperationalMetrics(operationsMarkdown),
      finance: parseFinance(financeCsv),
      timeLog: parseTimeLog(timeLogCsv),
      inventory,
      pricingReviews: parsePricingReviews(pricingMarkdown, now)
    },
    health: {
      status: warnings.length ? "attention" : "healthy",
      sources: health,
      warnings
    },
    safety: {
      sourceMode: "read-only",
      importedContent: "aggregates, project status, redacted task titles, source metadata",
      excluded: [
        "guest names and contact details",
        "reservation numbers and reservation-specific URLs",
        "keys, check-in codes, passwords and API keys",
        "raw DM, LINE, audio, images and screenshots",
        "raw reservation rows and review text"
      ]
    }
  };
}
