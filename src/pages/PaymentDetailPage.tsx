import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Send, XCircle, AlertTriangle, CalendarClock } from "lucide-react";
import { api, ApiError } from "../lib/api-client";
import { PAYMENT_METHOD_LABEL, type Payment } from "../lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/Badge";
import { ConfirmDialog } from "../components/ui/Dialog";
import { RescheduleDialog } from "../components/ui/RescheduleDialog";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";
import { ApprovalTimeline } from "../components/approvals/ApprovalTimeline";
import { CommentThread } from "../components/comments/CommentThread";
import { formatDate, formatDateTime, formatMoney } from "../lib/format";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission, user } = useAuth();
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: payment, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => api.get<Payment>(`/payments/${id}`),
  });

  const canManage = hasPermission(PERMISSIONS.PAYMENTS_CREATE) && payment?.requestedBy.id === user?.id;
  const canReschedule = hasPermission(PERMISSIONS.PAYMENTS_CREATE);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/payments/${id}/submit`);
      toast.success("Payment submitted for approval");
      qc.invalidateQueries({ queryKey: ["payment", id] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setConfirmSubmit(false);
    } catch (err) {
      toast.error("Could not submit payment", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const reschedule = async (paymentDate: string, reason: string) => {
    setBusy(true);
    try {
      const updated = await api.post<Payment>(`/payments/${id}/reschedule`, { paymentDate, reason: reason || undefined });
      toast.success("Due date updated", { description: updated.status === "PROCESSED" ? "That date has already arrived, so the payment was posted." : undefined });
      qc.invalidateQueries({ queryKey: ["payment", id] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["forecast-projection"] });
      qc.invalidateQueries({ queryKey: ["treasury-desk"] });
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      setRescheduleOpen(false);
    } catch (err) {
      toast.error("Could not change the date", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post(`/payments/${id}/cancel`);
      toast.success("Payment cancelled");
      qc.invalidateQueries({ queryKey: ["payment", id] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      setConfirmCancel(false);
    } catch (err) {
      toast.error("Could not cancel payment", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !payment) return <ErrorState message={(error as Error)?.message} onRetry={refetch} />;

  const latestApproval = payment.approvalRequests[0];

  return (
    <>
      <button onClick={() => navigate("/payments")} className="mb-4 flex items-center gap-1.5 text-[13px] text-ink-secondary hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold text-ink">{payment.paymentNumber}</h1>
            <StatusBadge status={payment.status} />
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            {payment.beneficiaryName} · {formatMoney(payment.amount, payment.currencyCode)}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Any user who can create payments may move a due date, not just whoever raised it - AP is worked by a shared desk. */}
          {canReschedule && ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(payment.status) && (
            <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
              <CalendarClock className="h-4 w-4" /> Adjust Due Date
            </Button>
          )}
          {canManage && payment.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                <XCircle className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={() => setConfirmSubmit(true)}>
                <Send className="h-4 w-4" /> Submit for Approval
              </Button>
            </>
          )}
          {canManage && (payment.status === "PENDING_APPROVAL" || payment.status === "APPROVED") && (
            <Button variant="outline" onClick={() => setConfirmCancel(true)}>
              <XCircle className="h-4 w-4" /> {payment.status === "APPROVED" ? "Cancel Payment" : "Cancel Request"}
            </Button>
          )}
        </div>
      </div>

      {payment.status === "APPROVED" && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-brand/30 bg-brand-soft px-4 py-3 text-[13px] text-brand">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Approved - scheduled for {formatDate(payment.paymentDate)}</p>
            <p className="mt-0.5 text-ink-secondary">The cash stays in the account until the due date, when it is posted automatically. Until then the due date can still be adjusted, or the payment cancelled.</p>
          </div>
        </div>
      )}

      {payment.quotaWarning && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-status-warning/30 bg-status-warning-soft px-4 py-3 text-[13px] text-status-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Released quota</p>
            <p className="mt-0.5 text-ink-secondary">{payment.quotaWarning}</p>
          </div>
        </div>
      )}

      {payment.anomaly?.flagged && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-status-warning/30 bg-status-warning-soft px-4 py-3 text-[13px] text-status-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Unusual payment amount</p>
            <p className="mt-0.5 text-ink-secondary">{payment.anomaly.reason} — worth a second look before approving.</p>
            <p className="mt-1 text-[11.5px] italic text-ink-secondary">
              This is an automatic size comparison against past payments, not fraud detection — it can be wrong or miss real fraud. Use judgment, don't rely on it alone.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label={payment.paymentMethod === "TRANSFER" ? "Beneficiary" : "Payee"} value={payment.beneficiaryName} />
            <Field label="Payment Method" value={PAYMENT_METHOD_LABEL[payment.paymentMethod]} />
            <Field label="Invoice No." value={payment.invoiceNumber || "—"} />
            {payment.paymentMethod === "TRANSFER" && (
              <>
                <Field label="Beneficiary Bank" value={payment.beneficiaryBank} />
                <Field label="Beneficiary Account" value={payment.beneficiaryAccount} />
              </>
            )}
            <Field label="Amount" value={formatMoney(payment.amount, payment.currencyCode)} />
            <Field label="Source Account" value={`${payment.sourceAccountName} (${payment.sourceBankName})`} />
            <Field label="Due Date" value={formatDate(payment.paymentDate)} />
            <Field label="Reference" value={payment.reference || "—"} />
            <Field label="Requested By" value={payment.requestedBy.name} />
            <Field label="Created" value={formatDateTime(payment.createdAt)} />
            <div className="col-span-full">
              <Field label="Description" value={payment.description || "—"} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Status</CardTitle>
          </CardHeader>
          <CardBody>
            {!latestApproval ? (
              <p className="text-[13px] text-ink-muted">This payment has not been submitted for approval yet.</p>
            ) : (
              <ApprovalTimeline request={latestApproval} />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <CommentThread entityType="PAYMENT" entityId={payment.id} />
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={submit}
        title="Submit payment for approval?"
        description={`This will send ${payment.paymentNumber} into the approval workflow. It cannot be edited once submitted.`}
        confirmLabel="Submit"
        loading={busy}
      />
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancel}
        title="Cancel this payment?"
        description={payment.status === "APPROVED" ? "It has been approved but not yet posted, so nothing has left the account. This action cannot be undone." : "This action cannot be undone."}
        confirmLabel="Cancel Payment"
        tone="danger"
        loading={busy}
      />

      <RescheduleDialog
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onConfirm={reschedule}
        currentDate={payment.paymentDate}
        subject={`${payment.paymentNumber} · ${payment.beneficiaryName}`}
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
