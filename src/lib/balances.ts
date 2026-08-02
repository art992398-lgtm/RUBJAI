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

// net of transactions with no accountId — money that isn't attributed to any
// wallet. If this isn't shown somewhere, the sum of account balances silently
// stops matching the overall total balance and the per-wallet view looks wrong.
export function unassignedBalance(transactions: Transaction[]): number {
  let total = 0;
  for (const t of transactions) {
    if (t.accountId) continue;
    total += t.type === "income" ? t.amount : -t.amount;
  }
  return total;
}
