// Thin fetch wrapper for the platform-admin console - one instance per
// environment (see platform-environments.ts), each with its own token
// (separate databases mean separate platform_admins rows, so a login
// against one environment doesn't imply a valid session on another).
import { ApiError } from "./api-client";
import { PlatformEnvironment } from "./platform-environments";

const TOKEN_KEY_PREFIX = "tms.platform.token.";

export function getPlatformToken(envKey: string): string | null {
  return localStorage.getItem(TOKEN_KEY_PREFIX + envKey);
}

export function setPlatformToken(envKey: string, token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY_PREFIX + envKey, token);
  else localStorage.removeItem(TOKEN_KEY_PREFIX + envKey);
}

async function request<T>(env: PlatformEnvironment, path: string, options: RequestInit = {}): Promise<T> {
  const token = getPlatformToken(env.key);
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${env.apiBase}/platform${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    const err = json.error ?? {};
    throw new ApiError(res.status, err.message || "Something went wrong", err.code, err.details);
  }
  return json as T;
}

export function platformApiFor(env: PlatformEnvironment) {
  return {
    get: <T>(path: string) => request<{ success: true; data: T }>(env, path).then((r) => r.data),
    getPaginated: <T>(path: string) =>
      request<{ success: true; data: T[]; meta: import("./types").PaginationMeta }>(env, path).then((r) => ({ items: r.data, meta: r.meta })),
    post: <T>(path: string, body?: unknown) =>
      request<{ success: true; data: T }>(env, path, { method: "POST", body: body ? JSON.stringify(body) : undefined }).then((r) => r.data),
    put: <T>(path: string, body?: unknown) =>
      request<{ success: true; data: T }>(env, path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }).then((r) => r.data),
    delete: <T>(path: string) => request<{ success: true; data: T }>(env, path, { method: "DELETE" }).then((r) => r.data),
  };
}

export { ApiError };
