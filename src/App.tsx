import { useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  Factory,
  Gauge,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy,
  Wrench
} from "lucide-react";
import { AchievementToast } from "./components/AchievementToast";
import { ApprovalGate } from "./components/ApprovalGate";
import { FactoryMap } from "./components/FactoryMap";
import { SessionPanel } from "./components/SessionPanel";
import { SourceHealthPanel } from "./components/SourceHealthPanel";
import { SESSION_META } from "./constants";
import { useFactoryData } from "./hooks/useFactoryData";
import type { Approval, SessionStatus } from "./types";

type BottomTab = "activity" | "approvals" | "errors";
type PrimaryView = "factory" | "source";

function App() {
  const {
    data,
    factoryState,
    sourceSnapshot,
    auditJournal,
    runtimeConnected,
    error,
    updateSessionStatus,
    updateApprovalStatus,
    resetLocalState,
    clearJournal,
    refresh
  } = useFactoryData();
  const [primaryView, setPrimaryView] = useState<PrimaryView>("factory");
  const [selectedAreaId, setSelectedAreaId] = useState("guest-support");
  const [selectedSessionId, setSelectedSessionId] = useState("session-guest-reply");
  const [areaFilter, setAreaFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [bottomTab, setBottomTab] = useState<BottomTab>("activity");
  const [achievement, setAchievement] = useState({
    visible: false,
    title: "",
    description: ""
  });

  const selectedArea = data?.businessAreas.find((area) => area.id === selectedAreaId);
  const selectedSession =
    data?.sessions.find((session) => session.id === selectedSessionId) ??
    data?.sessions.find((session) => session.relatedBusinessAreaId === selectedAreaId);
  const selectedAgent = data?.agents.find((agent) => agent.id === selectedSession?.agentId);
  const selectedTask = data?.tasks.find((task) => task.id === selectedSession?.relatedTaskId);
  const selectedAreaTask =
    selectedTask ??
    data?.tasks.find(
      (task) =>
        task.businessAreaId === selectedAreaId &&
        task.status !== "completed"
    );

  const visibleAreas = useMemo(() => {
    if (!data) return [];
    const keyword = search.trim().toLowerCase();
    return data.businessAreas.filter((area) => {
      const filterMatch =
        areaFilter === "all" ||
        (areaFilter === "attention" && ["attention", "blocked"].includes(area.status)) ||
        data.sessions.some(
          (session) =>
            session.relatedBusinessAreaId === area.id && session.status === areaFilter
        );
      const text = [
        area.name,
        area.shortName,
        area.description,
        area.nextAction,
        ...area.files,
        ...area.prompts
      ]
        .join(" ")
        .toLowerCase();
      return filterMatch && (!keyword || text.includes(keyword));
    });
  }, [areaFilter, data, search]);

  const stats = useMemo(() => {
    if (!data) {
      return { overall: 0, running: 0, pending: 0, errors: 0, completed: 0 };
    }
    const overall = Math.round(
      data.businessAreas.reduce((sum, area) => sum + area.progress, 0) /
        data.businessAreas.length
    );
    return {
      overall,
      running: data.sessions.filter((session) => session.status === "running").length,
      pending: data.approvals.filter((approval) => approval.status === "pending").length,
      errors: data.sessions.filter((session) => session.status === "error").length,
      completed: data.tasks.filter((task) => task.status === "completed").length
    };
  }, [data]);

  function selectArea(areaId: string) {
    setSelectedAreaId(areaId);
    const firstSession = data?.sessions.find(
      (session) => session.relatedBusinessAreaId === areaId
    );
    setSelectedSessionId(firstSession?.id ?? "");
  }

  function selectSession(areaId: string, sessionId: string) {
    setSelectedAreaId(areaId);
    setSelectedSessionId(sessionId);
  }

  function handleStatusChange(status: SessionStatus) {
    if (!selectedSession) return;
    updateSessionStatus(selectedSession.id, status);
    if (status === "completed") {
      setAchievement({
        visible: true,
        title: "ライン改善完了",
        description: `${selectedArea?.name ?? "業務"}のCodexセッションが完了しました。`
      });
    }
  }

  function handleApprovalUpdate(approval: Approval, status: Approval["status"]) {
    updateApprovalStatus(approval.id, status);
    if (status === "approved") {
      setAchievement({
        visible: true,
        title: "承認ゲート通過",
        description: `${approval.title}を承認し、次工程へ進めました。`
      });
    }
  }

  if (!data) {
    return (
      <main className="loading-screen">
        <div className="loading-factory">
          <Factory size={42} />
          <span />
        </div>
        <h1>AX Factoryを起動中</h1>
        <p>{error ?? "業務ラインとCodexセッションを読み込んでいます…"}</p>
      </main>
    );
  }

  const pendingApprovals = data.approvals.filter(
    (approval) => approval.status === "pending"
  );
  const errorSessions = data.sessions.filter((session) => session.status === "error");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-icon">
            <Factory size={22} />
          </span>
          <div>
            <strong>AX FACTORY</strong>
            <span>for Codex · 城崎温泉 柳通り ゆるり</span>
          </div>
        </div>

        <div className="global-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="業務、ファイル、プロンプトを検索"
            aria-label="工場内を検索"
          />
          <kbd>⌘ K</kbd>
        </div>

        <div className="topbar-status">
          <span
            className={`sync-state ${error ? "sync-error" : ""} ${
              sourceSnapshot?.live ? "sync-live" : ""
            }`}
          >
            <i />
            {error
              ? "同期エラー"
              : sourceSnapshot?.live
                ? "READ-ONLY LIVE"
                : "DEMO DATA"}
          </span>
          <button type="button" className="icon-button" onClick={() => void refresh()} title="再同期">
            <RefreshCw size={16} />
          </button>
          <span className="sync-time">
            {sourceSnapshot?.live
              ? new Date(sourceSnapshot.generatedAt).toLocaleString("ja-JP")
              : factoryState?.updatedAt ?? "未同期"}
          </span>
          <button className="notification-button" type="button" onClick={() => setBottomTab("approvals")}>
            <BellRing size={17} />
            {stats.pending > 0 && <span>{stats.pending}</span>}
          </button>
        </div>
      </header>

      <aside className="left-rail">
        <nav className="primary-nav" aria-label="メインナビゲーション">
          <button
            type="button"
            className={`nav-item ${primaryView === "factory" ? "active" : ""}`}
            onClick={() => setPrimaryView("factory")}
          >
            <Building2 size={17} />
            <span>工場マップ</span>
          </button>
          <button
            type="button"
            className={`nav-item ${primaryView === "source" ? "active" : ""}`}
            onClick={() => setPrimaryView("source")}
          >
            <Database size={17} />
            <span>データソース</span>
            <small>{sourceSnapshot?.health.warnings.length ?? 0}</small>
          </button>
          <button type="button" className="nav-item">
            <Bot size={17} />
            <span>作業員</span>
            <small>{data.sessions.length}</small>
          </button>
          <button type="button" className="nav-item" onClick={() => setBottomTab("approvals")}>
            <ShieldCheck size={17} />
            <span>承認ゲート</span>
            <small>{stats.pending}</small>
          </button>
          <button type="button" className="nav-item">
            <Wrench size={17} />
            <span>Blueprint</span>
          </button>
          <button type="button" className="nav-item">
            <Trophy size={17} />
            <span>実績</span>
            <small>{stats.completed}</small>
          </button>
        </nav>

        <div className="rail-section">
          <span className="rail-label">表示フィルター</span>
          {[
            ["all", "すべて", data.businessAreas.length],
            ["running", "実行中", stats.running],
            ["waiting_approval", "承認待ち", stats.pending],
            ["attention", "要確認", stats.errors]
          ].map(([value, label, count]) => (
            <button
              type="button"
              className={`filter-item ${areaFilter === value ? "active" : ""}`}
              key={value}
              onClick={() => setAreaFilter(String(value))}
            >
              <span className={`filter-dot filter-${value}`} />
              <span>{label}</span>
              <small>{count}</small>
            </button>
          ))}
        </div>

        <div className="factory-power">
          <div className="power-title">
            <Gauge size={15} />
            <span>AUTOMATION POWER</span>
          </div>
          <strong>{stats.overall}%</strong>
          <div className="power-bar">
            <span style={{ width: `${stats.overall}%` }} />
          </div>
          <small>事業全体のAX進行度</small>
        </div>
      </aside>

      <main className="workspace">
        <section className="workspace-head">
          <div>
            <span className="eyebrow">
              {primaryView === "factory" ? "BUSINESS DIGITAL TWIN" : "DATA GOVERNANCE"}
            </span>
            <h1>
              {primaryView === "factory"
                ? "民泊AX オペレーションフロア"
                : "民泊正本データ・品質監視"}
            </h1>
            <p>
              {primaryView === "factory"
                ? "業務ライン、Codexセッション、人間承認の詰まりを一画面で監督します。"
                : "Auto Houseを読み取り専用で参照し、集計値・鮮度・欠損・安全境界を確認します。"}
            </p>
          </div>
          <div className="kpi-strip">
            <div>
              <Activity size={15} />
              <span>稼働中</span>
              <strong>{stats.running}</strong>
            </div>
            <div>
              <Clock3 size={15} />
              <span>承認待ち</span>
              <strong>{stats.pending}</strong>
            </div>
            <div className={stats.errors ? "danger" : ""}>
              <TimerReset size={15} />
              <span>障害</span>
              <strong>{stats.errors}</strong>
            </div>
            <div>
              <CheckCircle2 size={15} />
              <span>完了タスク</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>
        </section>

        {primaryView === "source" ? (
          <SourceHealthPanel
            snapshot={sourceSnapshot}
            journal={auditJournal}
            runtimeConnected={runtimeConnected}
            onClearJournal={clearJournal}
          />
        ) : (
          <>
            {visibleAreas.length ? (
              <FactoryMap
                areas={visibleAreas}
                sessions={data.sessions}
                agents={data.agents}
                selectedAreaId={selectedAreaId}
                selectedSessionId={selectedSession?.id}
                onSelectArea={selectArea}
                onSelectSession={selectSession}
              />
            ) : (
              <div className="map-empty">
                <Search size={28} />
                <strong>該当する業務ラインがありません</strong>
                <span>検索語またはフィルターを変更してください。</span>
              </div>
            )}

            <section className="operations-dock">
          <div className="dock-tabs">
            <button
              type="button"
              className={bottomTab === "activity" ? "active" : ""}
              onClick={() => setBottomTab("activity")}
            >
              <Activity size={14} />
              実行ログ
            </button>
            <button
              type="button"
              className={bottomTab === "approvals" ? "active" : ""}
              onClick={() => setBottomTab("approvals")}
            >
              <ShieldCheck size={14} />
              承認待ち
              <small>{pendingApprovals.length}</small>
            </button>
            <button
              type="button"
              className={bottomTab === "errors" ? "active" : ""}
              onClick={() => setBottomTab("errors")}
            >
              <TimerReset size={14} />
              エラー
              <small>{errorSessions.length}</small>
            </button>
          </div>

          <div className="dock-content">
            {bottomTab === "activity" && (
              data.runs.length ? (
                <div className="run-grid">
                  {data.runs.map((run) => {
                  const session = data.sessions.find((item) => item.id === run.sessionId);
                  const status = session ? SESSION_META[session.status] : null;
                  return (
                    <article className="run-card" key={run.id}>
                      <span
                        className="run-status-dot"
                        style={{ background: status?.color ?? "#8d9bb5" }}
                      />
                      <div>
                        <div className="run-heading">
                          <strong>{run.summary}</strong>
                          <span>{run.startedAt}</span>
                        </div>
                        <p>{run.result}</p>
                        <div className="run-files">
                          {run.filesChanged.map((file) => (
                            <span key={file}>{file}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                  })}
                </div>
              ) : (
                <div className="dock-empty">
                  <Activity size={20} />
                  <strong>実行ログはまだ接続されていません</strong>
                  <span>AX Factory Plugin / Hooksを有効にすると実セッションのログが表示されます。</span>
                </div>
              )
            )}

            {bottomTab === "approvals" && (
              data.approvals.length ? (
                <div className="approval-list">
                  {data.approvals.map((approval) => (
                    <ApprovalGate
                      key={approval.id}
                      approval={approval}
                      onUpdate={(status) => handleApprovalUpdate(approval, status)}
                    />
                  ))}
                </div>
              ) : (
                <div className="dock-empty">
                  <ShieldCheck size={20} />
                  <strong>実承認データはありません</strong>
                  <span>デモ承認はライブデータ接続時には表示しません。</span>
                </div>
              )
            )}

            {bottomTab === "errors" && (
              <div className="error-list">
                {errorSessions.length ? (
                  errorSessions.map((session) => (
                    <article key={session.id}>
                      <span className="error-pulse" />
                      <div>
                        <strong>{session.title}</strong>
                        <p>{session.currentAction}</p>
                        <div className="run-files">
                          {session.changedFiles.map((file) => (
                            <span key={file}>{file}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="healthy-state">
                    <Sparkles size={24} />
                    <strong>ライン障害はありません</strong>
                    <span>全セッションが正常範囲で動作しています。</span>
                  </div>
                )}
              </div>
            )}
          </div>
            </section>
          </>
        )}
      </main>

      <SessionPanel
        area={selectedArea}
        session={selectedSession}
        agent={selectedAgent}
        task={selectedAreaTask}
        onStatusChange={handleStatusChange}
        onReset={resetLocalState}
      />

      <AchievementToast
        {...achievement}
        onClose={() => setAchievement((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}

export default App;
