import { AlertTriangle, ArrowUpRight, Bot, Zap } from "lucide-react";
import type { Agent, BusinessArea, CodexSession } from "../types";
import { AgentWorker } from "./AgentWorker";
import { AutomationLine } from "./AutomationLine";

interface FactoryMapProps {
  areas: BusinessArea[];
  sessions: CodexSession[];
  agents: Agent[];
  selectedAreaId: string;
  selectedSessionId?: string;
  onSelectArea: (areaId: string) => void;
  onSelectSession: (areaId: string, sessionId: string) => void;
}

export function FactoryMap({
  areas,
  sessions,
  agents,
  selectedAreaId,
  selectedSessionId,
  onSelectArea,
  onSelectSession
}: FactoryMapProps) {
  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <div className="factory-map">
      <div className="factory-grid" aria-hidden="true" />
      <div className="map-legend">
        <span>
          <Zap size={12} />
          自動化ライン
        </span>
        <span>
          <Bot size={12} />
          Codex作業員
        </span>
        <span>
          <AlertTriangle size={12} />
          人間確認
        </span>
      </div>

      <div className="factory-areas">
        {areas.map((area) => {
          const areaSessions = sessions.filter(
            (session) => session.relatedBusinessAreaId === area.id
          );
          const selected = area.id === selectedAreaId;
          const hasError = areaSessions.some((session) => session.status === "error");
          const hasApproval = areaSessions.some(
            (session) => session.status === "waiting_approval"
          );

          return (
            <section
              className={`factory-area area-${area.status} ${selected ? "selected" : ""}`}
              key={area.id}
              style={
                {
                  "--area-color": area.color,
                  "--area-accent": area.accent
                } as React.CSSProperties
              }
            >
              <button
                className="area-header"
                type="button"
                onClick={() => onSelectArea(area.id)}
              >
                <span className="area-icon">{area.icon}</span>
                <span className="area-heading">
                  <span className="area-eyebrow">{area.shortName}</span>
                  <strong>{area.name}</strong>
                  <small>{area.nextAction}</small>
                </span>
                <span className="area-progress">
                  <strong>{area.progress}%</strong>
                  <span>
                    <i style={{ width: `${area.progress}%` }} />
                  </span>
                </span>
                <ArrowUpRight size={16} />
              </button>

              <div className="area-body">
                <AutomationLine nodes={area.line} />
                <div className="workers-dock">
                  {areaSessions.length ? (
                    areaSessions.map((session) => (
                      <AgentWorker
                        key={session.id}
                        session={session}
                        agent={agentMap.get(session.agentId)}
                        compact
                        selected={selectedSessionId === session.id}
                        onClick={() => onSelectSession(area.id, session.id)}
                      />
                    ))
                  ) : (
                    <div className="no-worker">セッション未接続</div>
                  )}
                </div>
              </div>

              {(hasError || hasApproval) && (
                <div className="area-alert">
                  <AlertTriangle size={13} />
                  {hasError ? "ライン障害を確認してください" : "承認ゲートで停止中"}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
