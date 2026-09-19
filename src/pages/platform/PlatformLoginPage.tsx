import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { ShieldAlert, Building2 } from "lucide-react";
import { toast } from "sonner";
import { usePlatformAuth } from "../../lib/platform-auth-context";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { ApiError } from "../../lib/platform-api-client";
import { PLATFORM_ENVIRONMENTS } from "../../lib/platform-environments";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function PlatformLoginPage() {
  const { login } = usePlatformAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { failedEnvKeys } = await login(email, password);
      if (failedEnvKeys.length > 0) {
        const labels = PLATFORM_ENVIRONMENTS.filter((e) => failedEnvKeys.includes(e.key)).map((e) => e.label);
        toast.warning(`Signed in, but not to: ${labels.join(", ")}`, { description: "That environment may be unreachable, or these credentials don't exist there." });
      } else {
        toast.success("Signed in to Platform Console");
      }
      navigate("/platform", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Deliberately darker/graphite than the tenant login's purple-lit chrome -
          same design language, but reads as "elevated / internal" at a glance. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[rgba(239,68,68,0.14)] blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[rgba(149,133,240,0.16)] blur-[130px]" />

        <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp} className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white ring-1 ring-white/15">
            <ShieldAlert className="h-[18px] w-[18px]" />
          </div>
          <span className="font-display text-[15px] font-semibold">Platform Console</span>
        </motion.div>

        <div className="relative max-w-md">
          <motion.p initial="hidden" animate="show" custom={1} variants={fadeUp} className="font-display text-[32px] font-semibold leading-[1.15] tracking-tight">
            Every tenant, one console.
          </motion.p>
          <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp} className="mt-4 text-sm leading-relaxed text-white/60">
            Plan, status, and billing across every organisation on Treasury System — with a full audit trail of every action taken here.
          </motion.p>
          <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="mt-8 flex items-center gap-2 text-sm text-white/60">
            <Building2 className="h-4 w-4 text-white/40" />
            Not a tenant login — separate credentials, separate session
          </motion.div>
        </div>

        <motion.p initial="hidden" animate="show" custom={4} variants={fadeUp} className="relative font-mono text-[11px] text-white/40">
          © {new Date().getFullYear()} Treasury System · Internal
        </motion.p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 bg-plane px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white">
                <ShieldAlert className="h-[18px] w-[18px]" />
              </div>
              <span className="font-display text-[15px] font-semibold text-ink">Platform Console</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-secondary">Cross-tenant oversight — platform-admin credentials only.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" required>
                Platform admin email
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
        </motion.div>
      </div>
    </div>
  );
}
