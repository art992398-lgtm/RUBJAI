import type { Transaction, Transfer } from "./types";

// running balance per account, all-time: income - expense +/- transfers.
// transactions with no accountId don't belong to any wallet and are excluded.
export function accountBalances(
  transactions: Transaction[],
  transfers: Transfer[]
): Record<string, number> {
  const m: Record<string, number> = {};
  for (const t of transactions) {
    if (!t.accountId) continue;
    m[t.accountId] = (m[t.accountId] ?? 0) + (t.type === "income" ? t.amount : -t.amount);
  }
  for (const tr of transfers) {
    m[tr.fromAccountId] = (m[tr.fromAccountId] ?? 0) - tr.amount;
    m[tr.toAccountId] = (m[tr.toAccountId] ?? 0) + tr.amount;
  }
  return m;
}
