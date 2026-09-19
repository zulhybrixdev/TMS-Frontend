import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Landmark, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api-client";

// Stands in for the real Fiuu checkout page when no live gateway
// credentials are configured (see backend/src/modules/billing/fiuu-client.ts).
// Posts to the same billing.service#handleGatewayResult code path a real
// Fiuu notification would - so the rest of the app can't tell the
// difference once payment "completes".
export default function DummyCheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"success" | "fail" | null>(null);

  const orderId = params.get("orderId") ?? "";
  const amount = params.get("amount") ?? "0.00";
  const description = params.get("description") ?? "Subscription";

  const simulate = async (outcome: "success" | "fail") => {
    setLoading(outcome);
    try {
      await api.post("/billing/dummy/simulate", { orderId, outcome });
    } catch {
      // even on error, still route to the return page - it will show the
      // real current state.
    } finally {
      navigate(`/billing/return?orderId=${encodeURIComponent(orderId)}`, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-plane px-6 py-12">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface-raised p-6 shadow-card">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide text-ink-muted">
          <CreditCard className="h-3.5 w-3.5" />
          Dummy checkout simulator
        </div>
        <p className="mb-6 text-[11px] text-ink-muted">
          No live Fiuu credentials are configured, so this stands in for the real payment page. Set <code className="font-mono">FIUU_MERCHANT_ID</code>/<code className="font-mono">FIUU_VERIFY_KEY</code> to use real Fiuu checkout instead.
        </p>

        <div className="mb-6 flex items-center gap-2.5 border-b border-border pb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
            <Landmark className="h-[18px] w-[18px]" />
          </div>
          <span className="font-display text-[15px] font-semibold text-ink">Treasury System</span>
        </div>

        <p className="text-[13px] text-ink-secondary">{description}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink">RM {amount}</p>
        <p className="mt-1 font-mono text-[11px] text-ink-muted">Order {orderId}</p>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => simulate("success")} loading={loading === "success"} disabled={loading !== null} className="w-full justify-center">
            <CheckCircle2 className="h-4 w-4" />
            Simulate successful payment
          </Button>
          <Button onClick={() => simulate("fail")} loading={loading === "fail"} disabled={loading !== null} variant="outline" className="w-full justify-center">
            <XCircle className="h-4 w-4" />
            Simulate failed payment
          </Button>
        </div>
      </div>
    </div>
  );
}
