import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ permission }: { permission?: string[] }) {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-plane">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(...permission)) return <Navigate to="/" replace />;

  return <Outlet />;
}
