import { formatMoney } from "../../lib/format";

interface Props {
  active?: boolean;
  label?: string;
  payload?: { name: string; value: number; color?: string }[];
  currency?: string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({ active, label, payload, currency = "MYR", labelFormatter }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs shadow-popover">
      {label && <p className="mb-1.5 font-medium text-ink">{labelFormatter ? labelFormatter(label) : label}</p>}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            {p.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />}
            <span className="text-ink-secondary">{p.name}:</span>
            <span className="font-medium tabular-nums text-ink">{formatMoney(p.value, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
