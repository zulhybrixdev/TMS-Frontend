import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePlatformAuth } from "../lib/platform-auth-context";

export function PlatformProtectedRoute() {
  const { connected, isLoading } = usePlatformAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-plane">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (connected.length === 0) return <Navigate to="/platform/login" replace />;
  return <Outlet />;
}
