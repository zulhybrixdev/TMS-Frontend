import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api-client";

// Shows which backend tier this build is actually talking to (DEV/UAT,
// plus a POC suffix when on a /poc path - see poc-mode.middleware.ts on
// the backend, which is a URL-path switch within the UAT tier, not a
// separate deployment). Deliberately rendered once at the app root
// (App.tsx), outside <Routes>, so it's visible on every page including
// pre-login ones like /login and /register, not just inside AppShell.
//
// PROD never shows this - it's the one tier real clients use, and a
// "you are here" badge has no purpose (and no audience) once the app
// isn't being tested against.
const TIER_STYLES: Record<string, string> = {
  DEV: "bg-sky-600 text-white",
  UAT: "bg-amber-500 text-black",
};

export function EnvironmentBadge() {
  const { data } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.get<{ tier: string }>("/meta"),
    staleTime: Infinity,
    retry: false,
  });

  if (!data || data.tier === "PROD") return null;

  const isPoc = typeof window !== "undefined" && window.location.pathname.startsWith("/poc");
  const label = isPoc ? `${data.tier} · POC` : data.tier;

  return (
    <div
      className={`pointer-events-none fixed bottom-3 right-3 z-[9999] rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider shadow-popover ${TIER_STYLES[data.tier] ?? "bg-ink text-white"}`}
    >
      {label}
    </div>
  );
}
