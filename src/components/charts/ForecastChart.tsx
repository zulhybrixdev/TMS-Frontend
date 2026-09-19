import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { formatCompact, formatDate, formatMoney } from "../../lib/format";
import type { ForecastProjectionPoint } from "../../lib/types";

export function ForecastChart({ data, currency = "MYR" }: { data: ForecastProjectionPoint[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--gridline)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(v) => formatDate(v, { day: "2-digit", month: "short" })} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} minTickGap={20} />
        <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} width={56} />
        <Tooltip
          content={({ active, label, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            return (
              <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs shadow-popover">
                <p className="mb-1.5 font-medium text-ink">{formatDate(String(label))}</p>
                <div className="space-y-1">
                  {payload.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                      <span className="text-ink-secondary">{p.name}:</span>
                      <span className="font-medium tabular-nums text-ink">{formatMoney(Number(p.value), currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
          cursor={{ fill: "var(--plane)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-secondary)" }} />
        <Bar dataKey="inflow" name="Inflow" fill="var(--series-3)" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Bar dataKey="outflow" name="Outflow" fill="var(--series-2)" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Line type="monotone" dataKey="projectedBalance" name="Projected Balance" stroke="var(--series-1)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
