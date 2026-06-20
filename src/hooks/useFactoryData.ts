import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Approval,
  CodexSession,
  FactoryData,
  FactoryState,
  SessionStatus
} from "../types";

const DATA_FILES = [
  "business_areas",
  "tasks",
  "agents",
  "codex_sessions",
  "runs",
  "approvals"
] as const;

const STORAGE_KEY = "ax-factory-local-state-v1";

interface LocalState {
  sessionOverrides: Record<string, SessionStatus>;
  approvalOverrides: Record<string, Approval["status"]>;
}

const emptyLocalState: LocalState = {
  sessionOverrides: {},
  approvalOverrides: {}
};

function readLocalState(): LocalState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? { ...emptyLocalState, ...JSON.parse(value) } : emptyLocalState;
  } catch {
    return emptyLocalState;
  }
}

export function useFactoryData() {
  const [data, setData] = useState<FactoryData | null>(null);
  const [factoryState, setFactoryState] = useState<FactoryState | null>(null);
  const [localState, setLocalState] = useState<LocalState>(readLocalState);
  const [error, setError] = useState<string | null>(null);

  const loadBaseData = useCallback(async () => {
    try {
      const responses = await Promise.all(
        DATA_FILES.map((name) =>
          fetch(`/data/${name}.json`, { cache: "no-store" }).then((response) => {
            if (!response.ok) throw new Error(`${name}.json: ${response.status}`);
            return response.json();
          })
        )
      );
      setData({
        businessAreas: responses[0],
        tasks: responses[1],
        agents: responses[2],
        sessions: responses[3],
        runs: responses[4],
        approvals: responses[5]
      });
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "データ読み込みに失敗しました");
    }
  }, []);

  const pollState = useCallback(async () => {
    try {
      const response = await fetch(`/data/state.json?t=${Date.now()}`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`state.json: ${response.status}`);
      setFactoryState(await response.json());
      setError(null);
    } catch (stateError) {
      setError(stateError instanceof Error ? stateError.message : "状態同期に失敗しました");
    }
  }, []);

  useEffect(() => {
    void loadBaseData();
    void pollState();
    const timer = window.setInterval(pollState, 5000);
    return () => window.clearInterval(timer);
  }, [loadBaseData, pollState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localState));
  }, [localState]);

  const mergedData = useMemo<FactoryData | null>(() => {
    if (!data) return null;
    const liveSessionMap = new Map(factoryState?.sessions.map((session) => [session.id, session]));

    const sessions: CodexSession[] = data.sessions.map((session) => {
      const liveSession = liveSessionMap.get(session.id);
      return {
        ...session,
        ...liveSession,
        status: localState.sessionOverrides[session.id] ?? liveSession?.status ?? session.status
      };
    });

    const knownSessionIds = new Set(sessions.map((session) => session.id));
    for (const liveSession of factoryState?.sessions ?? []) {
      if (knownSessionIds.has(liveSession.id)) continue;
      sessions.push({
        id: liveSession.id,
        title: liveSession.title || "未割当Codexセッション",
        relatedBusinessAreaId: "command-center",
        relatedTaskId: "",
        agentId: "agent-codex-unassigned",
        status: localState.sessionOverrides[liveSession.id] ?? liveSession.status,
        lastActivity: liveSession.lastActivity,
        currentAction: liveSession.currentAction,
        displayCharacter: "pet-girl",
        sessionUrl: "",
        progress: liveSession.progress,
        changedFiles: liveSession.changedFiles
      });
    }

    const approvals = data.approvals.map((approval) => ({
      ...approval,
      status: localState.approvalOverrides[approval.id] ?? approval.status
    }));

    return { ...data, sessions, approvals };
  }, [data, factoryState, localState]);

  const updateSessionStatus = useCallback((sessionId: string, status: SessionStatus) => {
    setLocalState((current) => ({
      ...current,
      sessionOverrides: { ...current.sessionOverrides, [sessionId]: status }
    }));
  }, []);

  const updateApprovalStatus = useCallback(
    (approvalId: string, status: Approval["status"]) => {
      setLocalState((current) => ({
        ...current,
        approvalOverrides: { ...current.approvalOverrides, [approvalId]: status }
      }));
    },
    []
  );

  const resetLocalState = useCallback(() => setLocalState(emptyLocalState), []);

  return {
    data: mergedData,
    factoryState,
    error,
    updateSessionStatus,
    updateApprovalStatus,
    resetLocalState,
    refresh: pollState
  };
}
