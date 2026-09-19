import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Textarea, Label } from "../ui/Input";
import { StatusBadge } from "../ui/Badge";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { api, ApiError } from "../../lib/api-client";
import { formatMoney, formatDate } from "../../lib/format";
import type { ApprovalRequestSummary } from "../../lib/types";

export function ApprovalActionDialog({ request, onClose, onDone }: { request: ApprovalRequestSummary; onClose: () => void; onDone: () => void }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<"APPROVE" | "REJECT" | null>(null);

  const act = async (action: "APPROVE" | "REJECT") => {
    setBusy(action);
    try {
      await api.post(`/approvals/${request.id}/act`, { action, comment: comment || undefined });
      toast.success(action === "APPROVE" ? "Approved" : "Rejected", {
        description: action === "APPROVE" ? "The request has moved to the next step." : "The requester has been notified.",
      });
      onDone();
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Review Approval Request"
      description={request.label}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="danger" onClick={() => act("REJECT")} loading={busy === "REJECT"} disabled={!!busy}>
            Reject
          </Button>
          <Button onClick={() => act("APPROVE")} loading={busy === "APPROVE"} disabled={!!busy}>
            Approve
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-plane p-4 sm:grid-cols-3">
          <Field label="Type" value={request.entityType === "PAYMENT" ? "Payment" : "Transfer"} />
          <Field label="Amount" value={formatMoney(request.amount, request.currencyCode)} />
          <Field label="Submitted" value={formatDate(request.createdAt)} />
          {request.payment && (
            <>
              <Field label="Beneficiary" value={request.payment.beneficiaryName} />
              <Field label="Source Account" value={request.payment.sourceAccount ?? "—"} />
            </>
          )}
          {request.transfer && (
            <>
              <Field label="From" value={request.transfer.sourceAccount ?? "—"} />
              <Field label="To" value={request.transfer.destinationAccount ?? "—"} />
            </>
          )}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Status</p>
            <div className="mt-1">
              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>

        <ApprovalTimeline request={request} />

        {request.status === "PENDING" && (
          <div>
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add context for this decision..." />
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-[13.5px] text-ink">{value}</p>
    </div>
  );
}
