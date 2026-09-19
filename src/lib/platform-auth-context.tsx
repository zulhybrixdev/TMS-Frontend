import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { platformApiFor, getPlatformToken, setPlatformToken } from "./platform-api-client";
import { PLATFORM_ENVIRONMENTS, PlatformEnvironment } from "./platform-environments";
import type { PlatformAdmin } from "./platform-types";

export interface ConnectedEnvironment {
  env: PlatformEnvironment;
  admin: PlatformAdmin;
}

interface PlatformAuthContextValue {
  // One admin identity per reachable environment - same credentials, but a
  // separate account/token per database. Empty on an environment that's
  // down or where these credentials don't exist there.
  connected: ConnectedEnvironment[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ failedEnvKeys: string[] }>;
  logout: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

async function tryLoadMe(env: PlatformEnvironment): Promise<ConnectedEnvironment | null> {
  if (!getPlatformToken(env.key)) return null;
  try {
    const admin = await platformApiFor(env).get<PlatformAdmin>("/auth/me");
    return { env, admin };
  } catch {
    setPlatformToken(env.key, null);
    return null;
  }
}

export function PlatformAuthProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState<ConnectedEnvironment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all(PLATFORM_ENVIRONMENTS.map(tryLoadMe))
      .then((results) => setConnected(results.filter((r): r is ConnectedEnvironment => r !== null)))
      .finally(() => setIsLoading(false));
  }, []);

  // Logs in against every configured environment in parallel with the same
  // credentials. An environment where they don't work (or that's
  // unreachable) is just skipped - not fatal - since this account may not
  // exist in every database, or an environment may be temporarily down.
  const login = useCallback(async (email: string, password: string) => {
    const results = await Promise.allSettled(
      PLATFORM_ENVIRONMENTS.map(async (env) => {
        const result = await platformApiFor(env).post<{ token: string; admin: PlatformAdmin }>("/auth/login", { email, password });
        setPlatformToken(env.key, result.token);
        return { env, admin: result.admin };
      })
    );

    const succeeded = results.filter((r): r is PromiseFulfilledResult<ConnectedEnvironment> => r.status === "fulfilled").map((r) => r.value);
    const failedEnvKeys = PLATFORM_ENVIRONMENTS.filter((e) => !succeeded.some((s) => s.env.key === e.key)).map((e) => e.key);

    if (succeeded.length === 0) {
      throw new Error("Could not sign in to any environment - check your credentials.");
    }
    setConnected(succeeded);
    return { failedEnvKeys };
  }, []);

  const logout = useCallback(() => {
    for (const env of PLATFORM_ENVIRONMENTS) setPlatformToken(env.key, null);
    setConnected([]);
  }, []);

  const value = useMemo(() => ({ connected, isLoading, login, logout }), [connected, isLoading, login, logout]);

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

export function usePlatformAuth() {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
  return ctx;
}
