import { ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";

// Lightweight count-up so headline KPI numbers feel alive without being gimmicky.
function useCountUp(value: number, durationMs = 700) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf: number;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const progress = Math.min(1, (t - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

// Minimal inline sparkline - no charting-library overhead for a 28px trend hint.
function Sparkline({ points, tone }: { points: number[]; tone: "default" | "critical" | "good" }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - ((p - min) / range) * h).toFixed(1)}`).join(" ");
  const stroke = tone === "critical" ? "var(--status-critical)" : tone === "good" ? "var(--status-good)" : "var(--brand)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none">
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.9 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon?: LucideIcon;
  delta?: { value: number; label: string; positiveIsGood?: boolean };
  tone?: "default" | "critical" | "good";
  footer?: ReactNode;
  spark?: number[];
}

export function StatCard({ label, value, format = (n) => n.toLocaleString(), icon: Icon, delta, tone = "default", footer, spark }: StatCardProps) {
  const animated = useCountUp(value);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={clsx("rounded-card border bg-surface-raised p-5 shadow-card transition-shadow hover:shadow-popover", tone === "critical" ? "border-status-critical/30" : "border-border")}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink-secondary">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-ink-muted" />}
      </div>
      <p className={clsx("font-mono mt-2 text-[25px] font-medium tracking-tight", tone === "critical" ? "text-status-critical" : "text-ink")}>{format(animated)}</p>
      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {delta.value >= 0 ? (
            <ArrowUpRight className={clsx("h-3.5 w-3.5", delta.positiveIsGood === false ? "text-status-critical" : "text-status-good")} />
          ) : (
            <ArrowDownRight className={clsx("h-3.5 w-3.5", delta.positiveIsGood === false ? "text-status-good" : "text-status-critical")} />
          )}
          <span className={clsx("font-mono font-medium", delta.value >= 0 === (delta.positiveIsGood !== false) ? "text-status-good" : "text-status-critical")}>
            {delta.value >= 0 ? "+" : ""}
            {delta.value.toLocaleString()}
          </span>
          <span className="text-ink-muted">{delta.label}</span>
        </div>
      )}
      {spark && <div className="mt-3">
        <Sparkline points={spark} tone={tone} />
      </div>}
      {footer && <div className="mt-2">{footer}</div>}
    </motion.div>
  );
}
