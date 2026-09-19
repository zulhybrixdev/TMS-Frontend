import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { useDebounce } from "./useDebounce";
import type { Paginated } from "../lib/types";

// Shared list-page state (page/search/sort/filters) + a TanStack Query bound
// to the backend's {items,meta} pagination envelope. Used by every screen
// with a filterable/sortable/searchable table.
export function useListQuery<T>(queryKey: string, buildPath: (params: URLSearchParams) => string, opts: { defaultSort?: string; extraKey?: unknown } = {}) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(opts.defaultSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const debouncedSearch = useDebounce(search, 350);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (sortBy) {
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
  }
  for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);

  const query = useQuery({
    queryKey: [queryKey, page, pageSize, debouncedSearch, sortBy, sortDir, filters, opts.extraKey],
    queryFn: () => api.getPaginated<T>(buildPath(params)),
    placeholderData: keepPreviousData,
  });

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const setFilter = (key: string, value: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return {
    data: query.data?.items ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    setPage: (p: number) => setPage(p),
    search,
    setSearch: (s: string) => {
      setPage(1);
      setSearch(s);
    },
    sortBy,
    sortDir,
    toggleSort,
    filters,
    setFilter,
  };
}

export type UseListQueryResult<T> = ReturnType<typeof useListQuery<T>>;
