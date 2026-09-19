import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Landmark, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { api, getToken } from "../lib/api-client";
import type { SubscriptionMeResponse } from "../lib/types";

// Landing page after a Fiuu (or dummy) checkout redirect. The gateway
// notification is the actual source of truth for activation (it usually
// arrives slightly before or after this page loads), so this just polls
// /subscriptions/me briefly and reflects whatever the current state is.
export default function BillingReturnPage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const isAuthenticated = Boolean(getToken());

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", "me", "billing-return"],
    queryFn: () => api.get<SubscriptionMeResponse>("/subscriptions/me"),
    enabled: isAuthenticated,
    refetchInterval: 2000,
  });

  const invoice = data?.invoices.find((inv) => inv.gatewayOrderId === orderId);
  const status = invoice?.status ?? "PENDING";

  return (
    <div className="flex min-h-screen items-center justify-center bg-plane px-6 py-12">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface-raised p-6 text-center shadow-card">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
            <Landmark className="h-[18px] w-[18px]" />
          </div>
          <span className="font-display text-[15px] font-semibold text-ink">Treasury System</span>
        </div>

        {!isAuthenticated ? (
          <>
            <p className="text-sm text-ink-secondary">Sign in to see your subscription status.</p>
            <Link to="/login">
              <Button className="mt-4 w-full justify-center">Sign in</Button>
            </Link>
          </>
        ) : isLoading || status === "PENDING" ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
            <p className="mt-4 text-sm font-medium text-ink">Waiting for payment confirmation...</p>
            <p className="mt-1 text-[13px] text-ink-secondary">This usually takes a few seconds.</p>
          </>
        ) : status === "PAID" ? (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-status-good" />
            <p className="mt-4 text-sm font-medium text-ink">Payment successful</p>
            <p className="mt-1 text-[13px] text-ink-secondary">You're now on the {data?.subscription.plan.name} plan.</p>
            <Link to="/">
              <Button className="mt-4 w-full justify-center">Go to dashboard</Button>
            </Link>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-8 w-8 text-status-critical" />
            <p className="mt-4 text-sm font-medium text-ink">Payment failed</p>
            <p className="mt-1 text-[13px] text-ink-secondary">Your plan hasn't changed. You can try again from Settings.</p>
            <Link to="/administration?tab=subscription">
              <Button className="mt-4 w-full justify-center">Back to subscription settings</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
