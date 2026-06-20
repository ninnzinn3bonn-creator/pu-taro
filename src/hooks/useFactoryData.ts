import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Approval,
  AuditEntry,
  CodexSession,
  FactoryData,
  FactoryState,
  SessionStatus,
  SourceSnapshot
} from "../types";

const DATA_FILES = [
  "business_areas",
  "tasks",
  "agents",
  "codex_sessions",
  "runs",
  "approvals"
] as const;

const STORAGE_KEY = "ax-factory-local-state-v2";

interface LocalState {
  sessionOverrides: Record<string, SessionStatus>;
  approvalOverrides: Record<string, Approval["status"]>;
  journal: AuditEntry[];
}

const emptyLocalState: LocalState = {
  sessionOverrides: {},
  approvalOverrides: {},
  journal: []
};

function readLocalState(): LocalState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return emptyLocalState;
    const parsed = JSON.parse(value);
    return {
      ...emptyLocalState,
      ...parsed,
      sessionOverrides: parsed.sessionOverrides ?? {},
      approvalOverrides: parsed.approvalOverrides ?? {},
      journal: Array.isArray(parsed.journal) ? parsed.journal : []
    };
  } catch {
    return emptyLocalState;
  }
}

export function useFactoryData() {
  const [data, setData] = useState<FactoryData | null>(null);
  const [factoryState, setFactoryState] = useState<FactoryState | null>(null);
  const [sourceSnapshot, setSourceSnapshot] = useState<SourceSnapshot | null>(null);
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

  const loadSourceSnapshot = useCallback(async () => {
    const candidates = [
      `/data/source_snapshot.local.json?t=${Date.now()}`,
      `/data/source_snapshot.example.json?t=${Date.now()}`
    ];
    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, { cache: "no-store" });
        if (!response.ok) continue;
        setSourceSnapshot(await response.json());
        return;
      } catch {
        // Try the committed fallback snapshot.
      }
    }
    setSourceSnapshot(null);
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
    void loadSourceSnapshot();
    void pollState();
    const stateTimer = window.setInterval(pollState, 5000);
    const sourceTimer = window.setInterval(loadSourceSnapshot, 60_000);
    return () => {
      window.clearInterval(stateTimer);
      window.clearInterval(sourceTimer);
    };
  }, [loadBaseData, loadSourceSnapshot, pollState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localState));
  }, [localState]);

  const mergedData = useMemo<FactoryData | null>(() => {
    if (!data) return null;
    const sourceIsLive = Boolean(sourceSnapshot?.live);
    const runtimeStateIsLive = Boolean(
      factoryState?.source &&
        !["mock-state-file", "sample", "demo"].includes(factoryState.source)
    );
    const sourceAreas =
      sourceSnapshot?.live && sourceSnapshot.businessAreas.length
        ? sourceSnapshot.businessAreas
        : data.businessAreas;
    const commandCenter = data.businessAreas.find((area) => area.id === "command-center");
    const businessAreas =
      commandCenter && !sourceAreas.some((area) => area.id === commandCenter.id)
        ? [...sourceAreas, commandCenter]
        : sourceAreas;
    const liveSessionMap = new Map(factoryState?.sessions.map((session) => [session.id, session]));

    const seedSessions = sourceIsLive ? [] : data.sessions;
    const sessions: CodexSession[] = seedSessions.map((session) => {
      const liveSession = liveSessionMap.get(session.id);
      return {
        ...session,
        ...liveSession,
        status: localState.sessionOverrides[session.id] ?? liveSession?.status ?? session.status
      };
    });

    const knownSessionIds = new Set(sessions.map((session) => session.id));
    for (const liveSession of runtimeStateIsLive ? factoryState?.sessions ?? [] : []) {
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

    const approvals = (sourceIsLive ? [] : data.approvals).map((approval) => ({
      ...approval,
      status: localState.approvalOverrides[approval.id] ?? approval.status
    }));

    const sourceTasks = sourceSnapshot?.live ? sourceSnapshot.tasks : [];
    const sourceTaskIds = new Set(sourceTasks.map((task) => task.id));
    const tasks = [
      ...sourceTasks,
      ...(sourceIsLive
        ? []
        : data.tasks.filter((task) => !sourceTaskIds.has(task.id)))
    ];

    return {
      ...data,
      businessAreas,
      tasks,
      sessions,
      approvals,
      runs: sourceIsLive ? [] : data.runs
    };
  }, [data, factoryState, localState, sourceSnapshot]);

  const updateSessionStatus = useCallback((sessionId: string, status: SessionStatus) => {
    setLocalState((current) => {
      const entry: AuditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: "session_status_changed",
        targetId: sessionId,
        before: current.sessionOverrides[sessionId] ?? "source",
        after: status,
        note: "AX Factory UIでセッション状態を手動変更"
      };
      return {
        ...current,
        sessionOverrides: { ...current.sessionOverrides, [sessionId]: status },
        journal: [entry, ...current.journal].slice(0, 500)
      };
    });
  }, []);

  const updateApprovalStatus = useCallback(
    (approvalId: string, status: Approval["status"]) => {
      setLocalState((current) => {
        const entry: AuditEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: "approval_changed",
          targetId: approvalId,
          before: current.approvalOverrides[approvalId] ?? "source",
          after: status,
          note: "AX Factory UIで承認状態を変更"
        };
        return {
          ...current,
          approvalOverrides: { ...current.approvalOverrides, [approvalId]: status },
          journal: [entry, ...current.journal].slice(0, 500)
        };
      });
    },
    []
  );

  const resetLocalState = useCallback(() => setLocalState(emptyLocalState), []);
  const clearJournal = useCallback(
    () => setLocalState((current) => ({ ...current, journal: [] })),
    []
  );
  const refresh = useCallback(async () => {
    await Promise.all([pollState(), loadSourceSnapshot(), loadBaseData()]);
  }, [loadBaseData, loadSourceSnapshot, pollState]);

  return {
    data: mergedData,
    factoryState,
    sourceSnapshot,
    runtimeConnected: Boolean(
      factoryState?.source &&
        !["mock-state-file", "sample", "demo"].includes(factoryState.source)
    ),
    auditJournal: localState.journal,
    error,
    updateSessionStatus,
    updateApprovalStatus,
    resetLocalState,
    clearJournal,
    refresh
  };
}
