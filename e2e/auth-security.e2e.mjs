// Browser end-to-end test for the auth/security features: role-based menu
// links, environment badge, Account-page MFA setup, the login MFA step,
// org-wide "require two-factor" enrollment, the Security tab, and SSO through
// a real Keycloak login page.
//
// Run:  npm run e2e:auth        (from TMS-Frontend/, after `e2e/reset-dev-state.sh`)
//
// Prerequisites (this is a DEV-tier test - it changes tenant settings and
// creates/deletes MFA + SSO state, so never point it at uat/prod):
//   - pm2 apps tms-backend-dev, tms-frontend-dev and keycloak-dev running
//   - the seeded demo data, on the Pro+ plan (SSO is a Pro+ module)
//   - Keycloak dev's `acme-test-idp` stand-in realm + `acme-corp-saml` broker
//     (see README, SSO section)
//   - RATE_LIMIT_AUTH_MAX=1000 in TMS-Backend/.env.development while running
//     (the test does ~25 logins/MFA calls; the default limit is 30 per 15 min)
//   - Google Chrome installed (override with CHROME_PATH)
// Screenshots (and failure screenshots) land in e2e/artifacts/.
import { chromium } from "playwright-core";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
const { authenticator } = createRequire(new URL("../../TMS-Backend/package.json", import.meta.url))("otplib");

const BASE = process.env.E2E_BASE ?? "http://localhost:3417";
const ART = path.join(path.dirname(fileURLToPath(import.meta.url)), "artifacts");
fs.mkdirSync(ART, { recursive: true });
const shot = (name) => path.join(ART, name);
const results = [];
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 850 } });
const p = await ctx.newPage();
p.setDefaultTimeout(15000);
const errors = [];
p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push("console: " + m.text()));

async function step(name, fn) {
  try { const note = await fn(); results.push(["PASS", name, note ?? ""]); }
  catch (e) { results.push(["FAIL", name, e.message.split("\n")[0]]); await p.screenshot({ path: shot(`fail-${results.length}.png`) }).catch(() => {}); }
}
const must = (c, msg) => { if (!c) throw new Error(msg); };
const menuBtn = () => p.locator("header button").filter({ has: p.locator("svg.lucide-chevron-down") });
async function login(email, password = "Password123!") {
  await p.goto(BASE + "/login");
  await p.fill("#email", email); await p.fill("#password", password);
  await p.getByRole("button", { name: /^Sign in$/ }).click();
}
async function signOut() {
  const out = p.getByRole("button", { name: /Sign out/ });
  try {
    // toasts (top-right) sit over the account-menu button for a few seconds
    await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
    if (!(await out.isVisible())) await menuBtn().click({ timeout: 4000 });
    await out.click({ timeout: 4000 }); await p.waitForURL(/\/login/, { timeout: 4000 });
  } catch {
    results.push(["NOTE", "signOut fell back to clearing storage at " + p.url(), ""]); await p.screenshot({ path: shot(`signout-fallback-${results.length}.png`) });
    await p.evaluate(() => localStorage.clear()); await p.goto(BASE + "/login");
  }
}
async function dashboardReady() { await p.waitForURL(BASE + "/"); await menuBtn().waitFor(); }
async function scanSetupAndConfirm() {
  const dlg = p.getByRole("dialog");
  await dlg.locator("p.select-all").waitFor();
  const secret = (await dlg.locator("p.select-all").textContent()).trim();
  await dlg.locator("#mfa-code").fill(authenticator.generate(secret));
  await dlg.getByRole("button", { name: /Confirm & Enable/ }).click();
  return secret;
}

// ---------- 1. viewer: no admin links ----------
await step("Viewer: dropdown has My Account + Sign out but NO Administration", async () => {
  await login("viewer@treasurysystem.com.my"); await dashboardReady();
  await menuBtn().click();
  must(await p.getByRole("link", { name: "My Account" }).isVisible(), "My Account missing");
  must(!(await p.locator("header").getByRole("link", { name: "Administration" }).count()), "Administration link visible to viewer");
  await p.keyboard.press("Escape");
});
await step("Viewer: sidebar tenant box is not a link", async () => {
  const links = await p.locator('aside a[href^="/administration"]').count();
  must(links === 0, `sidebar has ${links} administration link(s)`);
});
await step("Environment badge shows DEV", async () => {
  must(await p.getByText(/^DEV$/).isVisible(), "no DEV badge");
});
await p.screenshot({ path: shot("viewer-dashboard.png") });
await signOut();

