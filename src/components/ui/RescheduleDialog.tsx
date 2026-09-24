import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Input, Label } from "./Input";
import { dateOnly, formatDate } from "../../lib/format";

// Shared "move the due date" dialog for AP (payments) and AR (incoming).
// The caller does the request; this only collects the new date + reason.
export function RescheduleDialog({
  open,
  onClose,
  onConfirm,
  currentDate,
  subject,
  dateLabel = "Due date",
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
      title="Adjust due date"
      description={`${subject} - currently ${formatDate(currentDate)}. Every change is recorded in the audit trail.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(date, reason.trim())} loading={loading} disabled={!date || unchanged}>
            Save new date
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="reschedule-date" required>
            New {dateLabel.toLowerCase()}
          </Label>
          <Input id="reschedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reschedule-reason">Reason (optional)</Label>
          <Input id="reschedule-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. supplier agreed to extend terms" />
        </div>
      </div>
    </Dialog>
  );
}
