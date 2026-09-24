import {
  LayoutDashboard,
  Landmark,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ClipboardCheck,
  TrendingUp,
  FileBarChart,
  Settings,
  BookUser,
  History,
  LineChart,
  CalendarDays,
  Scroll,
  LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "../../lib/permissions";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, permission: [PERMISSIONS.DASHBOARD_VIEW] },
  { to: "/executive-dashboard", label: "Executive Dashboard", icon: LineChart, permission: [PERMISSIONS.DASHBOARD_VIEW] },
  { to: "/bank-accounts", label: "Bank Accounts", icon: Landmark, permission: [PERMISSIONS.ACCOUNTS_VIEW, PERMISSIONS.ACCOUNTS_MANAGE] },
  { to: "/cash-position", label: "Cash Position", icon: Scale, permission: [PERMISSIONS.CASH_POSITION_VIEW] },
  { to: "/treasury-desk", label: "Daily Cash Desk", icon: CalendarDays, permission: [PERMISSIONS.CASH_POSITION_VIEW] },
  { to: "/payments", label: "Payments", icon: ArrowUpRight, permission: [PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.PAYMENTS_CREATE] },
  { to: "/beneficiaries", label: "Beneficiaries", icon: BookUser, permission: [PERMISSIONS.BENEFICIARIES_VIEW, PERMISSIONS.BENEFICIARIES_MANAGE] },
  { to: "/incoming", label: "Incoming Transactions", icon: ArrowDownLeft, permission: [PERMISSIONS.INCOMING_VIEW, PERMISSIONS.INCOMING_MANAGE] },
  { to: "/transfers", label: "Inter-Bank Transfers", icon: ArrowLeftRight, permission: [PERMISSIONS.TRANSFERS_VIEW, PERMISSIONS.TRANSFERS_CREATE] },
  { to: "/banker-acceptances", label: "Banker Acceptances", icon: Scroll, permission: [PERMISSIONS.CASH_POSITION_VIEW] },
  { to: "/approvals", label: "Approval Center", icon: ClipboardCheck, permission: [PERMISSIONS.APPROVALS_ACT, PERMISSIONS.PAYMENTS_CREATE, PERMISSIONS.TRANSFERS_CREATE] },
  { to: "/forecast", label: "Cash Forecast", icon: TrendingUp, permission: [PERMISSIONS.FORECASTS_VIEW] },
  { to: "/reports", label: "Reports", icon: FileBarChart, permission: [PERMISSIONS.REPORTS_VIEW] },
  { to: "/audit-trail", label: "Audit Trail", icon: History, permission: [PERMISSIONS.AUDIT_VIEW] },
  { to: "/administration", label: "Administration", icon: Settings, permission: [PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.BANKS_MANAGE] },
];
