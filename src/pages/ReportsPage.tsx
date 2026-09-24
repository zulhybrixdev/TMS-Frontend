import { useState } from "react";
import { toast } from "sonner";
import { Download, FileBarChart, FileText, Landmark, Scale, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, TrendingUp, Scroll, CalendarDays } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { api, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { todayLocal } from "../lib/format";
import { CustomReportsSection } from "../components/reports/CustomReportsSection";
import { t, tk } from "../i18n";

const REPORTS = [
  { key: "cash-position", title: tk("Cash Position"), description: tk("Current balance, available cash, shortfall/excess per account."), icon: Scale, dated: false },
  { key: "bank-balances", title: tk("Bank Balances"), description: tk("All company bank accounts and their current balances."), icon: Landmark, dated: false },
  { key: "payments", title: tk("Payments"), description: tk("Payment requests and their approval/processing status."), icon: ArrowUpRight, dated: true },
  { key: "incoming", title: tk("Incoming Transactions"), description: tk("Expected and received incoming payments."), icon: ArrowDownLeft, dated: true },
  { key: "transfers", title: tk("Inter-Bank Transfers"), description: tk("Transfers between company accounts."), icon: ArrowLeftRight, dated: true },
  { key: "daily-movements", title: tk("Daily Bank Movements & Balances"), description: tk("Every account, every day: opening, collections, BA drawdown/settlement, payments, transfers, closing balance (max 93 days)."), icon: CalendarDays, dated: true },
  { key: "banker-acceptances", title: tk("Banker Acceptances"), description: tk("BA register: face, proceeds credited, cost, maturity and settlement."), icon: Scroll, dated: false },
  { key: "forecast", title: tk("Cash Forecast"), description: tk("Projected inflows, outflows, and available balance."), icon: TrendingUp, dated: true },
];

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission(PERMISSIONS.REPORTS_EXPORT);
  const [from, setFrom] = useState(todayLocal(-30));
  const [to, setTo] = useState(todayLocal());
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (key: string, dated: boolean, format: "csv" | "xlsx") => {
    setDownloading(`${key}.${format}`);
    try {
      const qs = dated ? `?format=${format}&from=${from}&to=${to}` : `?format=${format}`;
      await api.downloadCsv(`/reports/${key}${qs}`, `${key}.${format}`);
      toast.success(t("Report downloaded"));
    } catch (err) {
      toast.error(t("Export failed"), { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <PageHeader title={t("Reports")} description={t("Export treasury reports as CSV or a real formatted Excel (.xlsx) file, for audit or board reporting.")} />

      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="from">{t("From")}</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label htmlFor="to">{t("To")}</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <p className="pb-2 text-xs text-ink-muted">{t("Applies to date-ranged reports below.")}</p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.key}>
            <CardBody className="flex flex-col gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <report.icon className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t(report.title)}</p>
                <p className="mt-1 text-[13px] text-ink-secondary">{t(report.description)}</p>
              </div>
              <div className="mt-1 flex gap-2">
                <Button variant="outline" size="sm" loading={downloading === `${report.key}.csv`} disabled={!canExport} onClick={() => download(report.key, report.dated, "csv")}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" loading={downloading === `${report.key}.xlsx`} disabled={!canExport} onClick={() => download(report.key, report.dated, "xlsx")}>
                  <Download className="h-3.5 w-3.5" /> {t("Excel")}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {!canExport && (
        <Card className="mt-5">
          <CardBody className="flex items-center gap-3 text-[13px] text-ink-secondary">
            <FileBarChart className="h-4 w-4 text-ink-muted" />
            {t("Your role has view-only access to reports. Contact a Finance Manager or Admin for export access.")}
          </CardBody>
        </Card>
      )}

      <CustomReportsSection />

      <Card className="mt-5 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-ink-muted" /> {t("PDF Reports")}
          </CardTitle>
        </CardHeader>
        <CardBody className="text-[13px] text-ink-secondary">
          {t("For a print-ready or PDF copy of any report, export the CSV and open it, or use your browser's Print → Save as PDF on any table view in the app.")}
        </CardBody>
      </Card>
    </>
  );
}
