import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatCompact } from "../../lib/format";
import { t } from "../../i18n";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

export function BreakdownBarChart({ data, currency = "MYR" }: { data: { key: string; total: number }[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="var(--gridline)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="key" width={90} tick={{ fontSize: 12, fill: "var(--ink-secondary)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "var(--plane)" }} />
        <Bar dataKey="total" name={t("Balance")} radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES[i % SERIES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
