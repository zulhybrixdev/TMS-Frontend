import { useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { ApiError, getApiBaseUrl } from "../lib/api-client";
import { MfaSetupDialog, RecoveryCodesDialog, type MfaEnableResult } from "../components/MfaSetup";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function LoginPage() {
  const { login, verifyMfaChallenge, cancelMfaChallenge, completeLoginWithToken, cancelMfaEnrollment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  // A refused SSO login (bad tenant, unverified email, plan, ...) arrives as
  // ?ssoError= from the backend redirect. Shown inline, not as a toast: the
  // <Toaster> mounts after this page's first effect, so a toast fired on
  // initial load is silently dropped.
  const [error, setError] = useState<string | null>(() => {
    const ssoError = searchParams.get("ssoError");
    return ssoError ? `SSO sign-in failed: ${ssoError}` : null;
  });
  const [ssoStep, setSsoStep] = useState(false);
  // Tenant requires two-factor auth and this user hasn't set it up yet:
  // password login returns an enrollment token instead of a session, and
  // finishing setup here is what completes the sign-in.
  const [enrollStep, setEnrollStep] = useState(false);
  const [enrollResult, setEnrollResult] = useState<MfaEnableResult | null>(null);
  const [tenantSlug, setTenantSlug] = useState("");

  const from = (location.state as { from?: string })?.from || "/";

  const startSso = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `${getApiBaseUrl()}/auth/sso/${encodeURIComponent(tenantSlug.trim())}/start`;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        setMfaStep(true);
        return;
      }
      if (result.mfaEnrollmentRequired) {
        setEnrollStep(true);
        return;
      }
      toast.success("Welcome back", { description: "Signed in successfully." });
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyMfaChallenge(mfaCode);
      toast.success("Welcome back", { description: "Signed in successfully." });
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEnrollment = () => {
    cancelMfaEnrollment();
    setEnrollStep(false);
    setEnrollResult(null);
  };

  const finishEnrollment = async () => {
    try {
      await completeLoginWithToken(enrollResult!.token!);
      toast.success("Welcome back", { description: "Two-factor authentication is on. Signed in successfully." });
      navigate(from, { replace: true });
    } catch {
      cancelEnrollment();
      setError("Could not complete sign-in - please try again");
    }
  };

  const backToPassword = () => {
    cancelMfaChallenge();
    setMfaStep(false);
    setMfaCode("");
    setError(null);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="ledger-grid relative hidden flex-col justify-between overflow-hidden bg-chrome p-12 text-chrome-ink lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[rgba(149,133,240,0.22)] blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[rgba(74,58,167,0.18)] blur-[120px]" />

        <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp} className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chrome-accent text-chrome">
            <Landmark className="h-[18px] w-[18px]" />
          </div>
          <span className="font-display text-[15px] font-semibold">Treasury System</span>
        </motion.div>

        <div className="relative max-w-md">
          <motion.p initial="hidden" animate="show" custom={1} variants={fadeUp} className="font-display text-[32px] font-semibold leading-[1.15] tracking-tight">
            Command your company's cash position with confidence.
          </motion.p>
          <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp} className="mt-4 text-sm leading-relaxed text-chrome-muted">
            Consolidated balances, payment approvals, and inter-bank transfers with a complete audit trail — built for Malaysian Finance teams.
          </motion.p>
          <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="mt-8 flex items-center gap-2 text-sm text-chrome-muted">
            <ShieldCheck className="h-4 w-4 text-chrome-accent" />
            Segregation of duties enforced on every approval
          </motion.div>
        </div>

        <motion.p initial="hidden" animate="show" custom={4} variants={fadeUp} className="relative font-mono text-[11px] text-chrome-muted">
          © {new Date().getFullYear()} Treasury System
        </motion.p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
                <Landmark className="h-[18px] w-[18px]" />
              </div>
              <span className="font-display text-[15px] font-semibold text-ink">Treasury System</span>
            </div>
          </div>

          {enrollStep ? (
            <>
              <h1 className="font-display text-2xl font-semibold text-ink">Set up two-factor authentication</h1>
              <p className="mt-1 text-sm text-ink-secondary">
                Your organisation requires two-factor authentication. Finish setting it up to complete signing in.
              </p>
              <button type="button" onClick={cancelEnrollment} className="mt-6 text-[13px] text-ink-secondary hover:text-ink hover:underline">
                Back to sign in
              </button>
              {!enrollResult && <MfaSetupDialog onClose={cancelEnrollment} onEnabled={setEnrollResult} />}
              {enrollResult && <RecoveryCodesDialog codes={enrollResult.recoveryCodes} onClose={finishEnrollment} />}
            </>
          ) : !mfaStep && !ssoStep ? (
            <>
              <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
              <p className="mt-1 text-sm text-ink-secondary">Enter your credentials to access the treasury console.</p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email" required>
                    Work email
                  </Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                </div>
                <div>
                  <Label htmlFor="password" required>
                    Password
                  </Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                {error && <p className="rounded-lg bg-status-critical-soft px-3 py-2 text-[13px] text-status-critical">{error}</p>}
                <Button type="submit" size="lg" className="w-full justify-center" loading={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setSsoStep(true)}
                className="mt-4 w-full text-center text-[13px] text-ink-secondary hover:text-ink hover:underline"
              >
                Sign in with company SSO instead
              </button>

              {import.meta.env.VITE_ENABLE_BILLING === "true" && (
                <p className="mt-4 text-center text-[13px] text-ink-secondary">
                  New here?{" "}
                  <Link to="/register" className="font-medium text-brand hover:underline">
                    Create an organisation
                  </Link>
                </p>
              )}
            </>
          ) : ssoStep ? (
            <>
              <h1 className="font-display text-2xl font-semibold text-ink">Sign in with SSO</h1>
              <p className="mt-1 text-sm text-ink-secondary">Enter your organisation's account identifier to continue to your identity provider.</p>

              <form onSubmit={startSso} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="tenantSlug" required>
                    Organisation ID
                  </Label>
                  <Input id="tenantSlug" required autoFocus value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} placeholder="e.g. TEST" />
                </div>
                <Button type="submit" size="lg" className="w-full justify-center" disabled={!tenantSlug.trim()}>
                  Continue
                </Button>
                <button type="button" onClick={() => setSsoStep(false)} className="w-full text-center text-[13px] text-ink-secondary hover:text-ink hover:underline">
                  Back to password sign-in
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold text-ink">Enter your code</h1>
              <p className="mt-1 text-sm text-ink-secondary">Open your authenticator app and enter the 6-digit code, or use a recovery code.</p>

              <form onSubmit={onSubmitMfa} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="mfaCode" required>
                    Authentication code
                  </Label>
                  <Input
                    id="mfaCode"
                    inputMode="numeric"
                    autoFocus
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                  />
                </div>
                {error && <p className="rounded-lg bg-status-critical-soft px-3 py-2 text-[13px] text-status-critical">{error}</p>}
                <Button type="submit" size="lg" className="w-full justify-center" loading={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <button type="button" onClick={backToPassword} className="w-full text-center text-[13px] text-ink-secondary hover:text-ink hover:underline">
                  Back to password
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
