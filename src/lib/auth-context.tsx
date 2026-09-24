import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, registerUnauthorizedHandler, setToken } from "./api-client";
import type { AuthUser } from "./types";
import { t } from "../i18n";

export interface RegisterInput {
  companyName: string;
  accountType: "INDIVIDUAL" | "TEAM" | "ENTERPRISE";
  planKey: "FREE" | "PRO" | "PRO_PLUS";
  name: string;
  email: string;
  password: string;
  jobTitle?: string;
  // Consent captured on the registration form; the server refuses anything else than true.
  acceptTerms: true;
  acceptPrivacy: true;
  termsVersion: string;
  privacyVersion: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; mfaEnrollmentRequired: boolean }>;
  verifyMfaChallenge: (code: string) => Promise<void>;
  cancelMfaChallenge: () => void;
  completeLoginWithToken: (token: string) => Promise<void>;
  cancelMfaEnrollment: () => void;
  register: (input: RegisterInput) => Promise<{ checkoutUrl?: string }>;
  logout: () => void;
  hasPermission: (...codes: string[]) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Only set between a password login that returned mfaRequired and the
  // follow-up code submission - never persisted, never touches storage.
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await api.get<AuthUser>("/auth/me");
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{
      mfaRequired?: boolean;
      mfaEnrollmentRequired?: boolean;
      token?: string;
      user?: AuthUser;
      challengeToken?: string;
      enrollmentToken?: string;
    }>("/auth/login", { email, password });
    if (result.mfaRequired) {
      setMfaChallengeToken(result.challengeToken!);
      return { mfaRequired: true, mfaEnrollmentRequired: false };
    }
    if (result.mfaEnrollmentRequired) {
      // Not a session - the backend only accepts this token on the MFA
      // setup/verify endpoints, which is exactly what the login page's
      // enrollment step calls next (api-client attaches it like any token).
      setToken(result.enrollmentToken!);
      return { mfaRequired: false, mfaEnrollmentRequired: true };
    }
    setToken(result.token!);
    setUser(result.user!);
    return { mfaRequired: false, mfaEnrollmentRequired: false };
  }, []);

  const verifyMfaChallenge = useCallback(
    async (code: string) => {
      if (!mfaChallengeToken) throw new Error(t("No MFA challenge in progress"));
      const result = await api.post<{ token: string; user: AuthUser }>("/auth/mfa/challenge", { challengeToken: mfaChallengeToken, code });
      setToken(result.token);
      setUser(result.user);
      setMfaChallengeToken(null);
    },
    [mfaChallengeToken]
  );

  const cancelMfaChallenge = useCallback(() => setMfaChallengeToken(null), []);

  const cancelMfaEnrollment = useCallback(() => setToken(null), []);

  // Stores an already-issued session token and hydrates `user` from it - used
  // by the SSO callback page and by MFA enrollment at login (both arrive
  // with a finished session token rather than credentials). Deliberately doesn't reuse loadMe()
  // - that swallows a failed /auth/me into a silent sign-out, but here the
  // caller (SsoCallbackPage) needs a real thrown error to show the user
  // what went wrong instead of just bouncing them back to /login unexplained.
  const completeLoginWithToken = useCallback(async (token: string) => {
    setToken(token);
    try {
      const me = await api.get<AuthUser>("/auth/me");
      setUser(me);
    } catch (err) {
      setToken(null);
      throw err;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await api.post<{ token: string; user: AuthUser; checkoutUrl?: string }>("/auth/register", input);
    setToken(result.token);
    setUser(result.user);
    return { checkoutUrl: result.checkoutUrl };
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((...codes: string[]) => !!user && codes.some((c) => user.permissions.includes(c)), [user]);
  const hasRole = useCallback((...roles: string[]) => !!user && roles.some((r) => user.roles.includes(r)), [user]);

  const value = useMemo(
    () => ({ user, isLoading, login, verifyMfaChallenge, cancelMfaChallenge, completeLoginWithToken, cancelMfaEnrollment, register, logout, hasPermission, hasRole }),
    [user, isLoading, login, verifyMfaChallenge, cancelMfaChallenge, completeLoginWithToken, cancelMfaEnrollment, register, logout, hasPermission, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
