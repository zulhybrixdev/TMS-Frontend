import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import type { ConnectedEnvironment } from "../../lib/platform-auth-context";
import { platformApiFor, ApiError } from "../../lib/platform-api-client";
import type { PlatformConfig } from "../../lib/platform-types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/Dialog";

// Which build the UAT site serves live: the POC build (/poc) or the full app.
// Only meaningful for UAT - production never mounts /poc, so it has no switch.
export function LiveModeControl({ connected }: { connected: ConnectedEnvironment[] }) {
  const qc = useQueryClient();
  const uat = connected.find((c) => c.env.key === "uat");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: config } = useQuery({ queryKey: ["platform", "config", "uat"], queryFn: () => platformApiFor(uat!.env).get<PlatformConfig>("/config"), enabled: !!uat });
  if (!uat) return null;

  const toggle = async () => {
    setSaving(true);
    try {
      const result = await platformApiFor(uat.env).post<PlatformConfig>("/config", { pocMode: !config?.pocMode });
      qc.setQueryData(["platform", "config", "uat"], result);
      toast.success(result.pocMode ? "UAT is now live in POC mode" : "UAT is now live in full mode");
    } catch (err) {
      toast.error("Could not switch mode", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-ink-muted" /> UAT live site
            </span>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-[13px] text-ink-secondary">Switch what visitors to the UAT / POC environment are served: the POC build or the full app. It takes effect immediately. Production is unaffected.</p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-medium text-ink">UAT / POC</span>
              {config ? <Badge tone={config.pocMode ? "warning" : "good"} dot>{config.pocMode ? "Serving POC" : "Serving full app"}</Badge> : <Badge tone="neutral">Checking…</Badge>}
            </div>
            <Button size="sm" variant="outline" disabled={!config} onClick={() => setConfirming(true)}>
              {config?.pocMode ? "Switch to full app" : "Switch to POC"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={toggle}
        loading={saving}
        title={config?.pocMode ? "Switch UAT's live site to the full app?" : "Switch UAT's live site to POC mode?"}
        description={
          config?.pocMode
            ? "Every visitor to the UAT/POC environment will be redirected away from /poc to the full app, immediately. Production is unaffected."
            : "Every visitor to the UAT/POC environment will be redirected to /poc, immediately. Production is unaffected - it never serves /poc at all."
        }
        confirmLabel="Switch"
      />
    </>
  );
}
