import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type { Bank, Currency, BankAccountRow } from "../lib/types";

export function useBanks() {
  return useQuery({ queryKey: ["banks"], queryFn: () => api.get<Bank[]>("/banks") });
}

export function useCurrencies() {
  return useQuery({ queryKey: ["currencies"], queryFn: () => api.get<Currency[]>("/currencies") });
}

export function useAllAccounts() {
  return useQuery({
    queryKey: ["bank-accounts", "all"],
    queryFn: () => api.getPaginated<BankAccountRow>("/bank-accounts?pageSize=100"),
  });
}
