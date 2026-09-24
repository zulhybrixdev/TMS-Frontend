import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { api } from "../../lib/api-client";
import type { ConsolidatedCashPosition } from "../../lib/types";
import { PlanGate } from "../PlanGate";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { formatMoney } from "../../lib/format";
import { t } from "../../i18n";

export function ConsolidatedCashCard() {
  return (
    <PlanGate module="advanced_insights" feature={t("Consolidated Cash Position")}>
      <ConsolidatedCashCardInner />
    </PlanGate>
  );
}

function ConsolidatedCashCardInner() {
  const { data, isLoading } = useQuery({
    queryKey: ["cash-position", "consolidated"],
    queryFn: () => api.get<ConsolidatedCashPosition>("/cash-position/consolidated"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-ink-muted" /> {t("Consolidated Total ({base})", { base: data?.baseCurrency ?? "..." })}
        </CardTitle>
      </CardHeader>
      <CardBody>
        {isLoading || !data ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <p className="font-mono text-[26px] font-medium tracking-tight text-ink">{formatMoney(data.totalInBase, data.baseCurrency)}</p>
            <p className="mt-1 text-xs text-ink-muted">{t("Live FX rates (daily reference rates, not intraday trading rates)")}</p>
            <div className="mt-3 space-y-1.5">
              {data.breakdown.map((b) => (
                <div key={b.currencyCode} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink-secondary">
                    {formatMoney(b.total, b.currencyCode)}
                    {b.currencyCode !== data.baseCurrency && b.rateToBase !== null && <span className="text-ink-muted"> · 1 {b.currencyCode} = {b.rateToBase.toFixed(4)} {data.baseCurrency}</span>}
                  </span>
                  <span className="tabular-nums font-medium text-ink">{b.totalInBase !== null ? formatMoney(b.totalInBase, data.baseCurrency) : t("rate unavailable")}</span>
                </div>
              ))}
            </div>
            {data.unconvertedCurrencies.length > 0 && (
              <p className="mt-2 text-[11px] text-status-warning">{t("Could not fetch a rate for: {currencies} - excluded from the total above.", { currencies: data.unconvertedCurrencies.join(", ") })}</p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
