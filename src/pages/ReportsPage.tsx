import { useState } from "react";
import { toast } from "sonner";
import { Download, FileBarChart, FileText, Landmark, Scale, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { api, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { CustomReportsSection } from "../components/reports/CustomReportsSection";

const REPORTS = [
  { key: "cash-position", title: "Cash Position", description: "Current balance, available cash, shortfall/excess per account.", icon: Scale, dated: false },
  { key: "bank-balances", title: "Bank Balances", description: "All company bank accounts and their current balances.", icon: Landmark, dated: false },
  { key: "payments", title: "Payments", description: "Payment requests and their approval/processing status.", icon: ArrowUpRight, dated: true },
  { key: "incoming", title: "Incoming Transactions", description: "Expected and received incoming payments.", icon: ArrowDownLeft, dated: true },
  { key: "transfers", title: "Inter-Bank Transfers", description: "Transfers between company accounts.", icon: ArrowLeftRight, dated: true },
  { key: "forecast", title: "Cash Forecast", description: "Projected inflows, outflows, and balance.", icon: TrendingUp, dated: true },
];

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission(PERMISSIONS.REPORTS_EXPORT);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (key: string, dated: boolean, format: "csv" | "xlsx") => {
    setDownloading(`${key}.${format}`);
    try {
      const qs = dated ? `?format=${format}&from=${from}&to=${to}` : `?format=${format}`;
      await api.downloadCsv(`/reports/${key}${qs}`, `${key}.${format}`);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error("Export failed", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <PageHeader title="Reports" description="Export treasury reports as CSV or a real formatted Excel (.xlsx) file, for audit or board reporting." />

      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <p className="pb-2 text-xs text-ink-muted">Applies to date-ranged reports below.</p>
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
                <p className="text-[14px] font-semibold text-ink">{report.title}</p>
                <p className="mt-1 text-[13px] text-ink-secondary">{report.description}</p>
              </div>
              <div className="mt-1 flex gap-2">
                <Button variant="outline" size="sm" loading={downloading === `${report.key}.csv`} disabled={!canExport} onClick={() => download(report.key, report.dated, "csv")}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" loading={downloading === `${report.key}.xlsx`} disabled={!canExport} onClick={() => download(report.key, report.dated, "xlsx")}>
                  <Download className="h-3.5 w-3.5" /> Excel
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
            Your role has view-only access to reports. Contact a Finance Manager or Admin for export access.
          </CardBody>
        </Card>
      )}

      <CustomReportsSection />

      <Card className="mt-5 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-ink-muted" /> PDF Reports
          </CardTitle>
        </CardHeader>
        <CardBody className="text-[13px] text-ink-secondary">
          For a print-ready or PDF copy of any report, export the CSV and open it, or use your browser's Print → Save as PDF on any table view in the app.
        </CardBody>
      </Card>
    </>
  );
}
