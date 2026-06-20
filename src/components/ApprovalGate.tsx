import { Check, ShieldAlert, X } from "lucide-react";
import type { Approval } from "../types";

interface ApprovalGateProps {
  approval: Approval;
  onUpdate: (status: Approval["status"]) => void;
}

export function ApprovalGate({ approval, onUpdate }: ApprovalGateProps) {
  return (
    <article className={`approval-card approval-${approval.status}`}>
      <div className="approval-icon">
        <ShieldAlert size={18} />
      </div>
      <div className="approval-copy">
        <div className="approval-heading">
          <div>
            <span className={`risk-badge risk-${approval.riskLevel}`}>
              {approval.riskLevel.toUpperCase()}
            </span>
            <h4>{approval.title}</h4>
          </div>
          <span className="approval-type">{approval.type}</span>
        </div>
        <p>{approval.content}</p>
        <span className="approval-time">{approval.requestedAt}</span>
      </div>
      <div className="approval-actions">
        {approval.status === "pending" ? (
          <>
            <button type="button" className="button button-approve" onClick={() => onUpdate("approved")}>
              <Check size={14} />
              承認
            </button>
            <button type="button" className="button button-reject" onClick={() => onUpdate("rejected")}>
              <X size={14} />
              却下
            </button>
          </>
        ) : (
          <span className={`approval-result result-${approval.status}`}>
            {approval.status === "approved" ? "承認済み" : "却下済み"}
          </span>
        )}
      </div>
    </article>
  );
}
