import { usePlatformAuth } from "../../lib/platform-auth-context";
import { RegistrationControl } from "./RegistrationControl";
import { LiveModeControl } from "./LiveModeControl";

// Per-environment switches: who can register, and (for UAT) which build is served.
export default function PlatformEnvironmentsPage() {
  const { connected } = usePlatformAuth();
  return (
    <>
      <div className="mb-2">
        <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Environments</h1>
        <p className="mt-1 text-sm text-ink-secondary">Switches that apply to a whole environment. Each of Dev, UAT and Production has its own setting.</p>
      </div>
      <RegistrationControl connected={connected} />
      <LiveModeControl connected={connected} />
    </>
  );
}
