import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import clsx from "clsx";
import { ChevronDown, KeyRound, Lock, LogOut, Megaphone, ServerCog, ShieldAlert, Users2 } from "lucide-react";
import { usePlatformAuth } from "../../lib/platform-auth-context";
import { platformApiFor } from "../../lib/platform-api-client";
import type { Announcement } from "../../lib/types";
import type { PlatformConfig } from "../../lib/platform-types";
import { initials } from "../../lib/format";

// Short, colour-coded environment marker - readable on a phone where the full
// chips ("UAT / POC", "Production") don't fit.
const ENV_DOT: Record<string, string> = { dev: "bg-sky-400", uat: "bg-amber-400", production: "bg-rose-400" };

const TABS = [
  { to: "/platform", label: "Tenants", icon: Users2, end: true },
  { to: "/platform/announcements", label: "Announcements", icon: Megaphone, end: false },
  { to: "/platform/environments", label: "Environments", icon: ServerCog, end: false },
  { to: "/platform/sso", label: "Identity / SSO", icon: KeyRound, end: false },
] as const;

// The frame around every Platform Console screen: a compact header (brand, an
// account menu that carries the environments and Sign out), and a tab bar that
// scrolls sideways on small screens. Each tab is its own URL, so refresh and
// the back button keep you where you were.
export default function PlatformLayout() {
  const { connected, logout } = usePlatformAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Same query keys as the tabs themselves, so these are shared, not extra requests.
  const announcementQs = useQueries({
    queries: connected.map((c) => ({ queryKey: ["platform", "announcements", c.env.key], queryFn: () => platformApiFor(c.env).get<(Announcement & { status: string })[]>("/announcements"), refetchInterval: 30_000 })),
  });
  const configQs = useQueries({
    queries: connected.map((c) => ({ queryKey: ["platform", "config", c.env.key], queryFn: () => platformApiFor(c.env).get<PlatformConfig>("/config") })),
  });
  const lockedEnvs = announcementQs.reduce((n, q) => n + (q.data?.some((a) => a.locked) ? 1 : 0), 0);
  const liveAnnouncements = announcementQs.reduce((n, q) => n + (q.data?.filter((a) => a.status === "LIVE").length ?? 0), 0);
  const registrationClosed = configQs.some((q) => q.data?.registrationEnabled === false);

  useEffect(() => {
    const onDown = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const admin = connected[0]?.admin;
  const indicator = (to: string) => {
    if (to === "/platform/announcements" && lockedEnvs > 0) return <span title="The system is locked for users" className="inline-flex items-center gap-0.5 rounded-full bg-status-critical px-1.5 text-[10.5px] font-semibold leading-4 text-white"><Lock className="h-2.5 w-2.5" />{lockedEnvs}</span>;
    if (to === "/platform/announcements" && liveAnnouncements > 0) return <span className="rounded-full bg-status-good px-1.5 text-[10.5px] font-semibold leading-4 text-white">{liveAnnouncements}</span>;
    if (to === "/platform/environments" && registrationClosed) return <span className="h-2 w-2 rounded-full bg-status-warning" title="Registration is closed on at least one environment" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-plane">
      <div className="sticky top-0 z-30">
        <header className="ledger-grid flex h-14 items-center justify-between gap-3 border-b border-chrome-border bg-chrome px-3 sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white ring-1 ring-white/15">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-[13.5px] font-semibold text-chrome-ink">Platform Console</p>
              <p className="hidden text-[10.5px] uppercase tracking-wider text-chrome-muted sm:block">Cross-tenant oversight</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Connected environments: dots on a phone, labelled chips from sm up. */}
            <div className="flex items-center gap-1.5" aria-label="Connected environments">
              {connected.map((c) => (
                <span key={c.env.key} title={c.env.label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-chrome-muted">
                  <span className={clsx("h-2 w-2 rounded-full", ENV_DOT[c.env.key] ?? "bg-white/40")} />
                  <span className="hidden sm:inline">{c.env.label}</span>
                </span>
              ))}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-chrome-muted hover:bg-white/5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">{initials(admin?.name ?? "?")}</span>
                <span className="hidden max-w-[10rem] truncate text-[13px] md:block">{admin?.name}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-card border border-border bg-surface-raised py-1.5 shadow-popover">
                  <div className="border-b border-border px-3.5 py-2.5">
                    <p className="text-[13px] font-medium text-ink">{admin?.name}</p>
                    <p className="truncate text-xs text-ink-muted">{admin?.email}</p>
                  </div>
                  <div className="border-b border-border px-3.5 py-2.5">
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Connected environments</p>
                    <ul className="space-y-1">
                      {connected.map((c) => (
                        <li key={c.env.key} className="flex items-center gap-2 text-[13px] text-ink-secondary">
                          <span className={clsx("h-2 w-2 rounded-full", ENV_DOT[c.env.key] ?? "bg-ink-muted")} /> {c.env.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13px] text-ink-secondary hover:bg-plane hover:text-ink">
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <nav aria-label="Platform Console sections" className="border-b border-border bg-surface-raised">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  clsx(
                    "relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3 text-[13.5px] font-medium transition-colors",
                    isActive ? "text-brand" : "text-ink-secondary hover:text-ink"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <tab.icon className="h-4 w-4" aria-hidden />
                    {tab.label}
                    {indicator(tab.to)}
                    {isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
