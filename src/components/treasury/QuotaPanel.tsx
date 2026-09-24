import { Settings2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatMoney } from "../../lib/format";
import type { QuotaUsage } from "../../lib/types";
import { t, tk } from "../../i18n";

const METHOD_LABEL = { CHEQUE: tk("Cheque"), BANK_DRAFT: tk("Bank draft") } as const;

// Cheque / bank draft released quota for the day: how much has been released
// (posted), how much is still pending in the pipeline, and what is left.
export function QuotaPanel({ quotas, onManage }: { quotas: QuotaUsage[]; onManage?: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Released Quota")}</CardTitle>
        {onManage && (
          <Button size="sm" variant="outline" onClick={onManage}>
            <Settings2 className="h-3.5 w-3.5" /> {t("Set quotas")}
          </Button>
        )}
      </CardHeader>
      <CardBody className="space-y-5">
        {quotas.length === 0 ? (
          <p className="text-[13px] text-ink-muted">{t("No cheque or bank draft quota is set up yet.")}{onManage ? t(" Use “Set quotas” to add one, e.g. the MBSB bank draft limit.") : ""}</p>
        ) : (
          quotas.map((q) => <QuotaRow key={q.id} q={q} />)
        )}
      </CardBody>
    </Card>
  );
}

function QuotaRow({ q }: { q: QuotaUsage }) {
  const usesAmount = q.dailyAmountLimit !== null;
  const limit = usesAmount ? q.dailyAmountLimit! : q.dailyCountLimit!;
  const released = usesAmount ? q.releasedAmount : q.releasedCount;
  const pending = usesAmount ? q.pendingAmount : q.pendingCount;
  const releasedPct = Math.min(100, (released / limit) * 100);
  const pendingPct = Math.min(100 - releasedPct, (pending / limit) * 100);
  const fmt = (n: number) => (usesAmount ? formatMoney(n, q.currencyCode) : String(n));

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13.5px] font-medium text-ink">
          {q.bankName ? `${q.bankName} ` : ""}
          {t(METHOD_LABEL[q.paymentMethod])}
        </p>
        {q.exceeded ? <Badge tone="critical">{t("Over quota")}</Badge> : q.utilisationPct >= 80 ? <Badge tone="warning">{t("{n}% used", { n: q.utilisationPct })}</Badge> : <Badge tone="neutral">{t("{n}% used", { n: q.utilisationPct })}</Badge>}
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-plane" role="progressbar" aria-valuenow={Math.round(releasedPct + pendingPct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={q.exceeded ? "bg-status-critical" : "bg-brand"} style={{ width: `${releasedPct}%` }} />
        <div className={q.exceeded ? "bg-status-critical/40" : "bg-brand/35"} style={{ width: `${pendingPct}%` }} />
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-ink-muted">{t("Released")}</dt>
          <dd className="tabular-nums font-medium text-ink">{fmt(released)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">{t("Pending")}</dt>
          <dd className="tabular-nums font-medium text-ink">{fmt(pending)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">{t("Remaining of")} {fmt(limit)}</dt>
          <dd className={`tabular-nums font-medium ${(usesAmount ? q.remainingAmount! : q.remainingCount!) < 0 ? "text-status-critical" : "text-status-good"}`}>{fmt(usesAmount ? q.remainingAmount! : q.remainingCount!)}</dd>
        </div>
      </dl>
      {usesAmount && q.dailyCountLimit !== null && (
        <p className="mt-1.5 text-xs text-ink-muted">
          {t("Count: {used} of {limit} ({released} released)", { used: q.releasedCount + q.pendingCount, limit: q.dailyCountLimit, released: q.releasedCount })}
        </p>
      )}
    </div>
  );
}
