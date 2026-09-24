import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Landmark } from "lucide-react";
import { NAV_ITEMS } from "./nav-config";
import { useAuth } from "../../lib/auth-context";
import { PERMISSIONS } from "../../lib/permissions";
import { useSubscription } from "../../hooks/useSubscription";
import { t } from "../../i18n";

export function Sidebar() {
  const { hasPermission } = useAuth();
  const { data: subscription } = useSubscription();
  const location = useLocation();
  const items = NAV_ITEMS.filter((item) => !item.permission || hasPermission(...item.permission));

  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <aside className="ledger-grid hidden w-60 shrink-0 flex-col bg-chrome md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-chrome-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-chrome-accent text-chrome">
          <Landmark className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[13.5px] font-semibold text-chrome-ink">{t("Treasury System")}</p>
          <p className="text-[10.5px] uppercase tracking-wider text-chrome-muted">{t("Treasury Console")}</p>
        </div>
      </div>

      {/* Which tenant + plan you're currently in - the only always-visible
          indicator of both, so it's never ambiguous which organisation's
          data you're looking at. Links to Settings for the detail. */}
      {subscription && (
        <TenantBadge
          linked={hasPermission(PERMISSIONS.SETTINGS_MANAGE)}
          className="flex items-center justify-between gap-2 border-b border-chrome-border px-5 py-2.5"
        >
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-medium text-chrome-ink">{subscription.tenant.name}</span>
            <span className="block text-[10px] uppercase tracking-wider text-chrome-muted">{t("Tenant ·")} {subscription.tenant.slug}</span>
          </span>
          <span className="shrink-0 rounded-full bg-[rgba(149,133,240,0.22)] px-2 py-0.5 text-[10.5px] font-medium text-chrome-accent">
            {subscription.subscription.plan.name}
          </span>
        </TenantBadge>
      )}

      <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={clsx(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                !active && "hover:bg-white/5"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-lg bg-chrome-active"
                  transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.7 }}
                />
              )}
              {active && <motion.span layoutId="sidebar-active-bar" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-chrome-accent" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <item.icon className={clsx("relative z-10 h-[17px] w-[17px] shrink-0 transition-colors", active ? "text-chrome-accent" : "text-chrome-muted")} />
              <span className={clsx("relative z-10 transition-colors", active ? "text-chrome-ink" : "text-chrome-muted")}>{t(item.label)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-chrome-border px-4 py-3 text-[10.5px] uppercase tracking-wider text-chrome-muted">{t("Phase 1 MVP · v1.0")}</div>
    </aside>
  );
}

// Only users who can actually open Administration get a link there - for
// everyone else it's the same indicator, just not clickable.
function TenantBadge({ linked, className, children }: { linked: boolean; className: string; children: React.ReactNode }) {
  if (!linked) return <div className={className}>{children}</div>;
  return (
    <Link to="/administration?tab=subscription" className={clsx(className, "transition-colors hover:bg-white/5")}>
      {children}
    </Link>
  );
}
