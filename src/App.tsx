import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { EnvironmentBadge } from "./components/layout/EnvironmentBadge";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PlanGate } from "./components/PlanGate";
import { PERMISSIONS } from "./lib/permissions";

import LoginPage from "./pages/LoginPage";
import SsoCallbackPage from "./pages/SsoCallbackPage";
import ImpersonationEntryPage from "./pages/ImpersonationEntryPage";
import DashboardPage from "./pages/DashboardPage";
import AccountPage from "./pages/AccountPage";
import ExecutiveDashboardPage from "./pages/ExecutiveDashboardPage";
import BankAccountsPage from "./pages/BankAccountsPage";
import CashPositionPage from "./pages/CashPositionPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentDetailPage from "./pages/PaymentDetailPage";
import BeneficiariesPage from "./pages/BeneficiariesPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import IncomingPage from "./pages/IncomingPage";
import TransfersPage from "./pages/TransfersPage";
import TransferDetailPage from "./pages/TransferDetailPage";
import ApprovalCenterPage from "./pages/ApprovalCenterPage";
import ForecastPage from "./pages/ForecastPage";
import ReportsPage from "./pages/ReportsPage";
import AdministrationPage from "./pages/administration/AdministrationPage";
import NotFoundPage from "./pages/NotFoundPage";

// Client-facing POC builds ship with VITE_ENABLE_PLATFORM unset, so this
// condition is statically false and Rollup drops the import() (and every
// platform-console file it pulls in) from the bundle entirely - not just
// unlinked, structurally absent. Set VITE_ENABLE_PLATFORM=true to include
// it (internal/staff builds only - see frontend/.env.example).
const PlatformConsoleApp = import.meta.env.VITE_ENABLE_PLATFORM === "true" ? lazy(() => import("./pages/platform/PlatformConsoleApp")) : null;

// Same trick for self-service registration + billing/subscription-purchase
// - the part of the product that's the actual business model, not the
// treasury UI. Off by default; set VITE_ENABLE_BILLING=true for the full
// build. /login is untouched either way - it's the POC's own route in.
const RegistrationPage = import.meta.env.VITE_ENABLE_BILLING === "true" ? lazy(() => import("./pages/RegistrationPage")) : null;
const DummyCheckoutPage = import.meta.env.VITE_ENABLE_BILLING === "true" ? lazy(() => import("./pages/DummyCheckoutPage")) : null;
const BillingReturnPage = import.meta.env.VITE_ENABLE_BILLING === "true" ? lazy(() => import("./pages/BillingReturnPage")) : null;

export default function App() {
  return (
    <>
      <EnvironmentBadge />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sso-callback" element={<SsoCallbackPage />} />
      <Route path="/impersonate-entry" element={<ImpersonationEntryPage />} />

      {RegistrationPage && (
        <Route
          path="/register"
          element={
            <Suspense fallback={null}>
              <RegistrationPage />
            </Suspense>
          }
        />
      )}
      {DummyCheckoutPage && (
        <Route
          path="/billing/dummy-checkout"
          element={
            <Suspense fallback={null}>
              <DummyCheckoutPage />
            </Suspense>
          }
        />
      )}
      {BillingReturnPage && (
        <Route
          path="/billing/return"
          element={
            <Suspense fallback={null}>
              <BillingReturnPage />
            </Suspense>
          }
        />
      )}

      {PlatformConsoleApp && (
        <Route
          path="/platform/*"
          element={
            <Suspense fallback={null}>
              <PlatformConsoleApp />
            </Suspense>
          }
        />
      )}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/account" element={<AccountPage />} />

          <Route
            path="/executive-dashboard"
            element={
              <PlanGate module="advanced_insights" feature="Executive Dashboard">
                <ExecutiveDashboardPage />
              </PlanGate>
            }
          />

          <Route element={<ProtectedRoute permission={[PERMISSIONS.ACCOUNTS_VIEW, PERMISSIONS.ACCOUNTS_MANAGE]} />}>
            <Route path="/bank-accounts" element={<BankAccountsPage />} />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.CASH_POSITION_VIEW]} />}>
            <Route path="/cash-position" element={<CashPositionPage />} />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.PAYMENTS_CREATE]} />}>
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/:id" element={<PaymentDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.BENEFICIARIES_VIEW, PERMISSIONS.BENEFICIARIES_MANAGE]} />}>
            <Route
              path="/beneficiaries"
              element={
                <PlanGate module="beneficiaries" feature="Beneficiaries & Payment Templates">
                  <BeneficiariesPage />
                </PlanGate>
              }
            />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.INCOMING_VIEW, PERMISSIONS.INCOMING_MANAGE]} />}>
            <Route
              path="/incoming"
              element={
                <PlanGate module="incoming" feature="Incoming Transactions">
                  <IncomingPage />
                </PlanGate>
              }
            />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.TRANSFERS_VIEW, PERMISSIONS.TRANSFERS_CREATE]} />}>
            <Route
              path="/transfers"
              element={
                <PlanGate module="transfers" feature="Inter-Bank Transfers">
                  <TransfersPage />
                </PlanGate>
              }
            />
            <Route path="/transfers/:id" element={<TransferDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.APPROVALS_ACT, PERMISSIONS.PAYMENTS_CREATE, PERMISSIONS.TRANSFERS_CREATE]} />}>
            <Route path="/approvals" element={<ApprovalCenterPage />} />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.FORECASTS_VIEW]} />}>
            <Route
              path="/forecast"
              element={
                <PlanGate module="forecast" feature="Cash Forecast">
                  <ForecastPage />
                </PlanGate>
              }
            />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.REPORTS_VIEW]} />}>
            <Route
              path="/reports"
              element={
                <PlanGate module="reports_export" feature="Reports">
                  <ReportsPage />
                </PlanGate>
              }
            />
          </Route>

          <Route element={<ProtectedRoute permission={[PERMISSIONS.AUDIT_VIEW]} />}>
            <Route
              path="/audit-trail"
              element={
                <PlanGate module="audit" feature="Audit Trail">
                  <AuditTrailPage />
                </PlanGate>
              }
            />
          </Route>

          <Route
            element={<ProtectedRoute permission={[PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.BANKS_MANAGE]} />}
          >
            <Route path="/administration/*" element={<AdministrationPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      </Routes>
    </>
  );
}
