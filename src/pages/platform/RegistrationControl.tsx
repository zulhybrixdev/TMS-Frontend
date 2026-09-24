import { useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Unlock, UserPlus } from "lucide-react";
import type { ConnectedEnvironment } from "../../lib/platform-auth-context";
import { platformApiFor, ApiError } from "../../lib/platform-api-client";
import type { PlatformConfig } from "../../lib/platform-types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/Dialog";

// Open / close self-service registration, one switch per environment (dev, uat,
// production each have their own database and so their own setting). Closing it
// stops new individuals and companies from signing up - handy while doing
// housekeeping - and leaves existing tenants and users untouched.
export function RegistrationControl({ connected }: { connected: ConnectedEnvironment[] }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<ConnectedEnvironment | null>(null);
  const [saving, setSaving] = useState(false);

  const results = useQueries({
    queries: connected.map((c) => ({
      queryKey: ["platform", "config", c.env.key],
      queryFn: () => platformApiFor(c.env).get<PlatformConfig>("/config"),
    })),
  });
  const statusOf = (i: number) => results[i]?.data?.registrationEnabled;
  const anyClosed = connected.some((_, i) => statusOf(i) === false);

  const apply = async () => {
    if (!pending) return;
    const index = connected.findIndex((c) => c.env.key === pending.env.key);
    const open = statusOf(index) === true; // currently open -> close it
    setSaving(true);
    try {
      const result = await platformApiFor(pending.env).post<PlatformConfig>("/config/registration", { enabled: !open });
      qc.setQueryData(["platform", "config", pending.env.key], result);
      toast.success(result.registrationEnabled ? `Registration is open on ${pending.env.label}` : `Registration is closed on ${pending.env.label}`);
    } catch (err) {
      toast.error("Could not change registration", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  const pendingIndex = pending ? connected.findIndex((c) => c.env.key === pending.env.key) : -1;
  const closing = pendingIndex >= 0 && statusOf(pendingIndex) === true;

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-ink-muted" /> Self-service registration
            </span>
          </CardTitle>
          {anyClosed && <Badge tone="warning">Closed on at least one environment</Badge>}
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-[13px] text-ink-secondary">
            Controls whether new individuals and companies can sign up on each environment. Closing it hides the sign-up link and refuses new registrations; existing tenants and their users are not affected. Use it while doing housekeeping.
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {connected.map((c, i) => {
              const open = statusOf(i);
              return (
                <li key={c.env.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-ink">{c.env.label}</span>
                    {results[i]?.isLoading ? (
                      <Badge tone="neutral">Checking…</Badge>
                    ) : results[i]?.isError ? (
                      <Badge tone="neutral">Unavailable</Badge>
                    ) : open === undefined ? (
                      <Badge tone="warning">Not supported yet - update this environment</Badge>
                    ) : open ? (
                      <Badge tone="good" dot>
                        Open
                      </Badge>
                    ) : (
                      <Badge tone="critical" dot>
                        Closed
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" variant="outline" disabled={open === undefined} onClick={() => setPending(c)}>
                    {open === false ? (
                      <>
                        <Unlock className="h-3.5 w-3.5" /> Open registration
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" /> Close registration
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={apply}
        loading={saving}
        tone={closing ? "danger" : "primary"}
        title={closing ? `Close registration on ${pending?.env.label}?` : `Open registration on ${pending?.env.label}?`}
        description={
          closing
            ? "Nobody will be able to create a new individual or company account there until you open it again. Existing tenants and users are not affected."
            : "New individuals and companies will be able to register there again, straight away."
        }
        confirmLabel={closing ? "Close registration" : "Open registration"}
      />
    </>
  );
}
