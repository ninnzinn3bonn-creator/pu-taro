import {
  ExternalLink,
  FileCode2,
  FolderOpen,
  ListChecks,
  RotateCcw,
  TerminalSquare
} from "lucide-react";
import { SESSION_META, SESSION_STATUS_ORDER } from "../constants";
import type {
  Agent,
  BusinessArea,
  CodexSession,
  SessionStatus,
  Task
} from "../types";
import { AgentWorker } from "./AgentWorker";

interface SessionPanelProps {
  area?: BusinessArea;
  session?: CodexSession;
  agent?: Agent;
  task?: Task;
  onStatusChange: (status: SessionStatus) => void;
  onReset: () => void;
}

export function SessionPanel({
  area,
  session,
  agent,
  task,
  onStatusChange,
  onReset
}: SessionPanelProps) {
  if (!area) {
    return (
      <aside className="session-panel empty-panel">
        <TerminalSquare size={30} />
        <p>工場エリアまたは作業員を選択してください。</p>
      </aside>
    );
  }

  return (
    <aside className="session-panel">
      <div className="panel-kicker">CONTROL ROOM</div>
      <div className="panel-title-row">
        <div>
          <h2>{area.name}</h2>
          <p>{area.description}</p>
        </div>
        <div className="level-orb">
          <span>AX</span>
          <strong>{area.axLevel}</strong>
        </div>
      </div>

      {session && (
        <>
          <div className="panel-section">
            <div className="panel-section-title">
              <span>接続セッション</span>
              <button type="button" className="icon-button" onClick={onReset} title="手動変更をリセット">
                <RotateCcw size={14} />
              </button>
            </div>
            <AgentWorker session={session} agent={agent} selected />
            <label className="status-select-label">
              手動ステータス
              <select
                value={session.status}
                onChange={(event) => onStatusChange(event.target.value as SessionStatus)}
              >
                {SESSION_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {SESSION_META[status].label}
                  </option>
                ))}
              </select>
            </label>
            {session.sessionUrl && (
              <a className="open-session" href={session.sessionUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                Codexセッションを開く
              </a>
            )}
          </div>

          <div className="panel-section detail-stats">
            <div>
              <span>進行度</span>
              <strong>{session.progress}%</strong>
            </div>
            <div>
              <span>変更ファイル</span>
              <strong>{session.changedFiles.length}</strong>
            </div>
            <div>
              <span>最終活動</span>
              <strong>{session.lastActivity}</strong>
            </div>
          </div>
        </>
      )}

      {task && (
        <div className="panel-section">
          <div className="panel-section-title">
            <span>現在のミッション</span>
            <ListChecks size={15} />
          </div>
          <h3 className="mission-title">{task.title}</h3>
          <p className="mission-copy">{task.description}</p>
          <div className="mission-progress">
            <span style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      )}

      <div className="panel-section split-list">
        <div>
          <div className="panel-section-title">
            <span>関連ファイル</span>
            <FolderOpen size={15} />
          </div>
          <ul>
            {area.files.map((file) => (
              <li key={file}>
                <FileCode2 size={13} />
                {file}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="panel-section-title">
            <span>プロンプト / 指示書</span>
            <TerminalSquare size={15} />
          </div>
          <ul>
            {area.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel-section safety-box">
        <strong>人間確認が必要</strong>
        <ul>
          {area.prohibitedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
