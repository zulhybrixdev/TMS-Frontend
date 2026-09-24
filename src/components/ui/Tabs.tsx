import { t } from "../../i18n";
import clsx from "clsx";

interface TabsProps {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            "relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors",
            active === tab.key ? "text-brand" : "text-ink-secondary hover:text-ink"
          )}
        >
          {t(tab.label)}
          {tab.count !== undefined && (
            <span className={clsx("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", active === tab.key ? "bg-brand-soft text-brand" : "bg-plane text-ink-muted")}>{tab.count}</span>
          )}
          {active === tab.key && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
        </button>
      ))}
    </div>
  );
}
