import { Bot, Clock3 } from "lucide-react";
import { SESSION_META } from "../constants";
import type { Agent, CodexSession } from "../types";

interface AgentWorkerProps {
  session: CodexSession;
  agent?: Agent;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function AgentWorker({
  session,
  agent,
  compact = false,
  selected = false,
  onClick
}: AgentWorkerProps) {
  const meta = SESSION_META[session.status];

  return (
    <button
      className={`agent-worker status-${session.status} ${compact ? "compact" : ""} ${
        selected ? "selected" : ""
      }`}
      style={{ "--status-color": meta.color } as React.CSSProperties}
      onClick={onClick}
      type="button"
      aria-label={`${session.title}、${meta.label}`}
    >
      <span className="agent-avatar-wrap">
        <span className="agent-signal" />
        <img className="agent-avatar" src={meta.asset} alt="" />
      </span>
      <span className="agent-copy">
        <span className="agent-name">{session.title}</span>
        {!compact && <span className="agent-action">{session.currentAction}</span>}
        <span className="agent-meta">
          <span className="status-chip">
            <Bot size={11} />
            {meta.label}
          </span>
          {!compact && agent && <span>{agent.name}</span>}
          {!compact && (
            <span>
              <Clock3 size={11} />
              {session.lastActivity}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
