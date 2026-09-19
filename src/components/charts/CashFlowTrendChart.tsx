import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatCompact, formatDate } from "../../lib/format";

export function CashFlowTrendChart({ data }: { data: { date: string; closingBalance: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--gridline)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v, { day: "2-digit", month: "short" })}
          tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<ChartTooltip labelFormatter={(l) => formatDate(l)} />} cursor={{ stroke: "var(--baseline)", strokeDasharray: 3 }} />
        <Area type="monotone" dataKey="closingBalance" name="Cash Balance" stroke="var(--series-1)" strokeWidth={2} fill="url(#trendFill)" activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
