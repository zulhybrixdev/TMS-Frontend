import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Landmark, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { PlanPicker } from "../components/PlanPicker";
import { ApiError } from "../lib/api-client";
import { ACCOUNT_TYPE_OPTIONS } from "../lib/plans";
import type { PlanKey, TenantAccountType } from "../lib/types";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }),
};

const STEPS = ["Organisation", "Plan", "Your account"] as const;

export default function RegistrationPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [accountType, setAccountType] = useState<TenantAccountType>("TEAM");
  const [planKey, setPlanKey] = useState<PlanKey>("FREE");
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isIndividual = accountType === "INDIVIDUAL";
  const canContinueStep0 = companyName.trim().length >= 2;
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await register({ companyName, accountType, planKey, name, jobTitle: jobTitle || undefined, email, password });
      if (checkoutUrl) {
        toast.success("Account created", { description: "Redirecting you to complete payment..." });
        window.location.href = checkoutUrl;
        return;
      }
      toast.success("Welcome to Treasury System", { description: "Your account is ready." });
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to create your account";
      setError(message);
    } finally {
      setLoading(false);
    }
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
            One console for every bank, every currency, every approval.
          </motion.p>
          <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp} className="mt-4 text-sm leading-relaxed text-chrome-muted">
            Start free, upgrade whenever you need transfers, forecasting, or the full audit trail - no card required to try it out.
          </motion.p>
          <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="mt-8 flex items-center gap-2 text-sm text-chrome-muted">
            <ShieldCheck className="h-4 w-4 text-chrome-accent" />
            Your own isolated workspace, ready in seconds
          </motion.div>
        </div>

        <motion.p initial="hidden" animate="show" custom={4} variants={fadeUp} className="relative font-mono text-[11px] text-chrome-muted">
          © {new Date().getFullYear()} Treasury System
        </motion.p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={clsx("w-full", step === 1 ? "max-w-2xl" : "max-w-sm")}>
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
                <Landmark className="h-[18px] w-[18px]" />
              </div>
              <span className="font-display text-[15px] font-semibold text-ink">Treasury System</span>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                    i < step ? "bg-brand text-white" : i === step ? "bg-brand-soft text-brand" : "bg-plane text-ink-muted"
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={clsx("text-[12px]", i === step ? "font-medium text-ink" : "text-ink-muted")}>{label}</span>
                {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold text-ink">Create your organisation</h1>
              <p className="text-sm text-ink-secondary">This becomes your own private tenant - nothing is shared with other companies.</p>
              <div>
                <Label required>Account type</Label>
                <div className="mt-1 space-y-2">
                  {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                        accountType === opt.value ? "border-brand ring-2 ring-brand/30" : "border-border hover:bg-plane"
                      )}
                    >
                      <input type="radio" name="accountType" className="mt-1" checked={accountType === opt.value} onChange={() => setAccountType(opt.value)} />
                      <span>
                        <span className="block text-[13px] font-medium text-ink">{opt.label}</span>
                        <span className="block text-[12px] text-ink-muted">{opt.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="companyName" required>
                  {isIndividual ? "Your name / workspace name" : "Company / organisation name"}
                </Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={isIndividual ? "e.g. John Tan" : "e.g. Acme Sdn Bhd"} />
              </div>
              <Button type="button" size="lg" className="w-full justify-center" disabled={!canContinueStep0} onClick={() => setStep(1)}>
                Continue
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold text-ink">Choose a plan</h1>
              <p className="text-sm text-ink-secondary">You can change this anytime later in Settings.</p>
              <PlanPicker selected={planKey} onSelect={setPlanKey} submitLabel="Choose" />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="button" className="flex-1 justify-center" onClick={() => setStep(2)}>
                  Continue with {planKey === "FREE" ? "Free" : planKey === "PRO" ? "Pro" : "Pro+"}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }}
            >
              <h1 className="font-display text-2xl font-semibold text-ink">Create your admin account</h1>
              <p className="text-sm text-ink-secondary">You'll be the Admin for {companyName || (isIndividual ? "your workspace" : "your organisation")}.</p>
              <div>
                <Label htmlFor="name" required>
                  Your name
                </Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job title</Label>
                <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <Label htmlFor="email" required>
                  Work email
                </Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              </div>
              <div>
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                <p className="mt-1 text-[11px] text-ink-muted">At least 8 characters.</p>
              </div>
              {error && <p className="rounded-lg bg-status-critical-soft px-3 py-2 text-[13px] text-status-critical">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1 justify-center" loading={loading} disabled={!canSubmit}>
                  {planKey === "FREE" ? "Create account" : "Continue to payment"}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-[13px] text-ink-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
