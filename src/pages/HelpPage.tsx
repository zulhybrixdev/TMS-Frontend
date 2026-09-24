import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { ChevronDown, Lock, Search } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { useSubscription } from "../hooks/useSubscription";
import { PLAN_CATALOG } from "../lib/plans";
import { CATEGORIES, FAQ, UI, type Block, type CategoryId, type FaqItem } from "../lib/help-content";
import { useLanguage } from "../i18n";

const fill = (template: string, vars: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

export default function HelpPage() {
  // The language is the app-wide one (top-bar switch), not a Help-page setting.
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const location = useLocation();
  const { data: subscription } = useSubscription();
  const t = UI[lang];

  // #faq-id in the URL opens and scrolls to that answer, so other pages (or
  // support messages) can link straight to one.
  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (!id || !FAQ.some((f) => f.id === id)) return;
    setCategory("all");
    setQuery("");
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => document.getElementById(`faq-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash]);

  const currentPlan = subscription?.subscription.plan;
  const requiredPlanName = (item: FaqItem) => (item.module ? Object.values(PLAN_CATALOG).find((p) => p.modules.includes(item.module!))?.name : undefined);

  const flatten = (blocks: Block[]) => blocks.map((b) => (Array.isArray(b) ? b.join(" ") : b)).join(" ");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return FAQ.filter((f) => (category === "all" || f.category === category) && (!needle || `${f.q[lang]} ${flatten(f.a[lang])}`.toLowerCase().includes(needle)));
  }, [query, category, lang]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allOpen = visible.length > 0 && visible.every((f) => open.has(f.id));

  return (
    <div lang={lang}>
      <PageHeader
        title={t.title}
        description={t.subtitle}
      />

      <Card>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} className="pl-9" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip active={category === "all"} onClick={() => setCategory("all")}>
              {t.all}
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.title[lang]}
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
            <span>{fill(t.results, { n: visible.length })}</span>
            {visible.length > 0 && (
              <button type="button" className="font-medium text-brand hover:underline" onClick={() => setOpen(allOpen ? new Set() : new Set(visible.map((f) => f.id)))}>
                {allOpen ? t.collapseAll : t.expandAll}
              </button>
            )}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" />} title={t.noResults} />
        ) : (
          <ul>
            {visible.map((item) => {
              const isOpen = open.has(item.id);
              const planName = requiredPlanName(item);
              const locked = !!item.module && !!currentPlan && !currentPlan.modules.includes(item.module);
              return (
                <li key={item.id} id={`faq-${item.id}`} className="scroll-mt-4 border-b border-border last:border-0">
                  <button type="button" onClick={() => toggle(item.id)} aria-expanded={isOpen} aria-controls={`faq-body-${item.id}`} className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-plane">
                    <span>
                      <span className="text-[14.5px] font-medium text-ink">{item.q[lang]}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-ink-muted">{CATEGORIES.find((c) => c.id === item.category)?.title[lang]}</span>
                        {planName && (
                          <Badge tone={locked ? "warning" : "brand"}>
                            {locked && <Lock className="h-3 w-3" />}
                            {fill(t.needs, { plan: planName })}
                          </Badge>
                        )}
                      </span>
                    </span>
                    <ChevronDown className={clsx("mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div id={`faq-body-${item.id}`} className="space-y-3 px-5 pb-5 text-[13.5px] leading-relaxed text-ink-secondary">
                      {item.a[lang].map((block, i) =>
                        Array.isArray(block) ? (
                          <ul key={i} className="list-disc space-y-1 pl-5">
                            {block.map((line, j) => (
                              <li key={j}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p key={i}>{block}</p>
                        )
                      )}
                      {planName && (
                        <p className={clsx("rounded-lg px-3 py-2 text-xs", locked ? "bg-status-warning-soft text-status-warning" : "bg-brand-soft text-brand")}>
                          {locked ? fill(t.notInPlan, { current: currentPlan?.name ?? "", plan: planName }) : t.inPlan}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="mt-3 text-center text-xs text-ink-muted">{t.note}</p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx("rounded-full border px-3 py-1 text-xs font-medium transition-colors", active ? "border-brand bg-brand-soft text-brand" : "border-border text-ink-secondary hover:border-ink-muted hover:text-ink")}
    >
      {children}
    </button>
  );
}
