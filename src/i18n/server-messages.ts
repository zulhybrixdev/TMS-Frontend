import { t } from ".";

// The backend writes its own messages in English (validation and business-rule
// errors, notifications, dashboard alerts). tServer() shows them in the user's
// language: an exact message is looked up as-is, and messages that carry a
// name, amount or reference are matched by pattern and rebuilt from a
// translatable template ({1}, {2}... are the pattern's captured groups).
// Anything it doesn't recognise is shown unchanged (English) - never dropped or
// blanked. To cover a new backend message, add a pattern here and its Malay
// text in ms.ts.

type Rule = [RegExp, string | ((m: RegExpMatchArray) => string)];
const RULES: Rule[] = [];
const on = (pattern: RegExp, template: string | ((m: RegExpMatchArray) => string)) => RULES.push([pattern, template]);

// A payment/transfer "label" is embedded inside several messages:
//   "Payment PMT-2026-000012 to Some Vendor" / "Transfer TRF-2026-000004: A → B"
function tLabel(label: string): string {
  let m = label.match(/^Payment (\S+) to (.+)$/);
  if (m) return t("Payment {1} to {2}", { 1: m[1], 2: m[2] });
  m = label.match(/^Transfer (\S+): (.+) → (.+)$/);
  if (m) return t("Transfer {1}: {2} → {3}", { 1: m[1], 2: m[2], 3: m[3] });
  return label;
}

// ── approvals & notifications ──
on(/^(.+) has been fully approved and processed\.$/, "{1} has been fully approved and processed.");
on(/^(.+) has been fully approved and is scheduled to post on (.+)\.$/, "{1} has been fully approved and is scheduled to post on {2}.");
on(/^(.+) was rejected\. Reason: (.+)$/, "{1} was rejected. Reason: {2}");
on(/^(.+) was rejected\.$/, "{1} was rejected.");
on(/^A (payment|transfer) of (.+) has been awaiting your approval past its SLA - please action it\.$/, "A {1} of {2} has been awaiting your approval past its SLA - please action it.");
on(/^A (payment|transfer) of (.+) is awaiting your approval\.$/, "A {1} of {2} is awaiting your approval.");
on(/^"(.+)" auto-created a new draft payment \((.+)\) - review and submit it for approval\.$/, "\"{1}\" auto-created a new draft payment ({2}) - review and submit it for approval.");
on(/^(.+) to (.+) reached its due date and has been posted\.$/, "{1} to {2} reached its due date and has been posted.");
on(/^(TRF-\S+) reached its transfer date and has been posted\.$/, "{1} reached its transfer date and has been posted.");
on(/^(.+) is below its minimum balance by (.+)\. (.+) holds (.+) above its target balance\.$/, "{1} is below its minimum balance by {2}. {3} holds {4} above its target balance.");
// ── dashboard alerts ──
on(/^(.+) below minimum balance$/, "{1} below minimum balance");
on(/^(.+) holds excess cash$/, "{1} holds excess cash");
on(/^(.+) balance not updated recently$/, "{1} balance not updated recently");
on(/^Shortfall of (.+)\. A transfer is recommended\.$/, "Shortfall of {1}. A transfer is recommended.");
on(/^(.+) above target balance\.$/, "{1} above target balance.");
on(/^Last updated (.+)\.$/, "Last updated {1}.");
// ── business-rule errors ──
on(/^Payment currency \((.+)\) must match the source account's currency \((.+)\)\. Pick a .+ account\.$/, "Payment currency ({1}) must match the source account's currency ({2}). Pick a {1} account.");
on(/^Currency \((.+)\) must match the destination account's currency \((.+)\)\.$/, "Currency ({1}) must match the destination account's currency ({2}).");
on(/^Both accounts must be in the transfer currency \((.+)\)\. Source is (.+), destination is (.+)\.$/, "Both accounts must be in the transfer currency ({1}). Source is {2}, destination is {3}.");
on(/^Cannot execute transfer: (.+)$/, "Cannot execute transfer: {1}");
on(/^Transfer would bring the source account below its minimum balance\. Maximum allowed is (.+)\.$/, "Transfer would bring the source account below its minimum balance. Maximum allowed is {1}.");
on(/^A banker acceptance with reference (.+) already exists$/, "A banker acceptance with reference {1} already exists");
on(/^Requires role "(.+)" to act on this approval level$/, "Requires role \"{1}\" to act on this approval level");
on(/^Missing required permission: (.+)$/, "Missing required permission: {1}");
on(/^This feature requires an upgrade \(needs: (.+)\)$/, "This feature requires an upgrade (needs: {1})");
on(/^Already on the (.+) plan$/, "Already on the {1} plan");
on(/^Your (.+) plan is limited to (\d+) bank accounts\. Upgrade to add more\.$/, "Your {1} plan is limited to {2} bank accounts. Upgrade to add more.");
on(/^Your (.+) plan is limited to (\d+) users\. Upgrade to add more\.$/, "Your {1} plan is limited to {2} users. Upgrade to add more.");
on(/^You have (\d+) bank accounts, which exceeds the (.+) plan's limit of (\d+)\. Close accounts before downgrading\.$/, "You have {1} bank accounts, which exceeds the {2} plan's limit of {3}. Close accounts before downgrading.");
on(/^You have (\d+) users, which exceeds the (.+) plan's limit of (\d+)\. Deactivate users before downgrading\.$/, "You have {1} users, which exceeds the {2} plan's limit of {3}. Deactivate users before downgrading.");

export function tServer(message: string): string {
  if (!message) return message;
  const exact = t(message);
  if (exact !== message) return exact;
  if (/^(Payment \S+ to |Transfer \S+: )/.test(message)) return tLabel(message);
  for (const [pattern, template] of RULES) {
    const m = message.match(pattern);
    if (!m) continue;
    if (typeof template === "function") return template(m);
    const vars: Record<string, string> = {};
    m.slice(1).forEach((v, i) => (vars[String(i + 1)] = /^(payment|transfer)$/.test(v) ? t(v) : /^(Payment|Transfer) /.test(v ?? "") ? tLabel(v) : v));
    return t(template, vars);
  }
  return message;
}
