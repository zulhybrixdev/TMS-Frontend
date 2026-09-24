import { Routes, Route } from "react-router-dom";
import { PlatformAuthProvider } from "../../lib/platform-auth-context";
import { PlatformProtectedRoute } from "../../components/PlatformProtectedRoute";
import PlatformLoginPage from "./PlatformLoginPage";
import PlatformLayout from "./PlatformLayout";
import PlatformDashboardPage from "./PlatformDashboardPage";
import PlatformAnnouncementsPage from "./PlatformAnnouncementsPage";
import PlatformEnvironmentsPage from "./PlatformEnvironmentsPage";
import PlatformIdentityPage from "./PlatformIdentityPage";

// Everything platform-console-related lives behind this one lazy import
// (see App.tsx) so a client-facing POC build with VITE_ENABLE_PLATFORM
// unset never ships this code at all - not hidden, not reachable by
// guessing the URL, just absent from the bundle.
//
// After sign-in every screen shares PlatformLayout (header + tabs); each tab
// is its own route: Tenants (index), Announcements, Environments, Identity / SSO.
export default function PlatformConsoleApp() {
  return (
    <PlatformAuthProvider>
      <Routes>
        <Route path="login" element={<PlatformLoginPage />} />
        <Route element={<PlatformProtectedRoute />}>
          <Route element={<PlatformLayout />}>
            <Route index element={<PlatformDashboardPage />} />
            <Route path="announcements" element={<PlatformAnnouncementsPage />} />
            <Route path="environments" element={<PlatformEnvironmentsPage />} />
            <Route path="sso" element={<PlatformIdentityPage />} />
          </Route>
        </Route>
      </Routes>
    </PlatformAuthProvider>
  );
}
