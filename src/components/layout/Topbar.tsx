import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut, Menu, Search, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../lib/auth-context";
import { PERMISSIONS } from "../../lib/permissions";
import { useSubscription } from "../../hooks/useSubscription";
import { api } from "../../lib/api-client";
import { initials, formatRelative } from "../../lib/format";
import type { NotificationRow } from "../../lib/types";
import { Link } from "react-router-dom";

export function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { user, logout, hasPermission } = useAuth();
  // Same permissions App.tsx uses to gate the /administration route itself.
  const canAdminister = hasPermission(PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.BANKS_MANAGE);
  const { data: subscription } = useSubscription();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<NotificationRow[]>("/notifications"),
    refetchInterval: 60_000,
  });
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-raised px-4 md:px-6">
      <button onClick={onMenu} className="rounded-md p-2 text-ink-secondary hover:bg-plane md:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={onSearch}
        className="hidden items-center gap-2.5 rounded-lg border border-border bg-plane px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-brand/40 hover:text-ink-secondary md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Jump to...</span>
        <kbd className="ml-6 rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">⌘K</kbd>
      </button>

      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen((v) => !v)} className="relative rounded-md p-2 text-ink-secondary hover:bg-plane">
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && <span className="pulse-dot absolute right-1 top-1 h-2 w-2 rounded-full bg-status-critical ring-2 ring-surface-raised" />}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-40 mt-2 w-80 rounded-card border border-border bg-surface-raised shadow-popover animate-slide-up">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-[13px] font-semibold text-ink">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-brand hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-ink-muted">No notifications yet</p>
                ) : (
                  notifications.slice(0, 12).map((n) => (
                    <div key={n.id} className={clsx("border-b border-border px-4 py-3 last:border-0", !n.isRead && "bg-brand-soft/40")}>
                      <p className="text-[13px] font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-secondary">{n.message}</p>
                      <p className="mt-1 text-[11px] text-ink-muted">{formatRelative(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-plane">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">{initials(user?.name ?? "?")}</div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-[13px] font-medium text-ink">{user?.name}</p>
              <p className="text-[11px] text-ink-muted">{user?.roles[0]}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 z-40 mt-2 w-56 rounded-card border border-border bg-surface-raised py-1.5 shadow-popover animate-slide-up">
              <div className="border-b border-border px-3.5 py-2.5">
                <p className="text-[13px] font-medium text-ink">{user?.name}</p>
                <p className="text-xs text-ink-muted">{user?.email}</p>
              </div>
              <div className="px-3.5 py-2 text-xs text-ink-muted">
                <UserIcon className="mr-1.5 inline h-3.5 w-3.5" />
                {user?.jobTitle ?? user?.roles.join(", ")}
              </div>
              {subscription && (
                <div className="border-b border-border px-3.5 py-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-ink-muted">Organisation</p>
                  <p className="mt-0.5 text-[13px] font-medium text-ink">{subscription.tenant.name}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Plan: <span className="font-medium text-ink-secondary">{subscription.subscription.plan.name}</span>
                  </p>
                </div>
              )}
              <Link to="/account" className="block px-3.5 py-2 text-[13px] text-ink-secondary hover:bg-plane hover:text-ink" onClick={() => setUserMenuOpen(false)}>
                My Account
              </Link>
              {canAdminister && (
                <Link to="/administration" className="block px-3.5 py-2 text-[13px] text-ink-secondary hover:bg-plane hover:text-ink" onClick={() => setUserMenuOpen(false)}>
                  Administration
                </Link>
              )}
              <button onClick={logout} className="flex w-full items-center gap-2 px-3.5 py-2 text-[13px] text-status-critical hover:bg-status-critical-soft">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
