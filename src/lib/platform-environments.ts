// The environments Platform Console can see tenants in, side by side, in
// one view. Dev is included so platform-wide switches (like opening/closing
// registration) can be controlled on every tier from one place; its tenants
// are disposable test data, tagged "Dev" in the list. Platform Console itself
// is only ever served from the dev build (see frontend/package.json's
// build/build:poc scripts, which strip it out of the uat/production-deployable
// bundles) - so dev's API is same-origin (the Vite dev server proxies /api to
// the dev backend), while uat and production are reached cross-origin.
export interface PlatformEnvironment {
  key: string;
  label: string;
  apiBase: string;
}

export const PLATFORM_ENVIRONMENTS: PlatformEnvironment[] = [
  { key: "dev", label: "Dev", apiBase: import.meta.env.VITE_PLATFORM_DEV_API_BASE || "/api" },
  { key: "uat", label: "UAT / POC", apiBase: import.meta.env.VITE_PLATFORM_UAT_API_BASE || "http://localhost:4417/api" },
  { key: "production", label: "Production", apiBase: import.meta.env.VITE_PLATFORM_PROD_API_BASE || "http://localhost:5417/api" },
];
