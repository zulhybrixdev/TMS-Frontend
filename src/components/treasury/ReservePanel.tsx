import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card";
import { formatMoney } from "../../lib/format";
import type { ReserveSite } from "../../lib/types";
import { t } from "../../i18n";

// Cash reserve by site/entity (PJRM, Bukit Raja, ...): what each site holds
// back - amounts earmarked on its ordinary accounts plus its reserve accounts.
export function ReservePanel({ sites }: { sites: ReserveSite[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Cash Reserve by Site")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {sites.length === 0 ? (
          <p className="text-[13px] text-ink-muted">{t("No reserves yet. Tag a bank account with a site and either set its reserved amount or make it a Reserve account.")}</p>
        ) : (
          sites.map((s) => (
            <div key={`${s.siteName}-${s.currencyCode}`}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13.5px] font-medium text-ink">{s.siteName}</p>
                <p className="tabular-nums text-[15px] font-semibold text-ink">{formatMoney(s.total, s.currencyCode)}</p>
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-ink-muted">
                {s.accounts.map((a) => (
                  <li key={a.accountId} className="flex justify-between gap-2">
                    <span>
                      {a.accountName} · {a.bankName} <span className="text-ink-muted/70">({a.accountType === "RESERVE" ? t("reserve account") : t("earmarked")})</span>
                    </span>
                    <span className="tabular-nums">{formatMoney(a.amount, s.currencyCode)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
