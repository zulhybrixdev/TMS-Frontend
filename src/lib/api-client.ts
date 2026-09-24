// Thin fetch wrapper: attaches the bearer token, unwraps the {success,data}
// envelope, paginates via {items,meta}, and normalises backend errors into
// a typed ApiError so callers/toasts can show a clean message.

import { t } from "../i18n";
import { tServer } from "../i18n/server-messages";
import { notifyMaintenance } from "./maintenance-events";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

function getToken(): string | null {
  return localStorage.getItem("tms.token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 normally means "your session is no longer valid" - but for the
  // endpoints that *check credentials* (password, MFA code) it just means
  // "wrong", and the server's own message ("Invalid code", "Invalid email or
  // password", "Too many incorrect codes...") is what the user needs to see.
  const isCredentialCheck = /^\/auth\/(login|register|mfa\/challenge)/.test(path);
  if (res.status === 401 && !isCredentialCheck) {
    onUnauthorized?.();
    throw new ApiError(401, t("Session expired. Please sign in again."));
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res as unknown as T; // caller wants a raw Response (CSV downloads)
  }

  const json = await res.json();
  if (!res.ok || json.success === false) {
    const err = json.error ?? {};
    if (res.status === 503 && err.code === "MAINTENANCE_MODE") notifyMaintenance();
    throw new ApiError(res.status, tServer(err.message || "Something went wrong"), err.code, err.details);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<{ success: true; data: T }>(path).then((r) => r.data),
  getPaginated: <T>(path: string) =>
    request<{ success: true; data: T[]; meta: import("./types").PaginationMeta }>(path).then((r) => ({ items: r.data, meta: r.meta })),
  post: <T>(path: string, body?: unknown) =>
    request<{ success: true; data: T }>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) =>
    request<{ success: true; data: T }>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }).then((r) => r.data),
  put: <T>(path: string, body?: unknown) =>
    request<{ success: true; data: T }>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }).then((r) => r.data),
  delete: <T>(path: string) => request<{ success: true; data: T }>(path, { method: "DELETE" }).then((r) => r.data),

  // Streams a CSV export and triggers a browser download.
  async downloadCsv(path: string, filename: string) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new ApiError(res.status, t("Export failed"));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

// Used by the "Sign in with company SSO" entry point on LoginPage, which
// has to do a full page navigation (not a fetch) to the backend's OIDC
// start route - everything else in this file assumes a JSON fetch.
export function getApiBaseUrl(): string {
  return BASE_URL;
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("tms.token", token);
  else localStorage.removeItem("tms.token");
}
export { getToken };
