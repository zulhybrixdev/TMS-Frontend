import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api-client";

export const DASHBOARD_WIDGETS = [
  { key: "cashFlowTrend", label: "Cash-Flow Trend" },
  { key: "cashByBank", label: "Cash by Bank" },
  { key: "forecast", label: "30-Day Forecast" },
  { key: "alerts", label: "Alerts" },
  { key: "recommendations", label: "Recommended Transfers" },
  { key: "pendingApprovals", label: "Pending Approvals" },
] as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGETS)[number]["key"];

// Saved dashboard layout - Pro+ only (backend blocks this route via
// requireModule for other plans). `enabled` gates the actual network call
// so non-Pro+ tenants never hit a route they'd get a plan-upgrade error
// from - they just always see every widget, same as before this existed.
export function useDashboardWidgetPrefs(enabled: boolean) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["dashboard", "widget-prefs"],
    queryFn: () => api.get<Record<string, boolean>>("/dashboard/widget-prefs"),
    enabled,
  });

  const isVisible = (key: DashboardWidgetKey) => data?.[key] !== false;

  const save = async (widgets: Record<string, boolean>) => {
    await api.patch("/dashboard/widget-prefs", { widgets });
    qc.invalidateQueries({ queryKey: ["dashboard", "widget-prefs"] });
  };

  return { prefs: data ?? {}, isVisible, save };
}
