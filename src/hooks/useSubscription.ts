import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type { ModuleKey, SubscriptionMeResponse } from "../lib/types";

// Backs Settings > Subscription and every plan-gated page. Re-fetched on
// every mount (not cached in auth-context) so an upgrade/downgrade shows up
// immediately without requiring a re-login - the backend resolves the same
// way (see tenant.middleware.ts).
export function useSubscription() {
  return useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: () => api.get<SubscriptionMeResponse>("/subscriptions/me"),
    staleTime: 30_000,
  });
}

export function useHasModule(moduleKey: ModuleKey): { hasModule: boolean; isLoading: boolean; data?: SubscriptionMeResponse } {
  const { data, isLoading } = useSubscription();
  return { hasModule: data ? data.subscription.plan.modules.includes(moduleKey) : true, isLoading, data };
}
