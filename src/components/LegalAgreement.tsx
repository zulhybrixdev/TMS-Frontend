import { Link } from "react-router-dom";
import { t } from "../i18n";

// "By ..., you agree to the Terms and Privacy Policy" line shown on the sign-in
// and registration pages. The links open in a new tab so nothing typed is lost.
export function LegalAgreement({ action }: { action: "signIn" | "register" }) {
  const link = "font-medium text-brand hover:underline";
  return (
    <p className="text-center text-[12px] leading-relaxed text-ink-muted">
      {action === "signIn" ? t("By signing in, you confirm that you have read, understood and agree to our") : t("By creating an account, you confirm that you have read, understood and agree to our")}{" "}
      <Link to="/terms" target="_blank" rel="noopener noreferrer" className={link}>
        {t("Terms and Conditions")}
      </Link>{" "}
      {t("and")}{" "}
      <Link to="/privacy" target="_blank" rel="noopener noreferrer" className={link}>
        {t("Privacy Policy")}
      </Link>
      .
    </p>
  );
}
