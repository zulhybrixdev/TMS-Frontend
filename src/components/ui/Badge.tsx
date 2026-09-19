import { HTMLAttributes } from "react";
import clsx from "clsx";

type Tone = "good" | "warning" | "serious" | "critical" | "neutral" | "brand";

const toneClasses: Record<Tone, string> = {
  good: "bg-status-good-soft text-status-good",
  warning: "bg-status-warning-soft text-status-warning",
  serious: "bg-status-serious-soft text-status-serious",
  critical: "bg-status-critical-soft text-status-critical",
  neutral: "bg-plane text-ink-secondary",
  brand: "bg-brand-soft text-brand",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ tone = "neutral", dot, pulse, className, children, ...rest }: Props) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", toneClasses[tone], className)}
      {...rest}
    >
      {dot && <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", pulse && "pulse-dot")} />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "good",
  HEALTHY: "good",
  APPROVED: "good",
  PROCESSED: "good",
  COMPLETED: "good",
  RECEIVED: "good",
  RECONCILED: "good",
  EXCESS: "brand",
  BELOW_TARGET: "warning",
  PENDING: "warning",
  PENDING_APPROVAL: "warning",
  EXPECTED: "warning",
  DRAFT: "neutral",
  DORMANT: "neutral",
  INACTIVE: "neutral",
  LOCKED: "neutral",
  SHORTFALL: "critical",
  REJECTED: "critical",
  CANCELLED: "neutral",
  CLOSED: "neutral",
};

const LIVE_STATUSES = new Set(["PENDING", "PENDING_APPROVAL", "EXPECTED"]);

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <Badge tone={tone} dot pulse={LIVE_STATUSES.has(status)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
