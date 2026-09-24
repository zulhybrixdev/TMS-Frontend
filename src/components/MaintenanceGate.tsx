import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { AlertOctagon, Landmark, RefreshCw, Wrench } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { formatDateTime, formatRelative } from "../lib/format";
import { getLang, t, tk } from "../i18n";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { Button } from "./ui/Button";
import { LegalLinks } from "./LegalLinks";
import { MAINTENANCE_EVENT } from "../lib/maintenance-events";
import type { Announcement } from "../lib/types";

// The full-screen "system unavailable" notice, shown while a maintenance / downtime
// announcement with "lock the system" is in progress. The server enforces the lock
// too (every tenant request is refused with 503 MAINTENANCE_MODE - see
// backend common/middleware/maintenance.middleware.ts); this is what people see
// instead of a broken app, and it opens by itself when the lock lifts.
//
// The app underneath is kept mounted (just covered and made inert), so on
// release people are exactly where they were - no reload, nothing re-entered.

// The API client raises MAINTENANCE_EVENT whenever the server answers 503 MAINTENANCE_MODE, so a lock that started after the last poll shows immediately.

const HEADING = { MAINTENANCE: tk("Maintenance in progress"), DOWNTIME: tk("System downtime in progress"), INFO: tk("Notice") } as const;

// Presentation only - also used as the preview in Platform Console (`inline`).
export function MaintenanceView({
  item,
  lang = getLang(),
  inline = false,
  checking = false,
  onCheck,
}: {
  item: Announcement;
  lang?: "en" | "ms";
  inline?: boolean;
  checking?: boolean;
  onCheck?: () => void;
}) {
  const title = lang === "ms" && item.titleMs ? item.titleMs : item.titleEn;
  const message = lang === "ms" && item.messageMs ? item.messageMs : item.messageEn;
  const back = item.lockedUntil ?? item.affectedTo ?? item.endsAt;
  const Icon = item.type === "DOWNTIME" ? AlertOctagon : Wrench;
  const tone = item.type === "DOWNTIME" ? "bg-status-critical-soft text-status-critical" : "bg-status-warning-soft text-status-warning";

  return (
    <div
      role="alertdialog"
      aria-modal={!inline}
      aria-labelledby="maintenance-title"
      className={clsx("flex flex-col items-center justify-center gap-6 bg-plane px-5 py-10", inline ? "min-h-[26rem]" : "fixed inset-0 z-[100] overflow-y-auto")}
    >
      {!inline && <LanguageSwitcher className="absolute right-4 top-4" />}
      <div className="w-full max-w-lg rounded-card border border-border bg-surface-raised p-6 text-center shadow-card sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
            <Landmark className="h-[18px] w-[18px]" />
          </div>
          <span className="font-display text-[15px] font-semibold text-ink">{t("Treasury System")}</span>
        </div>

        <div className={clsx("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full", tone)}>
          <Icon className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t(HEADING[item.type])}</p>
        <h1 id="maintenance-title" className="mt-1.5 font-display text-[22px] font-semibold text-ink">{title}</h1>
        {/* Plain text, never HTML - an announcement can't inject markup. */}
        <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-secondary">{message}</p>

        <div className="mt-5 rounded-lg border border-border bg-plane px-4 py-3 text-[13px] text-ink">
          <p className="font-medium">{t("Expected back around {time} ({relative}).", { time: formatDateTime(back), relative: formatRelative(back) })}</p>
          <p className="mt-1 text-[12px] text-ink-secondary">{t("If the work takes longer, this page stays until it is finished.")}</p>
        </div>

        <p className="mt-4 text-[12.5px] text-ink-secondary">{t("You don't need to reload. This page opens by itself as soon as the system is back.")}</p>
        <Button className="mt-4" variant="outline" onClick={onCheck} loading={checking} disabled={!onCheck}>
          <RefreshCw className="h-4 w-4" /> {t("Check again")}
        </Button>
      </div>
      {!inline && <LegalLinks />}
    </div>
  );
}

export function MaintenanceGate() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const qc = useQueryClient();

  // Same query as the announcement banner; polls faster while locked so the app opens promptly on release.
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: () => api.get<Announcement[]>("/announcements/active"),
    refetchInterval: (q) => ((q.state.data as Announcement[] | undefined)?.some((a) => a.locked) ? 15_000 : 60_000),
    staleTime: 10_000,
    retry: false,
  });

  useEffect(() => {
    const onLock = () => qc.invalidateQueries({ queryKey: ["announcements", "active"] });
    window.addEventListener(MAINTENANCE_EVENT, onLock);
    return () => window.removeEventListener(MAINTENANCE_EVENT, onLock);
  }, [qc]);

  // Platform Console is how staff end the lock, and a "view as tenant" session is
  // staff too - the server lets both through, so the notice must not cover them.
  const exempt = pathname.startsWith("/platform") || pathname.startsWith("/impersonate-entry") || !!user?.impersonatedByPlatformAdminId;
  const lock = exempt ? undefined : data?.find((a) => a.locked);

  // Lock lifted: everything that failed or went stale meanwhile is fetched again, so the app is current.
  const wasLocked = useRef(false);
  useEffect(() => {
    if (lock) {
      wasLocked.current = true;
    } else if (wasLocked.current && data) {
      wasLocked.current = false;
      qc.invalidateQueries();
      toast.success(t("The system is back. You can carry on."));
    }
  }, [lock, data, qc]);

  // Behind the notice nothing can be reached by keyboard or assistive tech.
  const [root] = useState(() => document.getElementById("root"));
  useEffect(() => {
    if (!lock || !root) return;
    root.setAttribute("inert", "");
    return () => root.removeAttribute("inert");
  }, [lock, root]);

  const [checking, setChecking] = useState(false);
  if (!lock) return null;

  return createPortal(
    <MaintenanceView
      item={lock}
      checking={checking || isFetching}
      onCheck={async () => {
        setChecking(true);
        await refetch();
        setChecking(false);
      }}
    />,
    document.body
  );
}
