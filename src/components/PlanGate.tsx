import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useHasModule } from "../hooks/useSubscription";
import { EmptyState } from "./ui/EmptyState";
import { Skeleton } from "./ui/Skeleton";
import { Button } from "./ui/Button";
import type { ModuleKey } from "../lib/types";
import { PLAN_CATALOG } from "../lib/plans";

// Wraps a plan-gated page/section: shows its children only if the tenant's
// current plan includes `module`, otherwise a consistent upgrade prompt
// pointing at Settings > Subscription. Mirrors the backend's
// requireModule() middleware so the UI and API agree on what's locked.
export function PlanGate({ module, feature, children }: { module: ModuleKey; feature: string; children: ReactNode }) {
  const { hasModule, isLoading, data } = useHasModule(module);
  const navigate = useNavigate();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (hasModule) return <>{children}</>;

  const requiredPlan = Object.values(PLAN_CATALOG).find((p) => p.modules.includes(module));

  return (
    <EmptyState
      icon={<Lock className="h-5 w-5" />}
      title={`${feature} requires an upgrade`}
      description={`${feature} is available on the ${requiredPlan?.name ?? "Pro"} plan and above. You're currently on ${data?.subscription.plan.name ?? "Free"}.`}
      action={
        <Button size="sm" onClick={() => navigate("/administration?tab=subscription")}>
          View plans
        </Button>
      }
    />
  );
}
