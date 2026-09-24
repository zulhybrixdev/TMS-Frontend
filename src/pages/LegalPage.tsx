import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark } from "lucide-react";
import { getLang, useLanguage } from "../i18n";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { LEGAL_UI, LEGAL_VERSIONS, PRIVACY, TERMS, isLegalDraft, legalVars, type LegalBlock } from "../lib/legal-content";

const fill = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);

// Public page (no sign-in needed) showing the Terms or the Privacy Policy in the
// user's chosen language. The same language switch as the rest of the app.
export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const ui = LEGAL_UI[lang];
  const sections = kind === "terms" ? TERMS : PRIVACY;
  const vars = legalVars();
  const version = kind === "terms" ? LEGAL_VERSIONS.terms : LEGAL_VERSIONS.privacy;
  const renderBlock = (block: LegalBlock, i: number) =>
    Array.isArray(block) ? (
      <ul key={i} className="list-disc space-y-1.5 pl-5">
        {block.map((line, j) => (
          <li key={j}>{fill(line, vars)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{fill(block, vars)}</p>
    );

  return (
    <div className="min-h-screen bg-plane" lang={getLang()}>
      <header className="border-b border-border bg-surface-raised">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/login" className="flex items-center gap-2 text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="font-display text-[14px] font-semibold">Treasury System</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/login"))} className="mb-4 flex items-center gap-1.5 text-[13px] text-ink-secondary hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {ui.back}
        </button>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">{kind === "terms" ? ui.termsTitle : ui.privacyTitle}</h1>
        <p className="mt-1 text-[13px] text-ink-muted">{fill(ui.version, { date: version })}</p>

        {isLegalDraft() && <div className="mt-4 rounded-lg border border-status-warning/30 bg-status-warning-soft px-4 py-3 text-[13px] text-status-warning">{ui.draft}</div>}

        <div className="mt-6 space-y-7 rounded-card border border-border bg-surface-raised p-6 text-[14px] leading-relaxed text-ink-secondary">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="space-y-3">
              <h2 className="font-display text-[16px] font-semibold text-ink">{s.heading[lang]}</h2>
              {s.body[lang].map(renderBlock)}
            </section>
          ))}
        </div>

        <p className="mt-6 text-center text-[13px]">
          <Link to={kind === "terms" ? "/privacy" : "/terms"} className="font-medium text-brand hover:underline">
            {kind === "terms" ? ui.otherPrivacy : ui.otherTerms}
          </Link>
        </p>
      </main>
    </div>
  );
}
