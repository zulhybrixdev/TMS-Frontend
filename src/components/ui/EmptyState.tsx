import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-plane text-ink-muted">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="mt-1 text-[13px] text-ink-secondary max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-critical-soft text-status-critical">!</div>
      <div>
        <p className="text-sm font-medium text-ink">Something went wrong</p>
        {message && <p className="mt-1 text-[13px] text-ink-secondary max-w-sm">{message}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-[13px] font-medium text-brand hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
