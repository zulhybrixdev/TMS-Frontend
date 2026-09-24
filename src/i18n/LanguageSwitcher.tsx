import clsx from "clsx";
import { Languages } from "lucide-react";
import { t, useLanguage, type Lang } from ".";

const OPTIONS: { key: Lang; short: string; full: string }[] = [
  { key: "en", short: "EN", full: "English" },
  { key: "ms", short: "BM", full: "Bahasa Malaysia" },
];

// English / Bahasa Malaysia switch, shown wherever the user might want it (top
// bar, login, registration, legal and help pages). `tone="dark"` is for use on
// the dark sidebar/hero surfaces.
export function LanguageSwitcher({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const { lang, setLang } = useLanguage();
  return (
    <div role="group" aria-label={t("Language")} className={clsx("inline-flex items-center gap-1.5", className)}>
      <Languages className={clsx("h-4 w-4", tone === "dark" ? "text-chrome-muted" : "text-ink-muted")} aria-hidden />
      <div className={clsx("inline-flex rounded-lg border p-0.5", tone === "dark" ? "border-chrome-border" : "border-border bg-surface-raised")}>
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setLang(o.key)}
            aria-pressed={lang === o.key}
            aria-label={o.full}
            title={o.full}
            lang={o.key}
            className={clsx(
              "rounded-md px-2 py-1 text-[12px] font-semibold leading-none transition-colors",
              lang === o.key ? "bg-brand text-white" : tone === "dark" ? "text-chrome-muted hover:text-chrome-ink" : "text-ink-secondary hover:text-ink"
            )}
          >
            {o.short}
          </button>
        ))}
      </div>
    </div>
  );
}
