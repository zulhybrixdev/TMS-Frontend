// Shared API response/domain types mirrored from the backend's response
// envelope and Prisma models. Kept hand-written and deliberately loose
// (camelCase, numbers instead of Decimal) since the API already normalises
// Prisma output before it reaches the client.

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  jobTitle?: string | null;
  roles: string[];
  permissions: string[];
  // Set only when this session came from Platform Console "View as tenant".
  impersonatedByPlatformAdminId?: string;
}

export type PlanKey = "FREE" | "PRO" | "PRO_PLUS";
export type ModuleKey = "incoming" | "transfers" | "approval_rules" | "forecast" | "reports_export" | "beneficiaries" | "audit" | "advanced_insights" | "sso";
export type TenantAccountType = "INDIVIDUAL" | "TEAM" | "ENTERPRISE";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  priceMYR: number;
  billingCycle: "monthly" | null;
  description: string;
  modules: ModuleKey[];
  limits: { users: number | null; bankAccounts: number | null };
}

export interface SubscriptionInfo {
  planKey: PlanKey;
  plan: PlanDefinition;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING_PAYMENT";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SsoConfig {
  id: string;
  tenantId: string;
  keycloakIdpAlias: string;
  ssoRequired: boolean;
  autoProvisionUsers: boolean;
  allowedEmailDomains: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInvoiceRow {
  id: string;
  planKey: PlanKey;
  amountMYR: number;
  status: "PENDING" | "PAID" | "FAILED";
  gateway: string;
  gatewayOrderId: string;
  paidAt: string | null;
  createdAt: string;
}

export interface SubscriptionMeResponse {
  tenant: { id: string; name: string; slug: string; accountType: TenantAccountType };
  subscription: SubscriptionInfo;
  plans: PlanDefinition[];
  usage: {
    users: { current: number; limit: number | null };
    bankAccounts: { current: number; limit: number | null };
  };
  invoices: SubscriptionInvoiceRow[];
}

export type CashStatus = "SHORTFALL" | "BELOW_TARGET" | "HEALTHY" | "EXCESS";

export interface BankAccountRow {
  id: string;
  bankId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currencyCode: string;
  accountType: "OPERATING" | "COLLECTION" | "DISBURSEMENT" | "RESERVE";
  status: "ACTIVE" | "DORMANT" | "CLOSED";
  lastBalanceAt: string | null;
  updatedAt: string;
  currentBalance: number;
  reservedAmount: number;
  minimumBalance: number;
  targetBalance: number;
  availableCash: number;
  shortfall: number;
  excessCash: number;
  cashStatus: CashStatus;
}

export interface Bank {
  id: string;
  name: string;
  swiftCode?: string | null;
  country: string;
  status: "ACTIVE" | "INACTIVE";
  _count?: { accounts: number };
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  isBase: boolean;
}

export interface Beneficiary {
  id: string;
  nickname: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  currencyCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTemplateRow {
  id: string;
  name: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryBank: string;
  amount: number;
  currencyCode: string;
  sourceAccountId: string;
  sourceAccount?: { accountName: string; bank?: { name: string } };
  description?: string | null;
  reference?: string | null;
  frequency: "NONE" | "WEEKLY" | "MONTHLY";
  nextRunDate: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransferRecommendation {
  sourceAccountId: string;
  sourceAccountName: string;
  destinationAccountId: string;
  destinationAccountName: string;
  currencyCode: string;
  amount: number;
  reason: string;
}

export interface CashPositionSummary {
  totalCash: number;
  availableCash: number;
  minimumRequired: number;
  targetTotal: number;
  excessOverTarget: number;
  totalShortfall: number;
  totalExcess: number;
  accountCount: number;
  accountsInShortfall: number;
  byBank: { key: string; total: number }[];
  byCurrency: { key: string; total: number }[];
  accounts: BankAccountRow[];
  recommendations: TransferRecommendation[];
}

export type PaymentStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PROCESSED" | "CANCELLED";
export type TransferStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
export type IncomingStatus = "EXPECTED" | "RECEIVED" | "RECONCILED" | "CANCELLED";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ApprovalAction {
  id: string;
  level: number;
  action: "APPROVE" | "REJECT" | "COMMENT";
  comment: string | null;
  actedAt: string;
  actor: { id: string; name: string; email: string };
}

export interface ApprovalRequestSummary {
  id: string;
  entityType: "PAYMENT" | "TRANSFER";
  status: ApprovalStatus;
  currentLevel: number;
  requiredLevels: number;
  amount: number;
  currencyCode: string;
  dueAt: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  label: string;
  requestedById: string;
  payment: { id: string; paymentNumber: string; beneficiaryName: string; sourceAccount?: string; bank?: string } | null;
  transfer: { id: string; transferNumber: string; sourceAccount?: string; destinationAccount?: string } | null;
  actions: ApprovalAction[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryBank: string;
  amount: number;
  currencyCode: string;
  sourceAccountId: string;
  sourceAccountName?: string;
  sourceBankName?: string;
  paymentDate: string;
  description?: string | null;
  reference?: string | null;
  attachmentUrl?: string | null;
  status: PaymentStatus;
  requestedBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  approvalRequests: ApprovalRequestSummary[];
  // Only present on GET /payments/:id and the POST /submit response - not
  // computed for list views (would be an N+1 query per row).
  anomaly?: { flagged: boolean; reason?: string };
}

export interface IncomingTransaction {
  id: string;
  reference: string;
  sourceName: string;
  amount: number;
  currencyCode: string;
  destinationAccountId: string;
  destinationAccountName?: string;
  destinationBankName?: string;
  valueDate: string;
  description?: string | null;
  status: IncomingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  sourceAccountId: string;
  sourceAccountName?: string;
  sourceBankName?: string;
  destinationAccountId: string;
  destinationAccountName?: string;
  destinationBankName?: string;
  amount: number;
  suggestedAmount?: number | null;
  currencyCode: string;
  reason?: string | null;
  transferDate: string;
  status: TransferStatus;
  isSystemRecommended: boolean;
  requestedBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  approvalRequests: ApprovalRequestSummary[];
}

export interface ForecastEntry {
  id: string;
  accountId: string | null;
  accountName: string;
  currencyCode: string;
  forecastDate: string;
  category: "INFLOW" | "OUTFLOW";
  sourceType: "PAYMENT" | "INCOMING" | "TRANSFER" | "MANUAL";
  sourceReference?: string | null;
  amount: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  description?: string | null;
  createdAt: string;
}

export interface ForecastProjectionPoint {
  date: string;
  inflow: number;
  outflow: number;
  netChange: number;
  projectedBalance: number;
}

export interface DashboardAlert {
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
}

export interface DashboardSummary {
  totals: {
    totalCash: number;
    availableCash: number;
    minimumRequired: number;
    totalShortfall: number;
    totalExcess: number;
    excessOverTarget: number;
  };
  cashByBank: { key: string; total: number }[];
  cashByCurrency: { key: string; total: number }[];
  incoming30d: number;
  outgoing30d: number;
  pendingApprovalsCount: number;
  pendingApprovals: ApprovalRequestSummary[];
  recommendations: TransferRecommendation[];
  cashFlowTrend: { date: string; closingBalance: number }[];
  forecast30d: ForecastProjectionPoint[];
  projectedBalanceEnd: number;
  alerts: DashboardAlert[];
  recentAuditCount: number;
  accountsInShortfall: number;
}

export interface LiveFxRates {
  base: string;
  rates: Record<string, number>;
  source: "twelvedata" | "frankfurter-fallback";
  asOf: string;
}

export interface ConsolidatedCashPosition {
  baseCurrency: string;
  totalInBase: number;
  breakdown: { currencyCode: string; total: number; rateToBase: number | null; totalInBase: number | null }[];
  unconvertedCurrencies: string[];
}

export interface ExecutiveSummary {
  cashTrend90d: { date: string; closingBalance: number }[];
  paymentVolumeByMonth: { month: string; count: number; total: number }[];
  avgApprovalTurnaroundHours: number | null;
  slaComplianceRate: number | null;
  completedApprovalsCount: number;
  topBeneficiaries: { name: string; account: string; total: number; count: number }[];
}

export interface ReportDefinitionRow {
  id: string;
  name: string;
  baseReport: string;
  baseReportLabel: string;
  columns: string[];
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AvailableReport {
  key: string;
  label: string;
  columns: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  description?: string | null;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  jobTitle?: string | null;
  department?: string | null;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: string; name: string }[];
}

export interface ApprovalRule {
  id: string;
  entityType: "PAYMENT" | "TRANSFER";
  currencyCode?: string | null;
  department?: string | null;
  minAmount: number;
  maxAmount?: number | null;
  requiredLevels: number;
  requiredRoleLevel1: string;
  requiredRoleLevel2?: string | null;
  isActive: boolean;
  priority: number;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}

export interface AuditLogRow {
  id: string;
  actorId: string | null;
  actor: { id: string; name: string; email: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeState: unknown;
  afterState: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface CommentRow {
  id: string;
  entityType: "PAYMENT" | "TRANSFER";
  entityId: string;
  body: string;
  mentionedUserIds: string[];
  author: { id: string; name: string; email: string };
  createdAt: string;
}

export interface MentionableUser {
  id: string;
  name: string;
  email: string;
}

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ALERT" | "APPROVAL";
  isRead: boolean;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
}

export interface SecurityPolicy {
  mfaRequired: boolean;
  totalUsers: number;
  usersWithMfa: number;
}
