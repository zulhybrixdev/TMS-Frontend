import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Send, XCircle } from "lucide-react";
import { api, ApiError } from "../lib/api-client";
import type { Transfer } from "../lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge, Badge } from "../components/ui/Badge";
import { ConfirmDialog } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";
import { ApprovalTimeline } from "../components/approvals/ApprovalTimeline";
import { CommentThread } from "../components/comments/CommentThread";
import { formatDate, formatDateTime, formatMoney } from "../lib/format";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission, user } = useAuth();
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: transfer, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transfer", id],
    queryFn: () => api.get<Transfer>(`/transfers/${id}`),
  });

  const canManage = hasPermission(PERMISSIONS.TRANSFERS_CREATE) && transfer?.requestedBy.id === user?.id;

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/transfers/${id}/submit`);
      toast.success("Transfer submitted for approval");
      qc.invalidateQueries({ queryKey: ["transfer", id] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setConfirmSubmit(false);
    } catch (err) {
      toast.error("Could not submit transfer", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post(`/transfers/${id}/cancel`);
      toast.success("Transfer cancelled");
      qc.invalidateQueries({ queryKey: ["transfer", id] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      setConfirmCancel(false);
    } catch (err) {
      toast.error("Could not cancel transfer", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !transfer) return <ErrorState message={(error as Error)?.message} onRetry={refetch} />;

  const latestApproval = transfer.approvalRequests[0];

  return (
    <>
      <button onClick={() => navigate("/transfers")} className="mb-4 flex items-center gap-1.5 text-[13px] text-ink-secondary hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Transfers
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold text-ink">{transfer.transferNumber}</h1>
            <StatusBadge status={transfer.status} />
            {transfer.isSystemRecommended && <Badge tone="brand">System recommended</Badge>}
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            {transfer.sourceAccountName} → {transfer.destinationAccountName} · {formatMoney(transfer.amount, transfer.currencyCode)}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {transfer.status === "DRAFT" && (
              <>
                <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                  <XCircle className="h-4 w-4" /> Cancel
                </Button>
                <Button onClick={() => setConfirmSubmit(true)}>
                  <Send className="h-4 w-4" /> Submit for Approval
                </Button>
              </>
            )}
            {transfer.status === "PENDING_APPROVAL" && (
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                <XCircle className="h-4 w-4" /> Cancel Request
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Source Account" value={`${transfer.sourceAccountName} (${transfer.sourceBankName})`} />
            <Field label="Destination Account" value={`${transfer.destinationAccountName} (${transfer.destinationBankName})`} />
            <Field label="Amount" value={formatMoney(transfer.amount, transfer.currencyCode)} />
            {transfer.suggestedAmount != null && <Field label="Originally Suggested" value={formatMoney(transfer.suggestedAmount, transfer.currencyCode)} />}
            <Field label="Transfer Date" value={formatDate(transfer.transferDate)} />
            <Field label="Requested By" value={transfer.requestedBy.name} />
            <Field label="Created" value={formatDateTime(transfer.createdAt)} />
            <div className="col-span-full">
              <Field label="Reason" value={transfer.reason || "—"} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Status</CardTitle>
          </CardHeader>
          <CardBody>
            {!latestApproval ? <p className="text-[13px] text-ink-muted">This transfer has not been submitted for approval yet.</p> : <ApprovalTimeline request={latestApproval} />}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <CommentThread entityType="TRANSFER" entityId={transfer.id} />
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={submit}
        title="Submit transfer for approval?"
        description={`This will send ${transfer.transferNumber} into the approval workflow.`}
        confirmLabel="Submit"
        loading={busy}
      />
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancel}
        title="Cancel this transfer?"
        description="This action cannot be undone."
        confirmLabel="Cancel Transfer"
        tone="danger"
        loading={busy}
      />
    </>
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
