import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { api, ApiError } from "../lib/api-client";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { Dialog } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";
import { MfaSetupDialog, RecoveryCodesDialog } from "../components/MfaSetup";
import { t } from "../i18n";

interface MfaStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{t("My Account")}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {user?.name} · {user?.email}
        </p>
      </div>

      <ChangePasswordCard />
      <TwoFactorCard />
    </div>
  );
}

function ChangePasswordCard() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error(t("New password and confirmation don't match"));
      return;
    }
    try {
      await api.post("/auth/change-password", { currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success(t("Password changed"));
      reset();
    } catch (err) {
      toast.error(t("Could not change password"), { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Password")}</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" required>
              {t("Current password")}
            </Label>
            <Input id="currentPassword" type="password" required autoComplete="current-password" {...register("currentPassword")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="newPassword" required>
                {t("New password")}
              </Label>
              <Input id="newPassword" type="password" required minLength={8} autoComplete="new-password" {...register("newPassword")} />
            </div>
            <div>
              <Label htmlFor="confirmPassword" required>
                {t("Confirm new password")}
              </Label>
              <Input id="confirmPassword" type="password" required minLength={8} autoComplete="new-password" {...register("confirmPassword")} />
            </div>
          </div>
          <Button type="submit" loading={isSubmitting}>
            {t("Change Password")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function TwoFactorCard() {
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery({ queryKey: ["mfa-status"], queryFn: () => api.get<MfaStatus>("/auth/mfa/status") });
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["mfa-status"] });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Two-Factor Authentication")}</CardTitle>
        {status?.enabled ? (
          <Badge tone="good" dot>
            {t("Enabled")}
          </Badge>
        ) : (
          <Badge tone="neutral">{t("Off")}</Badge>
        )}
      </CardHeader>
      <CardBody>
        {status?.enabled ? (
          <div className="space-y-3">
            <p className="text-[13px] text-ink-secondary">
              {t("Signing in requires a code from your authenticator app, in addition to your password.")}{" "}
              {status.recoveryCodesRemaining === 1 ? t("1 unused recovery code remaining.") : t("{n} unused recovery codes remaining.", { n: status.recoveryCodesRemaining })}
            </p>
            <Button variant="outline" onClick={() => setDisableOpen(true)}>
              <ShieldOff className="h-4 w-4" /> {t("Disable Two-Factor Authentication")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-ink-secondary">
              {t("Add an extra layer of protection to your account with a time-based code from an authenticator app (Google Authenticator, Authy, 1Password, etc). This is optional - nothing changes about how you sign in until you turn it on.")}
            </p>
            <Button onClick={() => setSetupOpen(true)}>
              <ShieldCheck className="h-4 w-4" /> {t("Enable Two-Factor Authentication")}
            </Button>
          </div>
        )}
      </CardBody>

      {setupOpen && (
        <MfaSetupDialog
          onClose={() => setSetupOpen(false)}
          onEnabled={(result) => {
            setSetupOpen(false);
            setRecoveryCodes(result.recoveryCodes);
            refresh();
          }}
        />
      )}

      {disableOpen && (
        <MfaDisableDialog
          onClose={() => setDisableOpen(false)}
          onDisabled={() => {
            setDisableOpen(false);
            refresh();
          }}
        />
      )}

      {recoveryCodes && <RecoveryCodesDialog codes={recoveryCodes} onClose={() => setRecoveryCodes(null)} />}
    </Card>
  );
}

function MfaDisableDialog({ onClose, onDisabled }: { onClose: () => void; onDisabled: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/mfa/disable", { password });
      toast.success(t("Two-factor authentication disabled"));
      onDisabled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("Could not disable MFA"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={t("Disable Two-Factor Authentication")} size="sm">
      <div className="space-y-4">
        <p className="text-[13px] text-ink-secondary">{t("Confirm your password to turn off two-factor authentication for your account.")}</p>
        <div>
          <Label htmlFor="disable-password" required>
            {t("Password")}
          </Label>
          <Input id="disable-password" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-[13px] text-status-critical">{error}</p>}
        <Button variant="outline" onClick={onConfirm} loading={loading} disabled={!password} className="w-full justify-center">
          {t("Disable Two-Factor Authentication")}
        </Button>
      </div>
    </Dialog>
  );
}
