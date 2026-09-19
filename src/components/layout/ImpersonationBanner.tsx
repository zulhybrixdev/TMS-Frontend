import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { useSubscription } from "../../hooks/useSubscription";

// Shown only on a session minted by Platform Console "View as tenant"
// (see backend platform.service#impersonateTenant). Impossible to miss so
// support can never forget which tenant's live data they're looking at.
export function ImpersonationBanner() {
  const { user, logout } = useAuth();
  const { data: subscription } = useSubscription();

  if (!user?.impersonatedByPlatformAdminId) return null;

  const exit = () => {
    logout();
    window.location.href = "/platform";
  };

  return (
    <div className="flex h-9 shrink-0 items-center justify-between bg-ink px-4 text-white md:px-6">
      <span className="flex items-center gap-2 text-[12.5px] font-medium">
        <ShieldAlert className="h-3.5 w-3.5" />
        Platform support is viewing {subscription?.tenant.name ?? "this tenant"} as {user.name}
      </span>
      <button onClick={exit} className="text-[12.5px] font-medium underline underline-offset-2 hover:opacity-80">
        Exit to Platform Console
      </button>
    </div>
  );
}
