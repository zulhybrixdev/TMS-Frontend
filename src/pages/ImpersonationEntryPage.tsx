import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { setToken } from "../lib/api-client";

// Cross-origin handoff target for Platform Console's "View as tenant".
// Platform Console runs on a different origin from the tenant app it's
// managing (see platform-environments.ts), so it can't write directly into
// this origin's localStorage - it opens this route with the token as a
// one-time URL param instead, which stores it here and redirects to "/".
// Always present, unconditionally (not behind VITE_ENABLE_PLATFORM/BILLING)
// since every deployed environment needs to be a valid handoff target.
//
// Uses a hard navigation (window.location), not react-router's navigate():
// AuthProvider (main.tsx) reads the token from localStorage exactly once,
// in a useEffect on its own mount, and never re-checks afterwards. A
// client-side route change to "/" doesn't remount it, so it would still
// see "no user" from before this page ever set the token, and
// ProtectedRoute would bounce straight back to /login despite the token
// now being valid. A full page load makes AuthProvider re-initialise with
// the token already in place.
export default function ImpersonationEntryPage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) setToken(token);
    window.location.href = "/";
  }, [params]);

  return null;
}
