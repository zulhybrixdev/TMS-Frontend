import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Card } from "../../components/ui/Card";
import { PlanGate } from "../../components/PlanGate";
import { useAuth } from "../../lib/auth-context";
import { useSubscription } from "../../hooks/useSubscription";
import { PERMISSIONS } from "../../lib/permissions";
import { UsersTab } from "./UsersTab";
import { RolesTab } from "./RolesTab";
import { BanksTab } from "./BanksTab";
import { CurrenciesTab } from "./CurrenciesTab";
import { ApprovalRulesTab } from "./ApprovalRulesTab";
import { SettingsTab } from "./SettingsTab";
import { SecurityTab } from "./SecurityTab";
import { t } from "../../i18n";

// Pricing/billing copy, same POC-exclusion flag as registration - see App.tsx.
const BILLING_ENABLED = import.meta.env.VITE_ENABLE_BILLING === "true";
const SubscriptionTab = BILLING_ENABLED ? lazy(() => import("./SubscriptionTab").then((m) => ({ default: m.SubscriptionTab }))) : null;

export default function AdministrationPage() {
  const { hasPermission } = useAuth();
  const { data: subscription } = useSubscription();
  const [searchParams] = useSearchParams();
  // SSO has no concept of "your company's IdP" for a single-user tenant -
  // mirrors the same accountType check already enforced server-side in
  // sso-config.service.ts (hiding it here is a convenience, not the gate).
  const showSecurity = hasPermission(PERMISSIONS.SETTINGS_MANAGE) && subscription?.tenant.accountType !== "INDIVIDUAL";
  const tabs = [
    hasPermission(PERMISSIONS.USERS_MANAGE) && { key: "users", label: t("Users") },
    hasPermission(PERMISSIONS.ROLES_MANAGE) && { key: "roles", label: t("Roles & Permissions") },
    hasPermission(PERMISSIONS.BANKS_MANAGE) && { key: "banks", label: t("Banks") },
    hasPermission(PERMISSIONS.SETTINGS_MANAGE) && { key: "currencies", label: t("Currencies") },
    hasPermission(PERMISSIONS.APPROVAL_RULES_MANAGE) && { key: "approval-rules", label: t("Approval Rules") },
    hasPermission(PERMISSIONS.SETTINGS_MANAGE) && { key: "settings", label: t("System Settings") },
    showSecurity && { key: "security", label: t("Security") },
    BILLING_ENABLED && hasPermission(PERMISSIONS.SETTINGS_MANAGE) && { key: "subscription", label: t("Subscription") },
  ].filter(Boolean) as { key: string; label: string }[];

  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState(tabs.some((t) => t.key === initialTab) ? initialTab! : tabs[0]?.key ?? "users");

  return (
    <>
      <PageHeader title={t("Administration")} description={t("Manage users, roles, banks, currencies, approval rules, subscription, and system settings.")} />
      <Card>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="p-5">
          {tab === "users" && <UsersTab />}
          {tab === "roles" && <RolesTab />}
          {tab === "banks" && <BanksTab />}
          {tab === "currencies" && <CurrenciesTab />}
          {tab === "approval-rules" && (
            <PlanGate module="approval_rules" feature={t("Configurable approval rules")}>
              <ApprovalRulesTab />
            </PlanGate>
          )}
          {tab === "settings" && <SettingsTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "subscription" && SubscriptionTab && (
            <Suspense fallback={null}>
              <SubscriptionTab />
            </Suspense>
          )}
        </div>
      </Card>
    </>
  );
}
