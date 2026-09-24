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
  CircleHelp,
  LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "../../lib/permissions";
import { tk } from "../../i18n";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: tk("Dashboard"), icon: LayoutDashboard, permission: [PERMISSIONS.DASHBOARD_VIEW] },
  { to: "/executive-dashboard", label: tk("Executive Dashboard"), icon: LineChart, permission: [PERMISSIONS.DASHBOARD_VIEW] },
  { to: "/bank-accounts", label: tk("Bank Accounts"), icon: Landmark, permission: [PERMISSIONS.ACCOUNTS_VIEW, PERMISSIONS.ACCOUNTS_MANAGE] },
  { to: "/cash-position", label: tk("Cash Position"), icon: Scale, permission: [PERMISSIONS.CASH_POSITION_VIEW] },
  { to: "/treasury-desk", label: tk("Daily Cash Desk"), icon: CalendarDays, permission: [PERMISSIONS.CASH_POSITION_VIEW] },
  { to: "/payments", label: tk("Payments"), icon: ArrowUpRight, permission: [PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.PAYMENTS_CREATE] },
  { to: "/beneficiaries", label: tk("Beneficiaries"), icon: BookUser, permission: [PERMISSIONS.BENEFICIARIES_VIEW, PERMISSIONS.BENEFICIARIES_MANAGE] },
  { to: "/incoming", label: tk("Incoming Transactions"), icon: ArrowDownLeft, permission: [PERMISSIONS.INCOMING_VIEW, PERMISSIONS.INCOMING_MANAGE] },
  { to: "/transfers", label: tk("Inter-Bank Transfers"), icon: ArrowLeftRight, permission: [PERMISSIONS.TRANSFERS_VIEW, PERMISSIONS.TRANSFERS_CREATE] },
  { to: "/banker-acceptances", label: tk("Banker Acceptances"), icon: Scroll, permission: [PERMISSIONS.CASH_POSITION_VIEW] },
  { to: "/approvals", label: tk("Approval Center"), icon: ClipboardCheck, permission: [PERMISSIONS.APPROVALS_ACT, PERMISSIONS.PAYMENTS_CREATE, PERMISSIONS.TRANSFERS_CREATE] },
  { to: "/forecast", label: tk("Cash Forecast"), icon: TrendingUp, permission: [PERMISSIONS.FORECASTS_VIEW] },
  { to: "/reports", label: tk("Reports"), icon: FileBarChart, permission: [PERMISSIONS.REPORTS_VIEW] },
  { to: "/audit-trail", label: tk("Audit Trail"), icon: History, permission: [PERMISSIONS.AUDIT_VIEW] },
  { to: "/administration", label: tk("Administration"), icon: Settings, permission: [PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.BANKS_MANAGE] },
  // Open to every signed-in user - no permission or plan needed.
  { to: "/help", label: tk("Help & FAQ"), icon: CircleHelp },
];
