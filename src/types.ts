export type SessionStatus =
  | "running"
  | "waiting_input"
  | "waiting_approval"
  | "completed"
  | "error"
  | "idle";

export type AreaStatus = "active" | "attention" | "blocked" | "stable";
export type TaskStatus = "todo" | "in_progress" | "waiting" | "completed" | "error";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type RiskLevel = "low" | "medium" | "high";

export interface BusinessArea {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  axLevel: number;
  progress: number;
  status: AreaStatus;
  color: string;
  accent: string;
  position: { x: number; y: number };
  nextAction: string;
  files: string[];
  prompts: string[];
  prohibitedActions: string[];
  line: AutomationNode[];
}

export interface AutomationNode {
  id: string;
  label: string;
  kind: "input" | "machine" | "approval" | "output";
  status: "ready" | "running" | "waiting" | "blocked" | "completed";
}

export interface Task {
  id: string;
  businessAreaId: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  priority: "low" | "medium" | "high";
  assigneeType: "agent" | "human";
  assigneeId: string;
  relatedFiles: string[];
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: "codex" | "human" | "external";
  role: string;
  allowedTools: string[];
  forbiddenActions: string[];
  defaultPrompt: string;
  status: SessionStatus;
}

export interface CodexSession {
  id: string;
  title: string;
  relatedBusinessAreaId: string;
  relatedTaskId: string;
  agentId: string;
  status: SessionStatus;
  lastActivity: string;
  currentAction: string;
  displayCharacter: string;
  sessionUrl: string;
  progress: number;
  changedFiles: string[];
}

export interface Run {
  id: string;
  sessionId: string;
  taskId: string;
  summary: string;
  result: string;
  filesChanged: string[];
  status: "running" | "completed" | "error";
  startedAt: string;
  completedAt: string | null;
}

export interface Approval {
  id: string;
  taskId: string;
  runId: string;
  businessAreaId: string;
  type: string;
  title: string;
  content: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  requestedAt: string;
}

export interface FactoryState {
  updatedAt: string;
  source: string;
  sessions: Array<
    Pick<
      CodexSession,
      "id" | "status" | "lastActivity" | "currentAction" | "progress" | "changedFiles"
    > & {
      title?: string;
      workspace?: string;
    }
  >;
}

export interface FactoryData {
  businessAreas: BusinessArea[];
  tasks: Task[];
  agents: Agent[];
  sessions: CodexSession[];
  runs: Run[];
  approvals: Approval[];
}

export interface SourceHealthItem {
  id: string;
  path: string;
  purpose: string;
  maxAgeDays: number;
  exists: boolean;
  modifiedAt: string | null;
  ageDays: number | null;
  status: "fresh" | "stale" | "missing";
  bytes: number;
}

export interface SourceSnapshot {
  schemaVersion: number;
  generatedAt: string;
  mode: "read-only";
  live: boolean;
  source: {
    name: string;
    root: string;
    branch: string | null;
    commit: string | null;
    dirtyFileCount: number;
    dirty: boolean;
  };
  businessAreas: BusinessArea[];
  tasks: Task[];
  metrics: {
    operations: {
      months: Array<{
        month: string;
        occupancyRate: number;
        salesCount: number;
        roomNights: number;
        averageGuests: number;
        averageStay: number;
        reservations: number;
        cancellations: number;
      }>;
      total: {
        month: string;
        occupancyRate: number;
        salesCount: number;
        roomNights: number;
        averageGuests: number;
        averageStay: number;
        reservations: number;
        cancellations: number;
      } | null;
      caveat: string;
    };
    finance: {
      revenue?: number;
      payments?: number;
      bookingFees?: number;
      managementFee?: number;
      expenses?: number;
      net?: number;
    };
    timeLog: {
      entries: number;
      minutes: number;
      lastDate: string | null;
    };
    inventory: Array<{
      item: string;
      currentQuantity: number | null;
      unit: string;
      status: string;
      checkedAt: string;
    }>;
    pricingReviews: Array<{
      date: string;
      label: string;
      focus: string;
      daysFromNow: number;
    }>;
  };
  health: {
    status: "healthy" | "attention";
    sources: SourceHealthItem[];
    warnings: string[];
  };
  safety: {
    sourceMode: "read-only";
    importedContent: string;
    excluded: string[];
  };
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: "session_status_changed" | "approval_changed";
  targetId: string;
  before: string;
  after: string;
  note: string;
}
