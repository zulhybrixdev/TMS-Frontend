import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";
import { api, ApiError } from "../lib/api-client";
import type { AuthUser } from "../lib/types";
import { Button } from "./ui/Button";
import { Input, Label } from "./ui/Input";
import { Dialog } from "./ui/Dialog";

// Confirming the code enables MFA. When the caller authenticated with an MFA
// *enrollment* token (the tenant requires MFA - see the login page), the
// backend also returns the real session here; otherwise token/user are absent.
export interface MfaEnableResult {
  enabled: boolean;
  recoveryCodes: string[];
  token?: string;
  user?: AuthUser;
}

export function MfaSetupDialog({ onClose, onEnabled }: { onClose: () => void; onEnabled: (result: MfaEnableResult) => void }) {
  const [step, setStep] = useState<"loading" | "scan" | "error">("loading");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each /auth/mfa/setup call mints a NEW secret and overwrites the saved
  // one, so it must run exactly once per dialog - React StrictMode (dev)
  // runs effects twice, which left the QR code showing a secret the server
  // had already replaced.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api
      .post<{ secret: string; otpauthUrl: string }>("/auth/mfa/setup")
      .then((res) => {
        setSecret(res.secret);
        setOtpauthUrl(res.otpauthUrl);
        setStep("scan");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not start MFA setup");
        setStep("error");
      });
  }, []);

  const onConfirm = async () => {
    setVerifying(true);
    setError(null);
    try {
      const result = await api.post<MfaEnableResult>("/auth/mfa/verify", { code });
      onEnabled(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Set up Two-Factor Authentication" size="md">
      {step === "loading" && <p className="text-[13px] text-ink-secondary">Generating your setup key...</p>}
      {step === "error" && <p className="text-[13px] text-status-critical">{error}</p>}
      {step === "scan" && (
        <div className="space-y-4">
          <p className="text-[13px] text-ink-secondary">Scan this QR code with your authenticator app, then enter the 6-digit code it shows.</p>
          <div className="flex justify-center rounded-lg border border-border bg-white p-4">
            <QRCodeSVG value={otpauthUrl} size={180} />
          </div>
          <div>
            <Label>Can't scan? Enter this key manually</Label>
            <p className="mt-1 select-all break-all rounded-md bg-plane px-2.5 py-1.5 font-mono text-[12px] text-ink-secondary">{secret}</p>
          </div>
          <div>
            <Label htmlFor="mfa-code" required>
              6-digit code
            </Label>
            <Input id="mfa-code" inputMode="numeric" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          {error && <p className="text-[13px] text-status-critical">{error}</p>}
          <Button onClick={onConfirm} loading={verifying} disabled={code.length < 6} className="w-full justify-center">
            Confirm & Enable
          </Button>
        </div>
      )}
    </Dialog>
  );
}

export function RecoveryCodesDialog({ codes, onClose }: { codes: string[]; onClose: () => void }) {
  const copyAll = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    toast.success("Recovery codes copied");
  };

  return (
    <Dialog open onClose={onClose} title="Save your recovery codes" size="md">
      <div className="space-y-4">
        <p className="text-[13px] text-ink-secondary">
          Two-factor authentication is now enabled. Store these one-time recovery codes somewhere safe - each one can be used once to sign in if you lose
          access to your authenticator app. They won't be shown again.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-plane p-4 font-mono text-[13px] text-ink">
          {codes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyAll} className="flex-1 justify-center">
            <Copy className="h-4 w-4" /> Copy all
          </Button>
          <Button onClick={onClose} className="flex-1 justify-center">
            I've saved these
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
