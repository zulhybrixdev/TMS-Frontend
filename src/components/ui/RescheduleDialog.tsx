import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Input, Label } from "./Input";
import { dateOnly, formatDate } from "../../lib/format";
import { t, tk } from "../../i18n";

// Shared "move the due date" dialog for AP (payments) and AR (incoming).
// The caller does the request; this only collects the new date + reason.
export function RescheduleDialog({
  open,
  onClose,
  onConfirm,
  currentDate,
  subject,
  dateLabel = tk("Due date"),
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: string, reason: string) => void;
  currentDate: string;
  subject: string;
  dateLabel?: string;
  loading?: boolean;
}) {
  const [date, setDate] = useState(dateOnly(currentDate));
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setDate(dateOnly(currentDate));
      setReason("");
    }
  }, [open, currentDate]);

  const unchanged = date === dateOnly(currentDate);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("Adjust due date")}
      description={t("{subject} - currently {date}. Every change is recorded in the audit trail.", { subject, date: formatDate(currentDate) })}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("Cancel")}
          </Button>
          <Button onClick={() => onConfirm(date, reason.trim())} loading={loading} disabled={!date || unchanged}>
            {t("Save new date")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="reschedule-date" required>
            {t("New {label}", { label: t(dateLabel).toLowerCase() })}
          </Label>
          <Input id="reschedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reschedule-reason">{t("Reason (optional)")}</Label>
          <Input id="reschedule-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("e.g. supplier agreed to extend terms")} />
        </div>
      </div>
    </Dialog>
  );
}
