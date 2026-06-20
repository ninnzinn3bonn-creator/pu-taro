import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  GitBranch,
  HardDrive,
  ListTodo,
  PackageCheck,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import type { AuditEntry, SourceSnapshot } from "../types";

interface SourceHealthPanelProps {
  snapshot: SourceSnapshot | null;
  journal: AuditEntry[];
  runtimeConnected: boolean;
  onClearJournal: () => void;
}

const money = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0
});

function downloadJournal(journal: AuditEntry[]) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          entries: journal
        },
        null,
        2
      )
    ],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ax-factory-audit-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SourceHealthPanel({
  snapshot,
  journal,
  runtimeConnected,
  onClearJournal
}: SourceHealthPanelProps) {
  if (!snapshot) {
    return (
      <section className="source-empty">
        <Database size={32} />
        <strong>データソースを読み込めません</strong>
        <p>`npm run sync:auto-house` を実行してください。</p>
      </section>
    );
  }

  const operations = snapshot.metrics.operations.total;
  const inventoryAttention = snapshot.metrics.inventory.filter(
    (item) => item.status !== "ok" || !item.currentQuantity
  );
  const nextReview = snapshot.metrics.pricingReviews
    .filter((item) => item.daysFromNow >= 0)
    .sort((a, b) => a.daysFromNow - b.daysFromNow)[0];
  const areaMap = new Map(
    snapshot.businessAreas.map((area) => [area.id, area.shortName])
  );
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const prioritizedTasks = snapshot.businessAreas
    .flatMap((area) =>
      snapshot.tasks
        .filter((task) => task.businessAreaId === area.id)
        .sort(
          (a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority] ||
            b.progress - a.progress
        )
        .slice(0, 2)
    )
    .slice(0, 18);

  return (
    <section className="source-dashboard">
      <div className="source-head">
        <div>
          <span className="eyebrow">READ-ONLY SOURCE CONTROL</span>
          <h2>Auto House データ接続</h2>
          <p>
            正本を変更せず、許可済みの進捗・集計・鮮度情報だけを同期しています。
          </p>
        </div>
        <div className={`source-mode ${snapshot.live ? "live" : "demo"}`}>
          <ShieldCheck size={16} />
          {snapshot.live ? "READ-ONLY LIVE" : "DEMO / 未接続"}
        </div>
      </div>

      <div className="source-repo-card">
        <div>
          <HardDrive size={16} />
          <span>Source</span>
          <strong>{snapshot.source.name}</strong>
        </div>
        <div>
          <GitBranch size={16} />
          <span>Branch</span>
          <strong>{snapshot.source.branch ?? "—"}</strong>
        </div>
        <div>
          <PackageCheck size={16} />
          <span>Commit</span>
          <strong>{snapshot.source.commit ?? "—"}</strong>
        </div>
        <div className={snapshot.source.dirty ? "attention" : ""}>
          <AlertTriangle size={16} />
          <span>Working tree</span>
          <strong>
            {snapshot.source.dirty
              ? `${snapshot.source.dirtyFileCount} changes`
              : "clean"}
          </strong>
        </div>
      </div>

      <div className={`runtime-connection ${runtimeConnected ? "connected" : "disconnected"}`}>
        <span className="runtime-dot" />
        <div>
          <strong>
            {runtimeConnected ? "Codex runtime connected" : "Codex runtime not connected"}
          </strong>
          <small>
            {runtimeConnected
              ? "Lifecycle Hooksから実セッション状態を受信しています。"
              : "工場データは実データですが、作業員表示にはPlugin / Hooksの接続が必要です。"}
          </small>
        </div>
      </div>

      <div className="source-metrics">
        <article>
          <WalletCards size={18} />
          <span>年間売上集計</span>
          <strong>
            {snapshot.metrics.finance.revenue != null
              ? money.format(snapshot.metrics.finance.revenue)
              : "未取得"}
          </strong>
          <small>月次売上収支表スナップショット</small>
        </article>
        <article>
          <Database size={18} />
          <span>販売室数</span>
          <strong>{operations?.roomNights ?? "—"}</strong>
          <small>2026年運用指標</small>
        </article>
        <article>
          <Clock3 size={18} />
          <span>平均泊日数</span>
          <strong>{operations?.averageStay ?? "—"}泊</strong>
          <small>{snapshot.metrics.operations.caveat}</small>
        </article>
        <article>
          <Clock3 size={18} />
          <span>記録済み実働</span>
          <strong>{snapshot.metrics.timeLog.minutes}分</strong>
          <small>最終記録 {snapshot.metrics.timeLog.lastDate ?? "なし"}</small>
        </article>
        <article className={inventoryAttention.length ? "attention" : ""}>
          <PackageCheck size={18} />
          <span>在庫要確認</span>
          <strong>{inventoryAttention.length}</strong>
          <small>
            {inventoryAttention.map((item) => item.item).join(" / ") || "問題なし"}
          </small>
        </article>
        <article>
          <CalendarClock size={18} />
          <span>次回価格レビュー</span>
          <strong>{nextReview?.date ?? "未設定"}</strong>
          <small>{nextReview?.label ?? "スケジュールなし"}</small>
        </article>
      </div>

      <div className="source-columns">
        <article className="source-section">
          <div className="source-section-title">
            <div>
              <AlertTriangle size={16} />
              <strong>データ品質</strong>
            </div>
            <span>{snapshot.health.warnings.length} warnings</span>
          </div>
          {snapshot.health.warnings.length ? (
            <ul className="warning-list">
              {snapshot.health.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            <div className="healthy-line">
              <CheckCircle2 size={15} />
              すべての許可済みソースが鮮度基準内です。
            </div>
          )}

          <div className="source-file-list">
            {snapshot.health.sources.map((source) => (
              <div key={source.id} className={`source-file source-${source.status}`}>
                <span className="source-file-status" />
                <div>
                  <strong>{source.purpose}</strong>
                  <small>{source.path}</small>
                </div>
                <div>
                  <strong>
                    {source.status === "missing"
                      ? "missing"
                      : `${source.ageDays}日前`}
                  </strong>
                  <small>{source.status}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="source-section">
          <div className="source-section-title">
            <div>
              <ShieldCheck size={16} />
              <strong>安全境界</strong>
            </div>
            <span>{snapshot.safety.sourceMode}</span>
          </div>
          <p className="source-description">
            取り込み対象: {snapshot.safety.importedContent}
          </p>
          <ul className="safety-exclusions">
            {snapshot.safety.excluded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <article className="source-section source-task-section">
        <div className="source-section-title">
          <div>
            <ListTodo size={16} />
            <strong>優先未完了タスク</strong>
          </div>
          <span>
            {prioritizedTasks.length} shown / {snapshot.tasks.length} open
          </span>
        </div>
        {prioritizedTasks.length ? (
          <div className="source-task-list">
            {prioritizedTasks.map((task) => (
              <div key={task.id} className={`source-task priority-${task.priority}`}>
                <div className="source-task-heading">
                  <span>{areaMap.get(task.businessAreaId) ?? task.businessAreaId}</span>
                  <small>{task.priority}</small>
                </div>
                <strong>{task.title}</strong>
                <div className="source-task-meta">
                  <span>{task.status}</span>
                  <span>{task.progress}%</span>
                  <code>{task.relatedFiles[0] ?? "source task"}</code>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="source-description">未完了タスクはありません。</p>
        )}
      </article>

      <article className="source-section audit-section">
        <div className="source-section-title">
          <div>
            <Database size={16} />
            <strong>AX Factory 操作履歴</strong>
          </div>
          <div className="audit-actions">
            <button
              type="button"
              disabled={!journal.length}
              onClick={() => downloadJournal(journal)}
            >
              <Download size={13} />
              JSON出力
            </button>
            <button type="button" disabled={!journal.length} onClick={onClearJournal}>
              クリア
            </button>
          </div>
        </div>
        {journal.length ? (
          <div className="audit-list">
            {journal.slice(0, 30).map((entry) => (
              <div key={entry.id}>
                <span>{new Date(entry.timestamp).toLocaleString("ja-JP")}</span>
                <strong>{entry.note}</strong>
                <code>
                  {entry.targetId}: {entry.before} → {entry.after}
                </code>
              </div>
            ))}
          </div>
        ) : (
          <p className="source-description">
            承認またはセッション状態を変更すると、ここへローカル監査履歴が残ります。
          </p>
        )}
      </article>
    </section>
  );
}
