// Formatting helpers used across every screen so numbers/dates/status labels
// stay visually consistent.

export function formatMoney(amount: number, currency = "MYR"): string {
  try {
    return new Intl.NumberFormat("en-MY", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-MY", { maximumFractionDigits: 2 })}`;
  }
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-MY", { maximumFractionDigits: 2 });
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-MY", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-MY", opts);
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-MY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMs = d.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Today's calendar date in the *browser's* timezone as YYYY-MM-DD. Not
// `new Date().toISOString().slice(0, 10)`, which is the UTC date and reads as
// "yesterday" for anyone east of UTC before 8am (Malaysia is UTC+8).
export function todayLocal(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A DATE column comes back as "2026-09-24T00:00:00.000Z" - the calendar date
// is the first ten characters, whatever timezone the browser is in.
export function dateOnly(value: string | Date): string {
  return (typeof value === "string" ? value : value.toISOString()).slice(0, 10);
}
