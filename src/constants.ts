import type { SessionStatus } from "./types";

export const SESSION_META: Record<
  SessionStatus,
  { label: string; shortLabel: string; color: string; asset: string }
> = {
  running: {
    label: "実行中",
    shortLabel: "RUN",
    color: "#43e8b8",
    asset: "/agents/running.png"
  },
  waiting_input: {
    label: "入力待ち",
    shortLabel: "INPUT",
    color: "#f7c85c",
    asset: "/agents/waiting.png"
  },
  waiting_approval: {
    label: "承認待ち",
    shortLabel: "REVIEW",
    color: "#ff9f68",
    asset: "/agents/review.png"
  },
  completed: {
    label: "完了",
    shortLabel: "DONE",
    color: "#67d8ff",
    asset: "/agents/completed.png"
  },
  error: {
    label: "エラー",
    shortLabel: "ERROR",
    color: "#ff6b7d",
    asset: "/agents/error.png"
  },
  idle: {
    label: "待機中",
    shortLabel: "IDLE",
    color: "#8d9bb5",
    asset: "/agents/idle.png"
  }
};

export const SESSION_STATUS_ORDER: SessionStatus[] = [
  "running",
  "waiting_input",
  "waiting_approval",
  "completed",
  "error",
  "idle"
];
