import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { api } from "../../lib/api-client";
import type { CashPositionSummary, LiveFxRates } from "../../lib/types";
import { PlanGate } from "../PlanGate";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";

export function LiveFxRatesCard() {
  return (
    <PlanGate module="advanced_insights" feature="Live FX Rates">
      <LiveFxRatesCardInner />
    </PlanGate>
  );
}

function LiveFxRatesCardInner() {
  // Reuses the same "cash-position" query the rest of the page already
  // makes (react-query dedupes by key) just to know which foreign
  // currencies this tenant actually holds - no point quoting pairs it
  // never uses.
  const { data: position } = useQuery({ queryKey: ["cash-position"], queryFn: () => api.get<CashPositionSummary>("/cash-position") });
  const quotes = (position?.byCurrency ?? []).map((c) => c.key).filter((c) => c !== "MYR");

  const { data, isLoading } = useQuery({
    queryKey: ["fx", "live-rates", quotes],
    queryFn: () => api.get<LiveFxRates>(`/fx/live-rates?base=MYR&quotes=${quotes.join(",")}`),
    enabled: quotes.length > 0,
    // Client polls faster than the server actually refreshes (server
    // caches 10 min) - harmless, just means most polls return the same
    // cached asOf until the server-side TTL actually expires.
    refetchInterval: 60_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Radio className="h-4 w-4 text-ink-muted" /> Live FX Rates
        </CardTitle>
        {data && (
          <Badge tone={data.source === "twelvedata" ? "good" : "neutral"} dot pulse={data.source === "twelvedata"}>
            {data.source === "twelvedata" ? "Live" : "Daily reference"}
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        {quotes.length === 0 ? (
          <EmptyState title="Single-currency tenant" description="Every account is already in MYR - nothing to quote." />
        ) : isLoading || !data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="space-y-1.5">
              {quotes.map((q) => (
                <div key={q} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-secondary">1 {q}</span>
                  <span className="tabular-nums font-medium text-ink">{data.rates[q] ? (1 / data.rates[q]).toFixed(4) : "—"} MYR</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink-muted">
              As of {new Date(data.asOf).toLocaleTimeString("en-MY")}
              {data.source === "twelvedata" ? " - Twelve Data intraday quote" : " - Twelve Data unavailable, showing the daily reference rate instead"}.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
