import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "./Input";

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search...",
  filters,
  actions,
  hideSearch = false,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  hideSearch?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {!hideSearch && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="h-9 w-56 pl-8" />
          </div>
        )}
        {filters}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
