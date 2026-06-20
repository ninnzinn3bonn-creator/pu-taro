import {
  ArrowRight,
  Check,
  CircleAlert,
  Database,
  FileCheck2,
  Sparkles,
  UserRoundCheck
} from "lucide-react";
import type { AutomationNode } from "../types";

const NODE_ICON = {
  input: Database,
  machine: Sparkles,
  approval: UserRoundCheck,
  output: FileCheck2
};

interface AutomationLineProps {
  nodes: AutomationNode[];
}

export function AutomationLine({ nodes }: AutomationLineProps) {
  return (
    <div className="automation-line" aria-label="業務自動化ライン">
      {nodes.map((node, index) => {
        const Icon = NODE_ICON[node.kind];
        return (
          <div className="line-segment" key={node.id}>
            <div className={`machine-node node-${node.status}`}>
              <span className="machine-icon">
                <Icon size={17} />
              </span>
              <span className="machine-label">{node.label}</span>
              <span className="machine-state" aria-hidden="true">
                {node.status === "completed" && <Check size={11} />}
                {node.status === "blocked" && <CircleAlert size={11} />}
              </span>
            </div>
            {index < nodes.length - 1 && (
              <span
                className={`conveyor ${
                  node.status === "running" || node.status === "completed" ? "active" : ""
                }`}
                aria-hidden="true"
              >
                <span />
                <ArrowRight size={12} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
