import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { AlertOctagon, Info, Wrench, X } from "lucide-react";
import { api } from "../lib/api-client";
import { formatDateTime, formatRelative } from "../lib/format";
import { getLang, t, tk } from "../i18n";
import type { Announcement, AnnouncementType } from "../lib/types";

const STYLE: Record<AnnouncementType, { box: string; icon: typeof Info; label: string }> = {
  INFO: { box: "border-brand/25 bg-brand-soft text-brand", icon: Info, label: tk("Notice") },
  MAINTENANCE: { box: "border-status-warning/30 bg-status-warning-soft text-status-warning", icon: Wrench, label: tk("Scheduled maintenance") },
  DOWNTIME: { box: "border-status-critical/30 bg-status-critical-soft text-status-critical", icon: AlertOctagon, label: tk("Planned downtime") },
};

const DISMISSED_KEY = "tms.dismissedAnnouncements";
function readDismissed(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// One announcement, presentation only - used by the live banner and by the
// preview in Platform Console. `lang` picks the text language; a missing
// Malay title/message falls back to English.
export function AnnouncementView({ item, lang = getLang(), onDismiss }: { item: Announcement; lang?: "en" | "ms"; onDismiss?: () => void }) {
  const style = STYLE[item.type];
  const Icon = style.icon;
  const title = lang === "ms" && item.titleMs ? item.titleMs : item.titleEn;
  const message = lang === "ms" && item.messageMs ? item.messageMs : item.messageEn;
  const from = item.affectedFrom ? new Date(item.affectedFrom) : null;
  const upcoming = from && from.getTime() > Date.now();
  return (
    <div role={item.type === "DOWNTIME" ? "alert" : "status"} className={clsx("flex items-start gap-3 border-b px-4 py-2.5 text-[13px] md:px-6", style.box)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-ink">
        <p>
          <span className="font-semibold">{title}</span>
          <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide">{t(style.label)}</span>
        </p>
        {/* Plain text, never HTML - an announcement can't inject markup. */}
        <p className="mt-0.5 whitespace-pre-line text-ink-secondary">{message}</p>
        {item.affectedFrom && item.affectedTo && (
          <p className="mt-1 text-[12px] font-medium text-ink">
            {t("Affected: {from} – {to}", { from: formatDateTime(item.affectedFrom), to: formatDateTime(item.affectedTo) })}
            {upcoming && <span className="ml-2 font-normal text-ink-secondary">({formatRelative(item.affectedFrom)})</span>}
          </p>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label={t("Dismiss")} title={t("Dismiss")} className="rounded-md p-1 hover:bg-black/5">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// The live announcements for this environment, at the top of the screen - on the
// sign-in and registration pages too, so people see a downtime notice before they
// try to sign in. Persistent ones stay until they end; the rest can be dismissed
// (remembered on this device). Refreshed every minute, so a new or ended
// announcement reaches an open page without a reload. If the request fails,
// nothing is shown.
export function AnnouncementBanner() {
  const { data } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: () => api.get<Announcement[]>("/announcements/active"),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);

  const visible = useMemo(() => (data ?? []).filter((a) => a.persistent || !dismissed.includes(a.id)), [data, dismissed]);
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    // Keep only ids that are still live, so the list can't grow forever.
    const next = [...new Set([...dismissed.filter((d) => data?.some((a) => a.id === d)), id])];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      /* dismissal just isn't remembered */
    }
  };

  return (
    <div>
      {visible.map((a) => (
        <AnnouncementView key={a.id} item={a} onDismiss={a.persistent ? undefined : () => dismiss(a.id)} />
      ))}
    </div>
  );
}
