import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { t } from "../i18n";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-5xl font-semibold text-ink-muted">404</p>
      <p className="text-sm text-ink-secondary">{t("This page doesn't exist or you don't have access to it.")}</p>
      <Link to="/">
        <Button variant="outline">{t("Back to Dashboard")}</Button>
      </Link>
    </div>
  );
}
