import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatDate, formatMoney } from "../../lib/format";
import type { DailyDesk } from "../../lib/types";
import { t } from "../../i18n";

// Outstanding banker acceptance exposure and what matures soon.
export function BankerAcceptanceWidget({ data }: { data: DailyDesk["bankerAcceptances"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Banker Acceptances")}</CardTitle>
        <Link to="/banker-acceptances" className="text-[13px] font-medium text-brand hover:underline">
          {t("View all")}
        </Link>
      </CardHeader>
      <CardBody className="space-y-4">
        {data.summary.length === 0 ? (
          <p className="text-[13px] text-ink-muted">{t("No outstanding banker acceptances.")}</p>
        ) : (
          data.summary.map((s) => (
            <div key={s.currencyCode}>
              <p className="tabular-nums text-[19px] font-semibold text-ink">{formatMoney(s.outstanding, s.currencyCode)}</p>
              <p className="text-xs text-ink-muted">
                {t("outstanding across {n} BA(s)", { n: s.count })}
                {s.dueIn7Days > 0 ? t(" · {amount} due within 7 days", { amount: formatMoney(s.dueIn7Days, s.currencyCode) }) : ""}
                {s.overdue > 0 ? t(" · {amount} overdue", { amount: formatMoney(s.overdue, s.currencyCode) }) : ""}
              </p>
            </div>
          ))
        )}
        {data.upcoming.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">{t("Maturing in the next 14 days")}</p>
            <ul className="space-y-1.5 text-[13px]">
              {data.upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span className="text-ink">
                    {b.referenceNo} <span className="text-xs text-ink-muted">· {b.bankName}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-ink">{formatMoney(b.faceAmount, b.currencyCode)}</span>
                    <Badge tone={b.daysToMaturity < 0 ? "critical" : b.daysToMaturity <= 3 ? "warning" : "neutral"}>{b.daysToMaturity < 0 ? t("{n}d overdue", { n: -b.daysToMaturity }) : b.daysToMaturity === 0 ? t("today") : formatDate(b.maturityDate, { day: "2-digit", month: "short" })}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
