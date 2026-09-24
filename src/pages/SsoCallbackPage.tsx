import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { t } from "../i18n";

// Landing page for the backend's /auth/sso/callback redirect (see
// TMS-Backend's sso.routes.ts) - the token travels in the URL fragment,
// never sent to any server on this navigation, and is read here client-side
// only, then handed to auth-context the same way a password login's token
// would be.
export default function SsoCallbackPage() {
  const { completeLoginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const token = new URLSearchParams(hash).get("token");
    if (!token) {
      setError(t("Missing sign-in token from SSO callback"));
      return;
    }
    completeLoginWithToken(token)
      .then(() => {
        toast.success(t("Signed in via SSO"));
        navigate("/", { replace: true });
      })
      .catch(() => setError(t("Could not complete SSO sign-in")));
  }, [completeLoginWithToken, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      {error ? (
        <>
          <p className="text-[15px] font-medium text-status-critical">{error}</p>
          <button onClick={() => navigate("/login", { replace: true })} className="text-[13px] text-brand hover:underline">
            {t("Back to sign in")}
          </button>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-[13px] text-ink-secondary">{t("Completing sign-in...")}</p>
        </>
      )}
    </div>
  );
}
