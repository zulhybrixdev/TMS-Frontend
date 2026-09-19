import { Check, Clock, MessageSquare, X } from "lucide-react";
import { formatDateTime } from "../../lib/format";
import type { ApprovalRequestSummary } from "../../lib/types";

const actionIcon = { APPROVE: Check, REJECT: X, COMMENT: MessageSquare };
const actionTone = { APPROVE: "bg-status-good-soft text-status-good", REJECT: "bg-status-critical-soft text-status-critical", COMMENT: "bg-plane text-ink-muted" };

export function ApprovalTimeline({ request }: { request: ApprovalRequestSummary }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-plane px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-ink">
            Approval Level {request.currentLevel} of {request.requiredLevels}
          </p>
          <p className="text-xs text-ink-muted">Status: {request.status.replace(/_/g, " ")}</p>
        </div>
      </div>

      <ol className="space-y-3">
        {request.actions.length === 0 && (
          <li className="flex items-center gap-2.5 text-[13px] text-ink-muted">
            <Clock className="h-4 w-4" /> Awaiting first approval action
          </li>
        )}
        {request.actions.map((action) => {
          const Icon = actionIcon[action.action];
          return (
            <li key={action.id} className="flex gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${actionTone[action.action]}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">
                  {action.actor.name} <span className="font-normal text-ink-secondary">· Level {action.level} {action.action.toLowerCase()}d</span>
                </p>
                {action.comment && <p className="mt-0.5 text-[13px] text-ink-secondary">"{action.comment}"</p>}
                <p className="mt-0.5 text-[11px] text-ink-muted">{formatDateTime(action.actedAt)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
