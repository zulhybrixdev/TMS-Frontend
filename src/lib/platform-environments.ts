// The environments Platform Console can see tenants in, side by side, in
// one view. The local dev backend (:2417, database tms_dev) isn't listed
// separately - it's a disposable local sandbox, not a real environment
// customers or tenants ever touch, so there's nothing meaningful to
// administer there. Platform Console itself is only ever served from the
// dev build (see frontend/package.json's build/build:poc scripts, which
// strip it out of the uat/production-deployable bundles) - but from there
// it reaches into both real environments' APIs cross-origin.
export interface PlatformEnvironment {
  key: string;
  label: string;
  apiBase: string;
}

export const PLATFORM_ENVIRONMENTS: PlatformEnvironment[] = [
  { key: "uat", label: "UAT / POC", apiBase: import.meta.env.VITE_PLATFORM_UAT_API_BASE || "http://localhost:4417/api" },
  { key: "production", label: "Production", apiBase: import.meta.env.VITE_PLATFORM_PROD_API_BASE || "http://localhost:5417/api" },
];
