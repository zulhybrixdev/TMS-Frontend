import { Link } from "react-router-dom";
import { t } from "../i18n";

// "Terms and Conditions · Privacy Policy" - the always-available way to reach the
// legal documents. Opens in a new tab so nothing in progress is lost. Not shown
// on the sign-in and registration pages, which carry the fuller "you agree to..."
// sentence with the same links (see LegalAgreement).
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-[12px] text-ink-muted ${className}`}>
      <Link to="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
        {t("Terms and Conditions")}
      </Link>
      {" · "}
      <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
        {t("Privacy Policy")}
      </Link>
    </p>
  );
}
