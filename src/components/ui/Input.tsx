import { t } from "../../i18n";
import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

const fieldBase =
  "block w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:opacity-50 disabled:bg-plane";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className, error, ...rest }, ref) => (
    <input ref={ref} className={clsx(fieldBase, error && "border-status-critical focus:ring-status-critical/30 focus:border-status-critical", className)} {...rest} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  ({ className, error, ...rest }, ref) => (
    <textarea ref={ref} className={clsx(fieldBase, "resize-none", error && "border-status-critical", className)} {...rest} />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  ({ className, error, children, ...rest }, ref) => (
    <div className="relative">
      <select ref={ref} className={clsx(fieldBase, "appearance-none pr-9", error && "border-status-critical", className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
    </div>
  )
);
Select.displayName = "Select";

export function ErrorText({ children }: { children?: string }) {
  // Validation messages come from module-level zod schemas (English, evaluated
  // once at import), so they are translated here, when shown.
  if (!children) return null;
  return <p className="text-xs text-status-critical mt-1">{t(children)}</p>;
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  const { required, children, className, ...rest } = props;
  return (
    <label className={clsx("block text-[13px] font-medium text-ink-secondary mb-1.5", className)} {...rest}>
      {children}
      {required && <span className="text-status-critical"> *</span>}
    </label>
  );
}