// ---------- 2. admin sees Administration + Security tab ----------
await step("Admin: dropdown shows Administration", async () => {
  await login("admin@treasurysystem.com.my"); await dashboardReady();
  await menuBtn().click();
  must(await p.locator("header").getByRole("link", { name: "Administration" }).isVisible(), "no Administration link for admin");
  await p.keyboard.press("Escape");
});
await step("Admin: Security tab shows MFA policy + SSO form", async () => {
  await p.goto(BASE + "/administration?tab=security");
  await p.getByRole("heading", { name: "Two-factor authentication" }).waitFor();
  await p.locator("#keycloakIdpAlias").waitFor();
  must(await p.locator("#allowedEmailDomains").isVisible(), "domains field missing");
  return (await p.getByText(/of \d+ active users? have set it up/).textContent()).trim();
});
await p.screenshot({ path: shot("security-tab.png"), fullPage: true });

// ---------- 3. Account page: enable MFA via UI, log in with it, disable ----------
let adminSecret;
await step("Account: enable two-factor via QR dialog + recovery codes", async () => {
  await p.goto(BASE + "/account");
  await p.getByRole("button", { name: /Enable Two-Factor Authentication/ }).click();
  adminSecret = await scanSetupAndConfirm();
  const dlg = p.getByRole("dialog");
  await dlg.getByText("Save your recovery codes").waitFor();
  const n = await dlg.locator("span.font-mono, .font-mono span").count();
  await p.screenshot({ path: shot("recovery-codes.png") });
  await dlg.getByRole("button", { name: /I've saved these/ }).click();
  await p.getByText("Enabled", { exact: true }).waitFor();
  return `recovery code cells: ${n}`;
});
await signOut();
await step("Login now asks for a code; wrong code rejected, right code signs in", async () => {
  await login("admin@treasurysystem.com.my");
  await p.getByRole("heading", { name: "Enter your code" }).waitFor();
  await p.fill("#mfaCode", "000000"); await p.getByRole("button", { name: "Verify" }).click();
  await p.getByText("Invalid code").waitFor();
  await p.fill("#mfaCode", authenticator.generate(adminSecret)); await p.getByRole("button", { name: "Verify" }).click();
  await dashboardReady();
});
await step("Account: disable two-factor with password", async () => {
  await p.goto(BASE + "/account");
  await p.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  const dlg = p.getByRole("dialog");
  await dlg.locator("#disable-password").fill("Password123!");
  await dlg.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  await p.getByText("Off", { exact: true }).waitFor();
});

// ---------- 4. Require MFA org-wide: admin turns on; maker is forced to enroll ----------
await step("Security: turn ON 'require two-factor' (confirm dialog shows pending count)", async () => {
  await p.goto(BASE + "/administration?tab=security");
  await p.getByRole("button", { name: /Require two-factor authentication/ }).click();
  const dlg = p.getByRole("dialog");
  const desc = (await dlg.textContent()) ?? "";
  must(/haven't set it up yet/.test(desc), "confirm text missing");
  await dlg.getByRole("button", { name: "Require it" }).click();
  await p.getByText("Required", { exact: true }).waitFor();
  return desc.match(/\d+ active users? haven't/)?.[0];
});
await signOut();
let makerSecret;
await step("Maker (no MFA) is forced into enrollment at login, finishing it signs in", async () => {
  await login("maker@treasurysystem.com.my");
  await p.locator("h1", { hasText: "Set up two-factor authentication" }).waitFor();
  await p.screenshot({ path: shot("enroll.png") });
  makerSecret = await scanSetupAndConfirm();
  await p.getByRole("dialog").getByText("Save your recovery codes").waitFor();
  await p.getByRole("dialog").getByRole("button", { name: /I've saved these/ }).click();
  await dashboardReady();
});
await step("Maker cannot disable MFA while the org requires it", async () => {
  await p.goto(BASE + "/account");
  await p.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  const dlg = p.getByRole("dialog");
  await dlg.locator("#disable-password").fill("Password123!");
  await dlg.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  await dlg.getByText(/organisation requires two-factor/).waitFor();
});
await signOut();
await step("Admin turns the requirement back OFF; maker disables own MFA", async () => {
  await login("admin@treasurysystem.com.my");
  // admin has no MFA now -> required flag still on -> enrollment for admin too
  await p.locator("h1", { hasText: "Set up two-factor authentication" }).waitFor();
  const adminSecret2 = await scanSetupAndConfirm();
  await p.getByRole("dialog").getByRole("button", { name: /I've saved these/ }).click();
  await dashboardReady();
  await p.goto(BASE + "/administration?tab=security");
  await p.getByRole("button", { name: /Stop requiring two-factor authentication/ }).click();
  await p.getByText("Optional", { exact: true }).waitFor();
  // admin removes own MFA too
  await p.goto(BASE + "/account");
  await p.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  const dlg = p.getByRole("dialog"); await dlg.locator("#disable-password").fill("Password123!");
  await dlg.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  await p.getByText("Off", { exact: true }).waitFor();
  await signOut();
  // maker: log in (MFA step), then disable
  await login("maker@treasurysystem.com.my");
  await p.getByRole("heading", { name: "Enter your code" }).waitFor();
  await p.fill("#mfaCode", authenticator.generate(makerSecret)); await p.getByRole("button", { name: "Verify" }).click();
  await dashboardReady();
  await p.goto(BASE + "/account");
  await p.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  const d2 = p.getByRole("dialog"); await d2.locator("#disable-password").fill("Password123!");
  await d2.getByRole("button", { name: /Disable Two-Factor Authentication/ }).click();
  await p.getByText("Off", { exact: true }).waitFor();
  await signOut();
});

// ---------- 5. SSO: configure in the Security tab, sign in through Keycloak ----------
await step("Security: save SSO config (alias + allowed domain) via the form", async () => {
  await login("admin@treasurysystem.com.my"); await dashboardReady();
  await p.goto(BASE + "/administration?tab=security");
  await p.locator("#keycloakIdpAlias").fill("acme-corp-saml");
  await p.locator("#allowedEmailDomains").fill("acme-test.example");
  await p.getByRole("button", { name: /Save SSO Configuration/ }).click();
  await p.getByText("Configured", { exact: true }).waitFor();
  await p.screenshot({ path: shot("sso-configured.png"), fullPage: true });
});
await signOut();
await step("Login page: 'Sign in with company SSO' -> Keycloak -> lands signed in", async () => {
  await p.goto(BASE + "/login");
  await p.getByRole("button", { name: /Sign in with company SSO instead/ }).click();
  await p.locator("#tenantSlug").fill("TEST");
  await p.getByRole("button", { name: "Continue" }).click();
  await p.waitForURL(/localhost:8080\/realms\/acme-test-idp/);
  await p.fill("#username", "priya.acme"); await p.fill("#password", "AcmeTest123!");
  await p.click("#kc-login");
  await dashboardReady();
  await menuBtn().click();
  const who = await p.getByText("priya@acme-test.example").first().textContent();
  await p.keyboard.press("Escape");
  return "signed in as " + who?.trim();
});
await signOut();
await step("Login page shows an inline error when SSO is refused (unknown org)", async () => {
  await p.goto(BASE + "/api/auth/sso/NOPE/start");
  await p.waitForURL(/\/login\?ssoError=/);
  await p.getByText(/SSO sign-in failed: SSO is not configured/).waitFor();
});
await step("Pages produced no JS errors", async () => { must(errors.length === 0, errors.slice(0, 3).join(" | ")); });

await b.close();
for (const [s, n, note] of results) console.log(`${s}  ${n}${note ? "  -> " + note : ""}`);
const failed = results.some((r) => r[0] === "FAIL");
console.log(failed ? "\nSOME FAILED" : "\nALL PASSED");
process.exit(failed ? 1 : 0);
